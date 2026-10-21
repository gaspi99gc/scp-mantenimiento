"use server";

// Alta de un local: elige un cliente existente o crea uno nuevo, y crea el local.
// La base le crea sola los controles de todo el local (plagas, puesta a tierra…): "todos llevan todo".

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoAlta = { error?: string; valores?: Record<string, string> };

const texto = (max: number) => z.string().trim().max(max);
const obligatorio = (max: number, mensaje: string) => texto(max).min(1, mensaje);

/** "30712345678", "30-71234567-8" o "30 71234567 8" → "30-71234567-8". */
function normalizarCuit(cuit: string): string | undefined {
  const d = cuit.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` : undefined;
}

const Local = z.object({
  nombre: obligatorio(120, "Falta el nombre del local."),
  direccion: obligatorio(200, "Falta la dirección."),
  barrio: obligatorio(80, "Falta el barrio o la localidad."),
  rubro: z.enum(["gastronomico", "retail", "farmacia", "oficina", "otro"], { message: "Elegí el rubro." }),
  horario: texto(200),
  requisitos: texto(300),
  encargadoNombre: texto(120),
  encargadoTelefono: texto(40),
  supervisorId: z.union([z.literal(""), z.string().uuid()]),
});

const ClienteNuevo = z.object({
  clienteNombre: obligatorio(120, "Falta el nombre del cliente."),
  razonSocial: obligatorio(160, "Falta la razón social."),
  cuit: z.string(),
});

export async function crearLocal(_previo: EstadoAlta, datos: FormData): Promise<EstadoAlta> {
  await exigirStaff();
  const valores = Object.fromEntries([...datos.entries()].map(([k, v]) => [k, String(v)]));
  const fallar = (error: string): EstadoAlta => ({ error, valores });

  const local = Local.safeParse(valores);
  if (!local.success) return fallar(local.error.issues[0].message);

  const db = await clienteServidor();
  let clienteId = valores.clienteId ?? "";

  if (valores.clienteModo === "nuevo") {
    const cliente = ClienteNuevo.safeParse(valores);
    if (!cliente.success) return fallar(cliente.error.issues[0].message);
    const cuit = normalizarCuit(cliente.data.cuit);
    if (!cuit) return fallar("El CUIT tiene que tener 11 números (por ejemplo 30-71234567-8).");

    const { data, error } = await db
      .from("cliente")
      .insert({ nombre: cliente.data.clienteNombre, razon_social: cliente.data.razonSocial, cuit })
      .select("id")
      .single();
    if (error) {
      return fallar(
        error.code === "23505"
          ? "Ya hay un cliente con ese CUIT: elegí \"Sí, elegirlo\" y buscalo en la lista."
          : "No se pudo crear el cliente. Probá de nuevo.",
      );
    }
    clienteId = data.id;
  } else if (!z.string().uuid().safeParse(clienteId).success) {
    return fallar("Elegí el cliente.");
  }

  const l = local.data;
  const { data: nuevo, error } = await db
    .from("local")
    .insert({
      cliente_id: clienteId,
      nombre: l.nombre,
      direccion: l.direccion,
      barrio: l.barrio,
      rubro: l.rubro,
      horario_acceso: l.horario,
      requisitos_acceso: l.requisitos || null,
      encargado_nombre: l.encargadoNombre,
      encargado_telefono: l.encargadoTelefono,
      supervisor_id: l.supervisorId || null,
    })
    .select("id")
    .single();
  if (error) {
    // Si el cliente era nuevo, ya quedó creado: al reintentar se lo elige de la lista.
    return {
      error: "No se pudo crear el local. Probá de nuevo.",
      valores: valores.clienteModo === "nuevo" ? { ...valores, clienteModo: "existente", clienteId } : valores,
    };
  }

  revalidatePath("/s", "layout");
  redirect(`/s/locales/${nuevo.id}`);
}
