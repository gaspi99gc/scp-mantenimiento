// Pestaña Documentos de la ficha del local: las cuatro solapas y, en la elegida, sus documentos en el
// orden de la guía. Los "De corresponder" que todavía no se definieron van primero: son lo que hay que hacer.

import { Fila, Planilla, Vacio } from "@/components/ui";
import {
  deSolapa,
  frasePendientes,
  pendientes,
  porGrupo,
  SOLAPAS,
  type Documento,
  type Solapa,
} from "@/lib/documentos";
import { ESTADO_DOCUMENTO, MarcaDocumento } from "./estado";
import { SelectorSolapas } from "./solapas";

export function DocumentosDelLocal({
  localId,
  documentos,
  solapa,
}: {
  localId: string;
  documentos: Documento[];
  solapa: Solapa;
}) {
  const resumen = Object.fromEntries(
    SOLAPAS.map((s) => [s.clave, frasePendientes(pendientes(deSolapa(documentos, s.clave)))]),
  ) as Record<Solapa, string>;
  const enSolapa = deSolapa(documentos, solapa);
  const aDefinir = enSolapa.filter((d) => d.estado === "a_definir");
  const resto = enSolapa.filter((d) => d.estado !== "a_definir");
  const nombre = SOLAPAS.find((s) => s.clave === solapa)!.nombre;

  const fila = (d: Documento) => (
    <Fila
      key={d.id}
      href={`/s/documentos/${d.id}?solapa=${solapa}`}
      estado={ESTADO_DOCUMENTO[d.estado].cinta}
      titulo={d.tipo.nombre}
      detalle={d.estado === "no_aplica" ? `No aplica: ${d.motivoNoAplica}` : d.tipo.detalle}
      derecha={<MarcaDocumento estado={d.estado} />}
    />
  );

  return (
    <section aria-labelledby="titulo-seccion">
      <h2 id="titulo-seccion" className="sr-only">
        Documentos
      </h2>
      <p className="mb-3 font-medium">
        {documentos.length === 1 ? "1 documento" : `${documentos.length} documentos`} ·{" "}
        {frasePendientes(pendientes(documentos))}
      </p>

      <SelectorSolapas
        activa={solapa}
        href={(s) => `/s/locales/${localId}?ver=documentos&solapa=${s}`}
        resumen={resumen}
      />

      {enSolapa.length === 0 ? (
        <div className="mb-7">
          <Vacio>{nombre} todavía no tiene documentos activos.</Vacio>
        </div>
      ) : (
        <>
          {aDefinir.length > 0 && (
            <Planilla titulo="Para definir si aplican" aparte={aDefinir.length}>
              {aDefinir.map(fila)}
            </Planilla>
          )}
          {porGrupo(resto).map((g, i) => (
            <Planilla key={`${g.grupo ?? "todos"}-${i}`} titulo={g.grupo ?? nombre}>
              {g.items.map(fila)}
            </Planilla>
          ))}
        </>
      )}
    </section>
  );
}
