// Agregar un documento al catálogo (solo admin). Al crearlo activo, todos los locales lo reciben.

import type { Metadata } from "next";
import { catalogoDocumentos } from "@/components/documentos/consultas";
import { FormularioTipoDocumento } from "@/components/documentos/formulario-tipo";
import { Encabezado } from "@/components/ui";
import { solapaDe } from "@/lib/documentos";
import { exigirAdmin } from "@/lib/sesion";

export const metadata: Metadata = { title: "Agregar documento" };

export default async function NuevoTipoDocumento({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  await exigirAdmin();
  const { solapa } = await searchParams;
  const s = solapaDe(solapa);
  const todos = await catalogoDocumentos();
  const grupos = [...new Set(todos.map((x) => x.grupo).filter((g): g is string => !!g))];

  return (
    <>
      <Encabezado
        volver={{ href: `/s/mas/documentos?solapa=${s}`, texto: "Catálogo de documentos" }}
        titulo="Agregar documento"
      />
      <FormularioTipoDocumento
        grupos={grupos}
        inicial={{
          nombre: "",
          grupo: "",
          detalle: "",
          norma: "",
          solapas: [s],
          aplica: "siempre",
          vence: "manual",
          periodoValor: "",
          anticipacion: "30",
          uso: "activo",
        }}
      />
    </>
  );
}
