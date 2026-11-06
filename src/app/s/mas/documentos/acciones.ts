"use server";

// Catálogo de documentos: solo el admin crea y edita (las reglas de la base también lo exigen).
// Al activar un documento, la base lo agrega a todos los locales; al apagarlo, deja de mostrarse pero
// cada local conserva lo que tenía.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SOLAPAS, type Solapa } from "@/lib/documentos";
import { exigirAdmin } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoTipoDocumento = { error?: string; valores?: Record<string, string | string[]> };

const CLAVES = SOLAPAS.map((s) => s.clave) as [Solapa, ...Solapa[]];

const TipoDocumento = z.object({
  id: z.union([z.literal(""), z.string().uuid()]).default(""),
  nombre: z.string({ message: "Falta el nombre." }).trim().min(2, "Falta el nombre.").max(160, "El nombre es muy largo."),
  grupo: z.string().trim().max(60, "El grupo es muy largo.").default(""),
  detalle: z.string().trim().max(300, "El detalle es muy largo.").default(""),
  norma: z.string().trim().max(80, "La norma es muy larga.").default(""),
  solapas: z.array(z.enum(CLAVES)).min(1, "Elegí al menos una solapa."),
  aplica: z.enum(["siempre", "de_corresponder"], { message: "Elegí si se pide siempre o según el local." }),
  vence: z.enum(["no", "manual", "mes", "anio"], { message: "Elegí cuándo vence." }),
  periodoValor: z.string().default(""),
  anticipacion: z.string().default(""),
  uso: z.enum(["activo", "a_validar", "apagado"], { message: "Elegí si se usa." }),
});

export async function guardarTipoDocumento(_previo: EstadoTipoDocumento, datos: FormData): Promise<EstadoTipoDocumento> {
  await exigirAdmin();
  const valores: Record<string, string | string[]> = { solapas: [] };
  for (const [k, v] of datos.entries()) {
    if (k === "solapas") (valores.solapas as string[]).push(String(v));
    else valores[k] = String(v);
  }
  const fallar = (error: string): EstadoTipoDocumento => ({ error, valores });

  const leido = TipoDocumento.safeParse(valores);
  if (!leido.success) return fallar(leido.error.issues[0].message);
  const t = leido.data;

  let periodoValor: number | null = null;
  if (t.vence === "mes" || t.vence === "anio") {
    periodoValor = Number(t.periodoValor);
    if (!Number.isInteger(periodoValor) || periodoValor < 1 || periodoValor > 120) {
      return fallar("Poné cada cuántos meses o años vence (un número entero).");
    }
  }
  let anticipacion = 30;
  if (t.vence !== "no") {
    anticipacion = Number(t.anticipacion);
    if (!Number.isInteger(anticipacion) || anticipacion < 0 || anticipacion > 365) {
      return fallar("Los días de aviso van en números, de 0 a 365.");
    }
  }

  const fila = {
    nombre: t.nombre,
    grupo: t.grupo || null,
    detalle: t.detalle || null,
    norma: t.norma || null,
    aplica: t.aplica,
    periodo_unidad: t.vence === "no" ? null : t.vence,
    periodo_valor: periodoValor,
    anticipacion_dias: anticipacion,
    activo: t.uso === "activo",
    a_validar: t.uso === "a_validar",
  };

  const db = await clienteServidor();
  let id = t.id;
  if (id) {
    const { error } = await db.from("tipo_documento").update(fila).eq("id", id);
    if (error) return fallar("No se pudo guardar el documento. Probá de nuevo.");
  } else {
    const { data, error } = await db.from("tipo_documento").insert(fila).select("id").single();
    if (error) return fallar("No se pudo crear el documento. Probá de nuevo.");
    id = data.id;
  }

  // Solapas: las nuevas van al final de cada una; las que se sacan se desvinculan.
  const { data: vinculos } = await db.from("tipo_documento_solapa").select("solapa").eq("tipo_documento_id", id);
  const antes = new Set((vinculos ?? []).map((v) => v.solapa));
  const ahora = new Set(t.solapas);
  const agregar = [...ahora].filter((s) => !antes.has(s));
  const sacar = [...antes].filter((s) => !ahora.has(s));
  if (agregar.length) {
    const { data: ocupados } = await db.from("tipo_documento_solapa").select("solapa, orden").in("solapa", agregar);
    const ultimo = (s: Solapa) => Math.max(0, ...(ocupados ?? []).filter((o) => o.solapa === s).map((o) => o.orden));
    const { error } = await db
      .from("tipo_documento_solapa")
      .insert(agregar.map((s) => ({ tipo_documento_id: id, solapa: s, orden: ultimo(s) + 1 })));
    if (error) return fallar("El documento se guardó, pero no se pudo poner en las solapas.");
  }
  if (sacar.length) {
    await db.from("tipo_documento_solapa").delete().eq("tipo_documento_id", id).in("solapa", sacar);
  }

  revalidatePath("/s", "layout");
  redirect(`/s/mas/documentos?solapa=${t.solapas[0]}`);
}
