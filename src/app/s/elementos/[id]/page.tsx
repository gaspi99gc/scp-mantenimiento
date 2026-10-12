// Ficha de elemento (pantalla 7 de la propuesta). Todos los controles del elemento se ven
// y se registran acá (D3).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { controlesDeFicha, historialDeElemento, svgDelQR, urlDeEtiqueta } from "@/components/elementos/consultas";
import { EtiquetaQR } from "@/components/elementos/etiqueta-qr";
import { FichaElemento } from "@/components/elementos/ficha-elemento";
import { Cifra, Encabezado } from "@/components/ui";
import { elementoDe, localDe, supervisorActual } from "@/lib/datos";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const elemento = elementoDe(id);
  return { title: elemento ? `${elemento.tipo}, ${elemento.codigo}` : "Equipo" };
}

export default async function FichaDeElemento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
          <span className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span>{elemento.ubicacion}</span>
            <Cifra className="text-lg text-tinta">{elemento.codigo}</Cifra>
          </span>
        }
      />

      <FichaElemento
        elemento={elemento}
        controles={controlesDeFicha(elemento.id)}
        historial={historialDeElemento(elemento.id)}
        supervisor={supervisorActual.nombre}
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
