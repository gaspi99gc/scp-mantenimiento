// Editar un control del catálogo (solo admin).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioControl } from "@/components/cuenta/formulario-control";
import { Encabezado } from "@/components/ui";
import { exigirAdmin } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Editar control" };

export default async function EditarControl({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const db = await clienteServidor();
  const [{ data: t }, { data: vinculos }, { data: tipos }] = await Promise.all([
    db.from("tipo_control").select("*").eq("id", id).maybeSingle(),
    db.from("tipo_control_equipo").select("tipo_equipo_id").eq("tipo_control_id", id),
    db.from("tipo_equipo").select("id, nombre").eq("activo", true).order("nombre"),
  ]);
  if (!t) notFound();

  return (
    <>
      <Encabezado volver={{ href: "/s/mas/catalogo", texto: "Catálogo" }} titulo={t.nombre} bajada="Editá la regla de este control." />
      <FormularioControl
        tiposEquipo={tipos ?? []}
        inicial={{
          id: t.id,
          nombre: t.nombre,
          alcance: t.aplica_al_local ? "local" : "equipos",
          equipos: (vinculos ?? []).map((v) => v.tipo_equipo_id),
          periodoUnidad: t.periodo_unidad,
          periodoValor: t.periodo_valor ? String(t.periodo_valor) : "",
          base: t.base,
          anticipacion: String(t.anticipacion_dias),
          ejecutor: t.ejecutor,
          norma: t.norma ?? "",
          pideOblea: t.evidencia.includes("Número de oblea"),
          activo: t.activo,
        }}
      />
    </>
  );
}
