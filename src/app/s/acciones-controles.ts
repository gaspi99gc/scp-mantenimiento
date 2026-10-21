"use server";

// Lo que escribe el supervisor: registrar un control y cambiar el cilindro de un equipo.
// La cuenta de la próxima fecha la hace la base (registrar_control y reemplazar_unidad, en una
// transacción); acá se valida lo que llega, se llama a la base y se devuelve lo que quedó guardado.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TIPO } from "@/lib/catalogo";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type ResultadoRegistro = { error?: string; vencimientoNuevo?: string };
export type ResultadoUnidad = { error?: string; vencimientos?: { controlId: string; vencimiento?: string }[] };

const Fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const TextoCorto = z.string().trim().max(200);

const Registro = z.object({
  controlId: z.string().uuid(),
  fecha: Fecha,
  resultado: z.enum(["ok", "reemplazo", "observado", "no_apto", "no_realizado"]),
  ejecutor: TextoCorto.min(1),
  oblea: TextoCorto.optional(),
  nota: z.string().trim().max(1000).optional(),
  fechaTarjeta: Fecha.optional(),
});

const Unidad = z.object({
  elementoId: z.string().uuid(),
  serie: TextoCorto.min(1),
  fabricacion: Fecha,
  desde: Fecha,
  ultimaPrueba: Fecha.optional(),
});

/** Los errores que la base explica (fecha futura, falta un dato) se muestran tal cual; los demás, genéricos. */
function mensaje(error: { code?: string; message: string }): string {
  if (error.code === "22023" || error.code === "P0002") return error.message;
  if (error.code === "42501") return "No tenés permiso para hacer esto.";
  return "No se pudo guardar. Revisá la conexión y probá de nuevo.";
}

export async function registrarControl(datos: z.input<typeof Registro>): Promise<ResultadoRegistro> {
  await exigirStaff();
  const r = Registro.safeParse(datos);
  if (!r.success) return { error: "Faltan datos o hay alguno mal cargado." };

  const db = await clienteServidor();
  const { data: registroId, error } = await db.rpc("registrar_control", {
    p_control: r.data.controlId,
    p_fecha: r.data.fecha,
    p_resultado: r.data.resultado,
    p_ejecutor: r.data.ejecutor,
    p_oblea: r.data.oblea || undefined,
    p_nota: r.data.nota || undefined,
    p_fecha_tarjeta: r.data.fechaTarjeta,
  });
  if (error) return { error: mensaje(error) };

  const { data: registro } = await db.from("registro").select("vencimiento_nuevo").eq("id", registroId).single();
  revalidatePath("/s", "layout");
  return { vencimientoNuevo: registro?.vencimiento_nuevo ?? undefined };
}

export async function reemplazarUnidad(datos: z.input<typeof Unidad>): Promise<ResultadoUnidad> {
  await exigirStaff();
  const u = Unidad.safeParse(datos);
  if (!u.success) return { error: "Faltan datos de la unidad nueva o hay alguno mal cargado." };

  const db = await clienteServidor();
  const { error } = await db.rpc("reemplazar_unidad", {
    p_equipo: u.data.elementoId,
    p_serie: u.data.serie,
    p_fabricacion: u.data.fabricacion,
    p_desde: u.data.desde,
  });
  if (error) return { error: mensaje(error) };

  // Si la unidad nueva trae una prueba hidráulica posterior a la fabricación, se registra esa fecha.
  if (u.data.ultimaPrueba && u.data.ultimaPrueba !== u.data.fabricacion) {
    const { data: ph } = await db
      .from("control")
      .select("id")
      .eq("equipo_id", u.data.elementoId)
      .eq("tipo_control_id", TIPO.pruebaHidraulica)
      .maybeSingle();
    if (ph) {
      const { error: errorPh } = await db.rpc("registrar_control", {
        p_control: ph.id,
        p_fecha: u.data.ultimaPrueba,
        p_resultado: "ok",
        p_ejecutor: "Dato de la unidad nueva",
        p_nota: `Última prueba hidráulica del cilindro ${u.data.serie}.`,
      });
      if (errorPh) return { error: `La unidad se cambió, pero no se pudo cargar la prueba hidráulica: ${mensaje(errorPh)}` };
    }
  }

  const { data: controles } = await db
    .from("control")
    .select("id, vencimiento")
    .eq("equipo_id", u.data.elementoId);
  revalidatePath("/s", "layout");
  return { vencimientos: (controles ?? []).map((c) => ({ controlId: c.id, vencimiento: c.vencimiento ?? undefined })) };
}
