// Agregar equipo a un local: tipo, código, ubicación y, si lleva cilindro, su serie y fabricación.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormularioEquipo } from "@/components/elementos/formulario-equipo";
import { Encabezado } from "@/components/ui";
import { cargarDatos, elementosDeLocal, localDe } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Agregar equipo" };

const PALABRAS_CORTAS = new Set(["de", "del", "la", "el", "los", "las", "y"]);

/** Prefijo de los códigos del local: el que ya usan sus equipos, o las iniciales del nombre (La Espiga Caballito → LEC). */
function prefijoDe(nombreLocal: string, codigos: string[]): string {
  const cuenta = new Map<string, number>();
  for (const c of codigos) {
    const p = c.split("-")[0];
    if (p) cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
  }
  const masUsado = [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  if (masUsado) return masUsado;
  const iniciales = nombreLocal
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .filter((w) => w && !PALABRAS_CORTAS.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join("")
    .replace(/[^A-Z0-9]/g, "");
  return iniciales.slice(0, 4) || "EQ";
}

export default async function NuevoEquipo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarDatos();
  const local = localDe(id);
  if (!local) notFound();

  const codigos = elementosDeLocal(local.id).map((e) => e.codigo);
  const db = await clienteServidor();
  const { data: tipos } = await db.from("tipo_equipo").select("id, nombre, usa_unidad").eq("activo", true).order("nombre");

  return (
    <>
      <Encabezado
        volver={{ href: `/s/locales/${local.id}?ver=elementos`, texto: local.nombre }}
        titulo="Agregar equipo"
        bajada={`En ${local.nombre}, ${local.direccion}.`}
      />
      <FormularioEquipo
        localId={local.id}
        tipos={(tipos ?? []).map((t) => ({ id: t.id, nombre: t.nombre, usaUnidad: t.usa_unidad }))}
        prefijo={prefijoDe(local.nombre, codigos)}
        codigosExistentes={codigos}
      />
    </>
  );
}
