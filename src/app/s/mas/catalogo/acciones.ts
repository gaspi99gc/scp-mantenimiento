"use server";

// Catálogo de controles: solo el admin crea, edita y desactiva. Las reglas de la base (RLS) también
// lo exigen. Un cambio de período rige desde la próxima renovación: no se recalculan los vencimientos
// que ya están abiertos.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sesion";
import { clienteAdmin } from "@/lib/supabase/admin";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoCatalogo = { error?: string; ok?: string; valores?: Record<string, string | string[]> };

const Control = z.object({
  id: z.union([z.literal(""), z.string().uuid()]).default(""),
  nombre: z.string({ message: "Falta el nombre." }).trim().min(2, "Falta el nombre.").max(80, "El nombre es muy largo."),
  alcance: z.enum(["local", "equipos"], { message: "Elegí a qué se aplica." }),
  equipos: z.array(z.string().uuid()).default([]),
  periodoUnidad: z.enum(["dia", "mes", "anio", "manual"], { message: "Elegí cada cuánto se hace." }),
  periodoValor: z.string().default(""),
  base: z.enum(["desde_ejecucion", "desde_vencimiento"]).default("desde_ejecucion"),
  anticipacion: z.coerce.number({ message: "Los días de aviso van en números." }).int().min(0).max(365, "Como mucho 365 días de aviso."),
  ejecutor: z.enum(["scp", "tercero"]),
  norma: z.string().trim().max(80).default(""),
  pideOblea: z.literal("si").optional(),
});

const OBLEA = "Número de oblea";
const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export async function guardarControl(_previo: EstadoCatalogo, datos: FormData): Promise<EstadoCatalogo> {
  await exigirAdmin();
  const valores: Record<string, string | string[]> = {};
  for (const [k, v] of datos.entries()) {
    if (k === "equipos") valores.equipos = [...((valores.equipos as string[]) ?? []), String(v)];
    else valores[k] = String(v);
  }
  const fallar = (error: string): EstadoCatalogo => ({ error, valores });

  const leido = Control.safeParse(valores);
  if (!leido.success) return fallar(leido.error.issues[0].message);
  const c = leido.data;

  let periodoValor: number | null = null;
  if (c.periodoUnidad !== "manual") {
    periodoValor = Number(c.periodoValor);
    if (!Number.isInteger(periodoValor) || periodoValor < 1 || periodoValor > 600) {
      return fallar("Poné cada cuántos días, meses o años se hace (un número entero).");
    }
  }
  if (c.alcance === "equipos" && c.equipos.length === 0) return fallar("Elegí al menos un tipo de equipo.");

  const db = await clienteServidor();
  const fila = {
    nombre: c.nombre,
    aplica_al_local: c.alcance === "local",
    periodo_unidad: c.periodoUnidad,
    periodo_valor: periodoValor,
    base: c.base,
    anticipacion_dias: c.anticipacion,
    ejecutor: c.ejecutor,
    norma: c.norma || null,
  };

  let id = c.id;
  if (id) {
    // Se conserva la evidencia que no es la oblea (fotos, certificados), que se va a pedir más adelante.
    const { data: actual } = await db.from("tipo_control").select("evidencia").eq("id", id).single();
    const otras = (actual?.evidencia ?? []).filter((e) => e !== OBLEA);
    const { error } = await db
      .from("tipo_control")
      .update({ ...fila, evidencia: c.pideOblea ? [...otras, OBLEA] : otras })
      .eq("id", id);
    if (error) return fallar("No se pudo guardar el control. Probá de nuevo.");
  } else {
    const { data, error } = await db
      .from("tipo_control")
      .insert({
        ...fila,
        evidencia: c.pideOblea ? [OBLEA] : [],
        verbo: `Registrar ${minuscula(c.nombre)}`,
        texto_hecho: `${c.nombre}: registrado`,
      })
      .select("id")
      .single();
    if (error) return fallar("No se pudo crear el control. Probá de nuevo.");
    id = data.id;
  }

  // A qué tipos de equipo se aplica: se agregan los nuevos y se sacan los que ya no van.
  const { data: vinculos } = await db.from("tipo_control_equipo").select("tipo_equipo_id").eq("tipo_control_id", id);
  const antes = new Set((vinculos ?? []).map((v) => v.tipo_equipo_id));
  const ahora = new Set(c.alcance === "equipos" ? c.equipos : []);
  const agregar = [...ahora].filter((t) => !antes.has(t));
  const sacar = [...antes].filter((t) => !ahora.has(t));
  if (agregar.length) {
    const { error } = await db
      .from("tipo_control_equipo")
      .insert(agregar.map((t) => ({ tipo_control_id: id, tipo_equipo_id: t })));
    if (error) return fallar("El control se guardó, pero no se pudieron vincular los tipos de equipo.");
  }
  if (sacar.length) {
    await db.from("tipo_control_equipo").delete().eq("tipo_control_id", id).in("tipo_equipo_id", sacar);
  }

  // Todos llevan todo: lo que ya está cargado recibe el control nuevo, sin fecha.
  const admin = clienteAdmin();
  if (c.alcance === "local") {
    const { data: locales } = await admin.from("local").select("id");
    const { data: ya } = await admin.from("control").select("local_id").eq("tipo_control_id", id).is("equipo_id", null);
    const tienen = new Set((ya ?? []).map((x) => x.local_id));
    const faltan = (locales ?? []).filter((l) => !tienen.has(l.id));
    if (faltan.length) await admin.from("control").insert(faltan.map((l) => ({ local_id: l.id, tipo_control_id: id })));
  } else if (agregar.length) {
    const { data: equipos } = await admin.from("equipo").select("id, local_id").in("tipo_equipo_id", agregar);
    const { data: ya } = await admin.from("control").select("equipo_id").eq("tipo_control_id", id).not("equipo_id", "is", null);
    const tienen = new Set((ya ?? []).map((x) => x.equipo_id));
    const faltan = (equipos ?? []).filter((e) => !tienen.has(e.id));
    if (faltan.length) {
      await admin.from("control").insert(faltan.map((e) => ({ local_id: e.local_id, equipo_id: e.id, tipo_control_id: id })));
    }
  }

  revalidatePath("/s", "layout");
  redirect("/s/mas/catalogo");
}

export async function cambiarActivoControl(id: string, activo: boolean): Promise<EstadoCatalogo> {
  await exigirAdmin();
  if (!z.string().uuid().safeParse(id).success || typeof activo !== "boolean") return { error: "Datos inválidos." };
  const db = await clienteServidor();
  const { error } = await db.from("tipo_control").update({ activo }).eq("id", id);
  if (error) return { error: "No se pudo guardar el cambio. Probá de nuevo." };
  revalidatePath("/s", "layout");
  return {
    ok: activo
      ? "Control activado: los locales y equipos nuevos lo van a recibir."
      : "Control desactivado: los locales y equipos nuevos ya no lo reciben. Los que ya lo tienen lo conservan con su historial.",
  };
}
