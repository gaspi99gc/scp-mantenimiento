// Bloques de la pantalla Hoy. Server Components: no tienen interacción propia.

import Link from "next/link";
import type { ReactNode } from "react";
import { IconoLlave, IconoReloj, IconoSiguiente } from "@/components/iconos";
import { TiraPerforada } from "@/components/tira";
import { BotonLink, Cifra, CLASE_PLANILLA, cx, FechaFila, Fila, TituloPlanilla } from "@/components/ui";
import { fechaConDia, fechaCorta, textoRelativo } from "@/lib/fechas";
import type { FilaControl, GrupoLocal, PedidoAbierto, VisitaEnCurso, VisitaProxima } from "./consultas";
import { cantidad } from "./texto";

/** Sección de la pantalla: título de sección y su contenido. */
export function Seccion({
  id,
  titulo,
  aparte,
  children,
}: {
  id: string;
  titulo: ReactNode;
  aparte?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="mb-10">
      <TituloPlanilla id={id} titulo={titulo} aparte={aparte} />
      {children}
    </section>
  );
}

/** Lista simple con el aspecto de planilla. */
export function PlanillaSimple({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx(CLASE_PLANILLA, className)}>{children}</ul>;
}

// ——— Visita en curso ———
// El único bloque oscuro de la pantalla: es lo que está pasando ahora. La tira se perfora a medida que se registra.

export function BloqueVisitaEnCurso({ visita }: { visita: VisitaEnCurso }) {
  const pendientes = visita.controles - visita.registrados;
  const avance =
    visita.registrados === 0
      ? `${cantidad(visita.controles, "control", "controles")} por registrar`
      : pendientes === 0
        ? "Ya registraste todos los controles"
        : `${visita.registrados} de ${visita.controles} controles registrados`;

  return (
    <section
      aria-labelledby={`en-curso-${visita.id}`}
      className="mb-10 overflow-hidden rounded-[var(--radius-planilla)] bg-tinta text-papel"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-2.5 lg:px-6">
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          <IconoReloj tamano={19} />
          Visita en curso
        </span>
        <Cifra className="text-[22px] leading-none">{visita.franja}</Cifra>
      </div>
      <div className="px-4 pb-4 pt-3.5 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-x-10 lg:px-6 lg:pb-5">
        <div className="min-w-0">
          <h2 id={`en-curso-${visita.id}`} className="titulo text-[28px] lg:text-[32px]">
            {visita.local.nombre}
          </h2>
          <p className="mt-1 text-[15px] text-hierro">
            {visita.local.direccion}, {visita.local.barrio}
          </p>
          <p className="mt-3 leading-snug">
            Visita en curso. {avance}
            {visita.vencidos > 0 && `, ${visita.vencidos === 1 ? "uno vencido" : `${visita.vencidos} vencidos`}`}.
          </p>
          <TiraPerforada
            oscura
            className="mt-3"
            hechos={Array.from({ length: visita.controles }, (_, i) => i < visita.registrados)}
          />
        </div>
        <BotonLink
          href={`/s/visitas/${visita.id}`}
          variante="sobreOscuro"
          ancho
          className="mt-4 lg:mt-0 lg:w-auto lg:px-8"
        >
          Seguir visita
          <IconoSiguiente tamano={20} />
        </BotonLink>
      </div>
    </section>
  );
}

// ——— Controles agrupados por local ———

function LineaVisita({ texto }: { texto: string }) {
  return <span className="mt-1 block font-semibold text-tinta">{texto}</span>;
}

function FilaDeControl({ fila, conVisita }: { fila: FilaControl; conVisita: boolean }) {
  return (
    <Fila
      href={fila.href}
      estado={fila.estado}
      titulo={fila.que}
      detalle={
        <>
          {fila.sobre}
          {conVisita && fila.visita && <LineaVisita texto={fila.visita.texto} />}
        </>
      }
      derecha={
        fila.vencimiento && (
          <FechaFila
            fecha={fechaCorta(fila.vencimiento)}
            relativo={textoRelativo(fila.vencimiento)}
            tono={fila.estado === "vencido" ? "rojo" : "normal"}
          />
        )
      }
    />
  );
}

/**
 * Un local con sus controles. La cabecera dice dónde y qué se hace:
 * "Armar visita" o, si ya hay una visita que los incluye a todos, cuándo es.
 */
export function GrupoDeLocal({ grupo }: { grupo: GrupoLocal }) {
  const { local, filas, visita } = grupo;
  return (
    <PlanillaSimple>
      <li className="flex min-h-16 items-center gap-3 bg-yeso/55 py-2 pl-4 pr-2">
        <Link
          href={`/s/locales/${local.id}`}
          className="min-w-0 flex-1 rounded-[2px] py-1 hover:underline hover:underline-offset-4"
        >
          <span className="rotulo block text-[19px]">{local.nombre}</span>
          <span className="block text-sm text-cemento">{local.barrio}</span>
        </Link>
        {visita ? (
          <Link
            href={`/s/visitas/${visita.id}`}
            className="inline-flex min-h-12 shrink-0 items-center gap-0.5 rounded-[2px] pl-2 pr-1 text-[15px] font-semibold text-tinta underline-offset-4 hover:underline"
          >
            {visita.texto}
            <IconoSiguiente tamano={18} />
          </Link>
        ) : (
          <BotonLink href={`/s/visitas/nueva?local=${local.id}`} variante="secundario" className="shrink-0">
            Armar visita
          </BotonLink>
        )}
      </li>
      {filas.map((f) => (
        <FilaDeControl key={f.id} fila={f} conVisita={!visita} />
      ))}
    </PlanillaSimple>
  );
}

// ——— Próximas visitas ———

export function FilaVisita({ visita, referencia }: { visita: VisitaProxima; referencia: string }) {
  const dias = visita.fecha === referencia ? "Hoy" : undefined;
  return (
    <Fila
      href={`/s/visitas/${visita.id}`}
      titulo={visita.local}
      detalle={
        <>
          {visita.barrio}, {cantidad(visita.controles, "control", "controles")}
          {visita.requisitosAcceso && (
            <span className="mt-1.5 flex gap-1.5 text-tinta">
              <IconoLlave tamano={17} className="mt-[2px] shrink-0 text-cemento" />
              <span>{visita.requisitosAcceso}</span>
            </span>
          )}
        </>
      }
      derecha={<FechaFila fecha={dias ?? fechaConDia(visita.fecha)} relativo={visita.franja} />}
    />
  );
}

// ——— Pedidos ———

const URGENCIA: Record<PedidoAbierto["urgencia"], string> = {
  emergencia: "emergencia",
  urgente: "urgente",
  normal: "urgencia normal",
};

export function FilaPedido({ pedido, href }: { pedido: PedidoAbierto; href: string }) {
  const destacada = pedido.urgencia !== "normal";
  return (
    <Fila
      href={href}
      titulo={pedido.titulo}
      detalle={
        <>
          {pedido.local},{" "}
          <span className={cx(destacada && "font-semibold text-tinta")}>{URGENCIA[pedido.urgencia]}</span>
        </>
      }
      derecha={
        <span className={cx("flex flex-col items-end", pedido.plazo.vencido && "text-rojo")}>
          <span className={cx("text-[13px] font-medium", !pedido.plazo.vencido && "text-cemento")}>{pedido.plazo.texto}</span>
          <Cifra className="text-[26px] leading-none">{pedido.plazo.cifra}</Cifra>
        </span>
      }
    />
  );
}
