// Consultas de los documentos para inspecciones. Leen con la sesión de quien navega: las reglas de la
// base (RLS) le devuelven a cada uno lo suyo. Los documentos de un tipo apagado en el catálogo no se muestran.

import "server-only";
import { estadoDocumento, type Documento, type Solapa, type TipoDocumento } from "@/lib/documentos";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import type { Database } from "@/lib/supabase/tipos-db";

type FilaTipo = Database["public"]["Tables"]["tipo_documento"]["Row"] & {
  tipo_documento_solapa: { solapa: Solapa; orden: number }[];
};

const CON_SOLAPAS = "*, tipo_documento_solapa(solapa, orden)";

function aTipo(t: FilaTipo): TipoDocumento {
  return {
    id: t.id,
    nombre: t.nombre,
    grupo: t.grupo ?? undefined,
    detalle: t.detalle ?? undefined,
    aplica: t.aplica,
    periodoValor: t.periodo_valor ?? undefined,
    periodoUnidad: t.periodo_unidad ?? undefined,
    anticipacionDias: t.anticipacion_dias,
    norma: t.norma ?? undefined,
    aValidar: t.a_validar,
    activo: t.activo,
    solapas: t.tipo_documento_solapa,
  };
}

/** Todo el catálogo de documentos, también los apagados. */
export async function catalogoDocumentos(): Promise<TipoDocumento[]> {
  await exigirStaff();
  const db = await clienteServidor();
  const { data, error } = await db.from("tipo_documento").select(CON_SOLAPAS).order("nombre");
  if (error) throw new Error(`No se pudo leer el catálogo de documentos: ${error.message}`);
  return (data as FilaTipo[]).map(aTipo);
}

export async function tipoDocumento(id: string): Promise<TipoDocumento | undefined> {
  await exigirStaff();
  const db = await clienteServidor();
  const { data } = await db.from("tipo_documento").select(CON_SOLAPAS).eq("id", id).maybeSingle();
  return data ? aTipo(data as FilaTipo) : undefined;
}

type FilaDocumento = { id: string; local_id: string; aplica: boolean | null; motivo_no_aplica: string | null; tipo_documento: FilaTipo };

const DOCUMENTO = `id, local_id, aplica, motivo_no_aplica, tipo_documento(${CON_SOLAPAS})`;

function aDocumento(d: FilaDocumento): Documento {
  return {
    id: d.id,
    localId: d.local_id,
    tipo: aTipo(d.tipo_documento),
    aplica: d.aplica,
    motivoNoAplica: d.motivo_no_aplica ?? undefined,
    estado: estadoDocumento(d.aplica),
  };
}

/** Los documentos de un local cuyo tipo está activo en el catálogo. */
export async function documentosDeLocal(localId: string): Promise<Documento[]> {
  await exigirStaff();
  const db = await clienteServidor();
  const { data, error } = await db.from("documento").select(DOCUMENTO).eq("local_id", localId);
  if (error) throw new Error(`No se pudieron leer los documentos: ${error.message}`);
  return (data as unknown as FilaDocumento[]).filter((d) => d.tipo_documento.activo).map(aDocumento);
}

export async function documento(id: string): Promise<Documento | undefined> {
  await exigirStaff();
  const db = await clienteServidor();
  const { data } = await db.from("documento").select(DOCUMENTO).eq("id", id).maybeSingle();
  return data ? aDocumento(data as unknown as FilaDocumento) : undefined;
}
