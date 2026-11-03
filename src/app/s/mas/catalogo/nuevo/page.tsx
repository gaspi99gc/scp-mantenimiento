// Agregar un control al catálogo (solo admin).

import type { Metadata } from "next";
import { FormularioControl } from "@/components/cuenta/formulario-control";
import { Encabezado } from "@/components/ui";
import { exigirAdmin } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Agregar control" };

export default async function NuevoControl() {
  await exigirAdmin();
  const db = await clienteServidor();
  const { data: tipos } = await db.from("tipo_equipo").select("id, nombre").eq("activo", true).order("nombre");

  return (
    <>
      <Encabezado
        volver={{ href: "/s/mas/catalogo", texto: "Catálogo" }}
        titulo="Agregar control"
        bajada="Un control nuevo: qué es, cada cuánto se hace y quién lo hace."
      />
      <FormularioControl
        tiposEquipo={tipos ?? []}
        inicial={{
          nombre: "",
          alcance: "equipos",
          equipos: [],
          periodoUnidad: "mes",
          periodoValor: "12",
          base: "desde_ejecucion",
          anticipacion: "10",
          ejecutor: "scp",
          norma: "",
          pideOblea: false,
          activo: true,
        }}
      />
    </>
  );
}
