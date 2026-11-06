"use server";

// Decidir si un documento aplica en un local (D23). Lo puede hacer el staff; "No aplica" exige el motivo,
// y la base también lo exige. Quién lo decidió y cuándo lo anota la base, no el formulario.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { solapaDe } from "@/lib/documentos";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export type EstadoDecision = { error?: string; motivo?: string };

const Decision = z.object({
  id: z.string().uuid(),
  aplica: z.enum(["si", "no"], { message: "Elegí si aplica o no en este local." }),
  motivo: z.string().trim().max(300, "El motivo es muy largo.").default(""),
  solapa: z.string().default(""),
});

export async function decidirDocumento(_previo: EstadoDecision, datos: FormData): Promise<EstadoDecision> {
  await exigirStaff();
  const valores = Object.fromEntries([...datos.entries()].map(([k, v]) => [k, String(v)]));
  const leido = Decision.safeParse(valores);
  if (!leido.success) return { error: leido.error.issues[0].message, motivo: valores.motivo };
  const d = leido.data;
  if (d.aplica === "no" && !d.motivo) return { error: "Contá por qué no aplica.", motivo: d.motivo };

  const db = await clienteServidor();
  const { data, error } = await db
    .from("documento")
    .update({ aplica: d.aplica === "si", motivo_no_aplica: d.aplica === "no" ? d.motivo : null })
    .eq("id", d.id)
    .select("local_id")
    .maybeSingle();
  if (error || !data) return { error: "No se pudo guardar. Probá de nuevo.", motivo: d.motivo };

  revalidatePath("/s", "layout");
  redirect(`/s/locales/${data.local_id}?ver=documentos&solapa=${solapaDe(d.solapa)}`);
}
