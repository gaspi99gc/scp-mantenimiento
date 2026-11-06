// Ficha de un documento de un local: su estado, si aplica en este local y qué pide la guía.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { documento } from "@/components/documentos/consultas";
import { DecidirAplica } from "@/components/documentos/decidir-aplica";
import { MarcaDocumento } from "@/components/documentos/estado";
import { Dato, Encabezado } from "@/components/ui";
import { cargarDatos, localDe } from "@/lib/datos";
import { dondeAparece, solapaDe, textoVencimiento, type Documento } from "@/lib/documentos";

const esId = (id: string) => /^[0-9a-f-]{36}$/.test(id);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const d = esId(id) ? await documento(id) : undefined;
  return { title: d?.tipo.nombre ?? "Documento" };
}

function frase(d: Documento): string {
  if (d.estado === "a_definir") return "Falta definir si aplica en este local.";
  if (d.estado === "no_aplica") return `No aplica: ${d.motivoNoAplica}`;
  return "Falta el PDF.";
}

export default async function FichaDocumento({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { solapa } = await searchParams;
  if (!esId(id)) notFound();
  await cargarDatos();
  const d = await documento(id);
  if (!d) notFound();
  const local = localDe(d.localId);
  if (!local) notFound();

  // Vuelve a la solapa desde la que se llegó, o a la primera en la que aparece el documento.
  const vuelta = solapaDe(solapa, d.tipo.solapas[0]?.solapa);
  const t = d.tipo;
  const vence = textoVencimiento(t);

  return (
    <>
      <Encabezado
        volver={{ href: `/s/locales/${local.id}?ver=documentos&solapa=${vuelta}`, texto: local.nombre }}
        titulo={t.nombre}
        bajada={`${local.nombre} · ${dondeAparece(t)}`}
      >
        <p className="mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-medium">
          <MarcaDocumento estado={d.estado} />
          {frase(d)}
        </p>
      </Encabezado>

      <DecidirAplica id={d.id} aplica={d.aplica} motivo={d.motivoNoAplica} solapa={vuelta} />

      <section className="mb-8" aria-labelledby="que-pide">
        <h2 id="que-pide" className="rotulo mb-2 text-xl">
          Qué pide la guía
        </h2>
        <div className="divide-y divide-junta rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel px-4 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:divide-y-0">
          {t.detalle && (
            <div className="sm:col-span-2">
              <Dato rotulo="Detalle">{t.detalle}</Dato>
            </div>
          )}
          <Dato rotulo="Vencimiento">
            {vence}
            {vence !== "No vence" && (
              <span className="text-cemento">
                {" "}
                · pasa a Por vencer {t.anticipacionDias === 1 ? "1 día" : `${t.anticipacionDias} días`} antes
              </span>
            )}
          </Dato>
          <Dato rotulo="Se pide">{t.aplica === "siempre" ? "Siempre" : "De corresponder"}</Dato>
          {t.norma && <Dato rotulo="Norma">{t.norma}</Dato>}
          <Dato rotulo="PDF">
            <span className="text-cemento">Sin cargar</span>
          </Dato>
        </div>
      </section>
    </>
  );
}
