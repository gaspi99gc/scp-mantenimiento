// Agregar local: cliente (existente o nuevo) y datos del local.

import type { Metadata } from "next";
import { FormularioLocal } from "@/components/locales/formulario-local";
import { Encabezado } from "@/components/ui";
import { cargarDatos } from "@/lib/datos";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Agregar local" };

export default async function NuevoLocal() {
  const usuario = await exigirStaff();
  const { clientes } = await cargarDatos();
  const db = await clienteServidor();
  const { data: perfiles } = await db.from("perfil").select("id, nombre").eq("activo", true).order("nombre");

  return (
    <>
      <Encabezado
        volver={{ href: "/s/locales", texto: "Locales" }}
        titulo="Agregar local"
        bajada="Elegí el cliente (o cargalo si es nuevo) y completá los datos del local."
      />
      <FormularioLocal
        clientes={[...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((c) => ({ id: c.id, nombre: c.nombre }))}
        supervisores={perfiles ?? []}
        supervisorPorDefecto={usuario.id}
      />
    </>
  );
}
