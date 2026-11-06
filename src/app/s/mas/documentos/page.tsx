// Catálogo de documentos: los papeles que pide la inspección, por solapa, en el orden de la guía.
// Lo ve todo el staff; solo el admin lo edita.

import type { Metadata } from "next";
import Link from "next/link";
import { catalogoDocumentos } from "@/components/documentos/consultas";
import { SelectorSolapas } from "@/components/documentos/solapas";
import { IconoSiguiente, IconoSumar } from "@/components/iconos";
import { BotonLink, CLASE_PLANILLA, cx, Encabezado, TituloPlanilla } from "@/components/ui";
import {
  deSolapa,
  nombreSolapa,
  porGrupo,
  SOLAPAS,
  solapaDe,
  textoVencimiento,
  type Solapa,
  type TipoDocumento,
} from "@/lib/documentos";
import { exigirStaff } from "@/lib/sesion";

export const metadata: Metadata = { title: "Catálogo de documentos" };

function resumenSolapa(tipos: TipoDocumento[]): string {
  const activos = tipos.filter((t) => t.activo).length;
  const aValidar = tipos.filter((t) => t.aValidar).length;
  return [`${activos} ${activos === 1 ? "activo" : "activos"}`, aValidar && `${aValidar} a validar`].filter(Boolean).join(" · ");
}

export default async function CatalogoDocumentos({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const usuario = await exigirStaff();
  const esAdmin = usuario.rol === "admin";
  const { solapa: pedida } = await searchParams;
  const solapa = solapaDe(pedida);
  const tipos = await catalogoDocumentos();
  const resumen = Object.fromEntries(SOLAPAS.map((s) => [s.clave, resumenSolapa(deSolapa(tipos, s.clave))])) as Record<
    Solapa,
    string
  >;
  const nombre = SOLAPAS.find((s) => s.clave === solapa)!.nombre;
  const enSolapa = deSolapa(tipos, solapa);

  const fila = (t: TipoDocumento) => {
    const contenido = (
      <div className="flex min-h-14 items-center gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{t.nombre}</p>
          {t.detalle && <p className="mt-0.5 text-sm text-cemento">{t.detalle}</p>}
          <p className="mt-0.5 text-sm">
            {t.aplica === "siempre" ? "Siempre" : "De corresponder"} · {textoVencimiento(t)}
            {t.periodoUnidad && ` · aviso ${t.anticipacionDias === 1 ? "1 día" : `${t.anticipacionDias} días`} antes`}
            {t.solapas.length > 1 &&
              ` · también en ${t.solapas.filter((s) => s.solapa !== solapa).map((s) => nombreSolapa(s.solapa)).join(" y ")}`}
          </p>
        </div>
        {!t.activo && (
          <span className="rotulo inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-[var(--radius-chip)] border border-dashed border-tinta px-1.5 text-[14px]">
            {t.aValidar ? "A validar" : "Apagado"}
          </span>
        )}
        {esAdmin && <IconoSiguiente tamano={20} className="shrink-0 text-cemento" />}
      </div>
    );
    return (
      <li key={t.id} className={cx(!t.activo && "text-cemento")}>
        {esAdmin ? (
          <Link
            href={`/s/mas/documentos/${t.id}`}
            aria-label={`Editar ${t.nombre}`}
            className="block transition-colors hover:bg-yeso/60 active:bg-yeso"
          >
            {contenido}
          </Link>
        ) : (
          contenido
        )}
      </li>
    );
  };

  return (
    <>
      <Encabezado
        volver={{ href: "/s/mas", texto: "Más" }}
        titulo="Catálogo de documentos"
        bajada="Los papeles que pide la inspección, por solapa y en el orden de la guía."
        acciones={
          esAdmin && (
            <BotonLink href={`/s/mas/documentos/nuevo?solapa=${solapa}`} variante="secundario" className="px-3">
              <IconoSumar tamano={20} />
              Agregar<span className="sr-only sm:not-sr-only sm:-ml-1"> documento</span>
            </BotonLink>
          )
        }
      />

      <SelectorSolapas activa={solapa} href={(s) => `/s/mas/documentos?solapa=${s}`} resumen={resumen} />

      {porGrupo(enSolapa).map((g, i) => (
        <section key={`${g.grupo ?? "todos"}-${i}`} className="mb-8">
          <TituloPlanilla titulo={g.grupo ?? nombre} />
          <ul className={CLASE_PLANILLA}>{g.items.map(fila)}</ul>
        </section>
      ))}
    </>
  );
}
