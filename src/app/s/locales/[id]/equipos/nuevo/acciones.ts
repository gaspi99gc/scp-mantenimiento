"use server";

// Alta de un equipo en un local. La base le crea solos sus controles (un matafuego recibe recarga,
// prueba hidráulica y vida útil). Si el tipo lleva cilindro, se carga la unidad instalada y la vida
// útil se calcula desde la fabricación.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { hoy } from "@/lib/fechas";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoEquipo = { error?: string; valores?: Record<string, string> };

const Equipo = z.object({
  localId: z.string().uuid({ message: "Local inválido." }),
  tipoEquipoId: z.string({ message: "Elegí el tipo de equipo." }).uuid({ message: "Elegí el tipo de equipo." }),
  codigo: z
    .string({ message: "Falta el código." })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{1,29}$/, "El código va con letras, números y guiones, sin espacios (por ejemplo ESP1-MAT-01)."),
  ubicacion: z.string({ message: "Falta dónde está." }).trim().min(1, "Falta dónde está.").max(120, "La ubicación es muy larga."),
  detalle: z.string().trim().max(40, "El detalle es muy largo.").default(""),
  serie: z.string().trim().max(40, "El número de serie es muy largo.").default(""),
  fabricacion: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(""),
});

export async function crearEquipo(_previo: EstadoEquipo, datos: FormData): Promise<EstadoEquipo> {
  await exigirStaff();
  const valores = Object.fromEntries([...datos.entries()].map(([k, v]) => [k, String(v)]));
  const fallar = (error: string): EstadoEquipo => ({ error, valores });

  const leido = Equipo.safeParse(valores);
  if (!leido.success) return fallar(leido.error.issues[0].message);
  const e = leido.data;
  if (e.serie && !e.fabricacion) return fallar("Si cargás el número de serie, poné también la fecha de fabricación.");
  if (e.fabricacion && !e.serie) return fallar("Si cargás la fecha de fabricación, poné también el número de serie.");
  if (e.fabricacion && e.fabricacion > hoy()) return fallar("La fecha de fabricación no puede ser posterior a hoy.");

  const db = await clienteServidor();
  const { data: nuevo, error } = await db
    .from("equipo")
    .insert({
      local_id: e.localId,
      tipo_equipo_id: e.tipoEquipoId,
      codigo: e.codigo,
      ubicacion: e.ubicacion,
      detalle: e.detalle || null,
    })
    .select("id")
    .single();
  if (error) {
    return fallar(
      error.code === "23505"
        ? `Ya hay un equipo con el código ${e.codigo} en este local.`
        : "No se pudo crear el equipo. Probá de nuevo.",
    );
  }

  if (e.serie) {
    const { error: errorUnidad } = await db.rpc("reemplazar_unidad", {
      p_equipo: nuevo.id,
      p_serie: e.serie,
      p_fabricacion: e.fabricacion,
      p_desde: hoy(),
    });
    // El equipo ya quedó creado: el cilindro se puede cargar después desde su ficha.
    if (errorUnidad) redirect(`/s/elementos/${nuevo.id}?aviso=sin-unidad`);
  }

  revalidatePath("/s", "layout");
  redirect(`/s/elementos/${nuevo.id}?aviso=nuevo`);
}
