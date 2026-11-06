// Editar un documento del catálogo (solo admin).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogoDocumentos, tipoDocumento } from "@/components/documentos/consultas";
import { FormularioTipoDocumento } from "@/components/documentos/formulario-tipo";
import { Encabezado } from "@/components/ui";
import { SOLAPAS } from "@/lib/documentos";
import { exigirAdmin } from "@/lib/sesion";

export const metadata: Metadata = { title: "Editar documento" };

export default async function EditarTipoDocumento({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [t, todos] = await Promise.all([tipoDocumento(id), catalogoDocumentos()]);
  if (!t) notFound();
  const grupos = [...new Set(todos.map((x) => x.grupo).filter((g): g is string => !!g))];
  const primera = SOLAPAS.find((s) => t.solapas.some((x) => x.solapa === s.clave))?.clave ?? "agc";

  return (
    <>
      <Encabezado
        volver={{ href: `/s/mas/documentos?solapa=${primera}`, texto: "Catálogo de documentos" }}
        titulo={t.nombre}
      />
      <FormularioTipoDocumento
        grupos={grupos}
        inicial={{
          id: t.id,
          nombre: t.nombre,
          grupo: t.grupo ?? "",
          detalle: t.detalle ?? "",
          norma: t.norma ?? "",
          solapas: t.solapas.map((s) => s.solapa),
          aplica: t.aplica,
          vence: !t.periodoUnidad ? "no" : t.periodoUnidad === "manual" ? "manual" : t.periodoUnidad === "anio" ? "anio" : "mes",
          periodoValor: t.periodoValor ? String(t.periodoValor) : "",
          anticipacion: String(t.anticipacionDias),
          uso: t.activo ? "activo" : t.aValidar ? "a_validar" : "apagado",
        }}
      />
    </>
  );
}
