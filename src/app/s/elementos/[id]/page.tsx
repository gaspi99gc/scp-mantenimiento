// Ficha de elemento (pantalla 7 de la propuesta). Todos los controles del elemento se ven
// y se registran acá (D3).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { controlesDeFicha, historialDeElemento, svgDelQR, urlDeEtiqueta } from "@/components/elementos/consultas";
import { EtiquetaQR } from "@/components/elementos/etiqueta-qr";
import { FichaElemento } from "@/components/elementos/ficha-elemento";
import { Chapa, Encabezado } from "@/components/ui";
import { cargarDatos, elementoDe, localDe } from "@/lib/datos";
import { exigirStaff } from "@/lib/sesion";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  await cargarDatos();
  const elemento = elementoDe(id);
  return { title: elemento ? `${elemento.tipo}, ${elemento.codigo}` : "Equipo" };
}

export default async function FichaDeElemento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { aviso } = await searchParams;
  await cargarDatos();
  const usuario = await exigirStaff();
  const elemento = elementoDe(id);
  if (!elemento) notFound();
  const local = localDe(elemento.localId);
  if (!local) notFound();

  const url = urlDeEtiqueta(elemento.qrToken);
  const svg = await svgDelQR(url);

  return (
    <>
      <Encabezado
        volver={{ href: `/s/locales/${local.id}`, texto: local.nombre }}
        titulo={elemento.tipo}
        bajada={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Chapa className="text-[19px]">{elemento.codigo}</Chapa>
            <span>{elemento.ubicacion}</span>
          </span>
        }
      />

      {aviso === "nuevo" && (
        <p role="status" className="mb-6 rounded-[var(--radius-planilla)] border-2 border-verde bg-papel p-3 font-medium">
          Equipo creado con sus controles. Imprimí su etiqueta QR (abajo) y pegala en el equipo.
        </p>
      )}
      {aviso === "sin-unidad" && (
        <p role="alert" className="mb-6 rounded-[var(--radius-planilla)] border-2 border-rojo bg-papel p-3 font-medium">
          El equipo se creó, pero no se pudo guardar el cilindro. Cargalo con “Reemplazar unidad”.
        </p>
      )}
      <FichaElemento
        elemento={elemento}
        controles={controlesDeFicha(elemento.id)}
        historial={historialDeElemento(elemento.id)}
        supervisor={usuario.nombre}
        etiqueta={
          <EtiquetaQR
            svg={svg}
            codigo={elemento.codigo}
            ubicacion={elemento.ubicacion}
            direccion={url.replace(/^https?:\/\//, "")}
          />
        }
      />
    </>
  );
}
