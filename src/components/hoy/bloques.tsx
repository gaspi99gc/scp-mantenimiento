// Bloques de la pantalla Hoy. Server Components: no tienen interacción propia.

import Link from "next/link";
import type { ReactNode } from "react";
import { IconoLlave } from "@/components/iconos";
import { BotonLink, Cifra, cx, FechaFila, Fila } from "@/components/ui";
import { fechaConDia, fechaCorta, textoRelativo } from "@/lib/fechas";
import type { FilaControl, GrupoLocal, PedidoAbierto, VisitaEnCurso, VisitaProxima } from "./consultas";
import { cantidad } from "./texto";

/** Sección de la pantalla: título de sección y su contenido. */
export function Seccion({ id, titulo, children }: { id: string; titulo: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mb-9 lg:mb-10">
      <h2 id={id} className="mb-2.5 px-0.5 text-lg font-[650] leading-tight">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Lista simple con el aspecto de planilla. */
export function PlanillaSimple({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <ul className={cx("overflow-hidden rounded-[var(--radius-planilla)] border border-junta bg-papel divide-y divide-junta", className)}>
      {children}
    </ul>
  );
}

// ——— Visita en curso ———

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
      className="mb-9 rounded-[var(--radius-planilla)] bg-tinta p-4 text-papel lg:mb-10 lg:flex lg:items-center lg:gap-8 lg:px-6 lg:py-5"
    >
      <div className="flex items-start gap-4 lg:flex-1">
        <div className="min-w-0 flex-1">
          <h2 id={`en-curso-${visita.id}`} className="titulo text-xl lg:text-2xl">
            {visita.local.nombre}
          </h2>
          <p className="mt-1.5 leading-snug">
            Visita en curso. {avance}
            {visita.vencidos > 0 && `, ${visita.vencidos === 1 ? "uno vencido" : `${visita.vencidos} vencidos`}`}.
          </p>
          <p className="mt-1 text-sm text-papel/70">
            {visita.local.direccion}, {visita.local.barrio}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Cifra className="block text-2xl leading-none lg:text-[34px]">{visita.franja}</Cifra>
        </div>
      </div>
      <BotonLink
        href={`/s/visitas/${visita.id}`}
        variante="secundario"
        ancho
        className="mt-4 lg:mt-0 lg:w-auto lg:px-6"
      >
        Seguir visita
      </BotonLink>
    </section>
  );
}

// ——— Controles agrupados por local ———

function LineaVisita({ texto }: { texto: string }) {
  return <span className="mt-1 block font-medium text-tinta">{texto}</span>;
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
      <li className="flex min-h-16 items-center gap-3 bg-yeso/50 py-2 pl-3 pr-2">
        <Link
          href={`/s/locales/${local.id}`}
          className="min-w-0 flex-1 rounded-[4px] py-1 hover:underline hover:underline-offset-4"
        >
          <span className="block font-[650] leading-snug">{local.nombre}</span>
          <span className="block text-sm text-cemento">{local.barrio}</span>
        </Link>
        {visita ? (
          <Link
            href={`/s/visitas/${visita.id}`}
            className="inline-flex min-h-12 shrink-0 items-center rounded-[var(--radius-boton)] pl-2 pr-1 text-sm font-medium text-tinta underline-offset-4 hover:underline"
          >
            {visita.texto}
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
              <IconoLlave tamano={17} className="mt-[1px] shrink-0 text-cemento" />
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
          <span className={cx(destacada && "font-medium text-tinta")}>{URGENCIA[pedido.urgencia]}</span>
        </>
      }
      derecha={
        <span className={cx("flex items-baseline gap-1.5 whitespace-nowrap", pedido.plazo.vencido && "text-rojo")}>
          <span className={cx("text-sm", !pedido.plazo.vencido && "text-cemento")}>{pedido.plazo.texto}</span>
          <Cifra className="text-xl leading-none">{pedido.plazo.cifra}</Cifra>
        </span>
      }
    />
  );
}
