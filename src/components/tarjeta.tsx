// La tarjeta de control: la pieza central del diseño (ver docs/propuesta-visual.md).
// Se arma como la tarjeta impresa que cuelga de cada matafuego: el ojal del precinto en el cabezal
// del color del estado, los renglones del formulario (control, vence, último service) y la tira
// de casilleros del período, con los que ya pasaron perforados y el del vencimiento marcado.

import type { ReactNode } from "react";
import { fechaMedia, fechaNumerica, grillaPeriodo, hoy, textoPeriodo, textoRelativo } from "@/lib/fechas";
import type { Control, EstadoControl, TipoControl } from "@/lib/tipos";
import { IconoHoy } from "./iconos";
import { Cifra, cx, ESTADO } from "./ui";

export function Tarjeta({
  control,
  tipo,
  estado,
  programada,
  sellada,
  referencia = hoy(),
  children,
  className,
}: {
  control: Control;
  tipo: TipoControl;
  estado: EstadoControl;
  /** Texto si hay visita armada: "Visita el vie 14 nov" */
  programada?: string;
  /** Recién registrada: la fecha aparece con el golpe de sello. */
  sellada?: boolean;
  referencia?: string;
  /** Acción al pie, normalmente el botón "Registrar …". */
  children?: ReactNode;
  className?: string;
}) {
  const casillas = grillaPeriodo(tipo, control, referencia);
  const columnas = casillas.length > 12 ? 10 : casillas.length;
  const e = ESTADO[estado];
  const sinDatos = estado === "sin_datos";

  return (
    <article
      className={cx(
        "relative flex w-[288px] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--radius-tarjeta)] border border-tinta/30 bg-papel",
        className,
      )}
      aria-label={`${tipo.nombre}: ${e.nombre}`}
    >
      {/* Cabezal del color del estado, con el ojal del precinto */}
      <div className={cx("relative px-4 pb-2.5 pt-10", e.banda, e.textoBanda)}>
        <span aria-hidden className="ojal absolute left-1/2 top-3 size-[18px] -translate-x-1/2 rounded-full" />
        <div className="flex items-baseline justify-between gap-2">
          <span className={cx("rotulo text-[18px]", sinDatos && "bg-papel px-1")}>{e.nombre}</span>
          {control.vencimiento && estado !== "al_dia" && (
            <span className={cx("text-sm font-semibold", sinDatos && "bg-papel px-1")}>
              {textoRelativo(control.vencimiento, referencia)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <h3 className="rotulo text-[22px]">{tipo.nombre}</h3>
        <p className="mt-0.5 text-sm leading-snug text-cemento">
          {textoPeriodo(tipo).replace(/^./, (c) => c.toUpperCase())}
          {tipo.norma ? `, ${tipo.norma}` : ""}
        </p>

        {/* Renglón "Vence": la fecha grande, como sellada en el cartón */}
        <div className="mt-3 border-t border-junta pt-2">
          <div className="text-[13px] font-medium text-cemento">Vence</div>
          {control.vencimiento ? (
            <Cifra
              key={control.vencimiento}
              className={cx(
                "mt-0.5 block origin-left text-[46px] font-semibold leading-[0.92]",
                sellada && "animate-sellar",
              )}
            >
              {fechaMedia(control.vencimiento)}
            </Cifra>
          ) : (
            <p className="rayado-suave mt-1 rounded-[2px] border border-dashed border-tinta/50 px-2 py-2 font-semibold">
              <span className="bg-papel px-1">Falta cargar la fecha</span>
            </p>
          )}
        </div>

        {/* Tira de casilleros del período. Los transcurridos, perforados; el del vencimiento, marcado. */}
        {casillas.length > 0 && (
          <ol
            className="mt-3 grid gap-px overflow-hidden rounded-[2px] border border-junta bg-junta"
            style={{ gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))` }}
            aria-label="Período desde el último service"
          >
            {casillas.map((c, i) => (
              <li
                key={i}
                className={cx(
                  "flex h-7 items-center justify-center",
                  c.final ? cx(e.banda, e.textoBanda) : "bg-papel",
                  c.actual && !c.final && "bg-yeso",
                )}
                title={c.perforada ? "Transcurrido" : c.final ? "Vence" : undefined}
              >
                {c.perforada && !c.final ? (
                  <span aria-hidden className="perforado size-3 rounded-full" />
                ) : (
                  <span
                    className={cx(
                      "cifra text-[14px] leading-none",
                      c.final || c.actual ? "font-bold" : "font-medium text-cemento",
                      sinDatos && c.final && "bg-papel px-0.5",
                    )}
                  >
                    {c.rotulo}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        {(control.ultimaEjecucion || programada) && (
          <div className="mt-3 space-y-1 text-sm">
            {control.ultimaEjecucion && (
              <p className="text-cemento">
                Último: <Cifra className="text-[15px] text-tinta">{fechaNumerica(control.ultimaEjecucion)}</Cifra>
                {control.ultimoEjecutor ? `, ${control.ultimoEjecutor}` : ""}
              </p>
            )}
            {programada && (
              <p className="flex items-center gap-1.5 font-semibold text-tinta">
                <IconoHoy tamano={17} className="shrink-0" />
                {programada}
              </p>
            )}
          </div>
        )}

        {children && <div className="mt-auto pt-4">{children}</div>}
      </div>
    </article>
  );
}

/** Colgadero: fila horizontal de tarjetas (en el celular se desliza; en la computadora se acomodan). */
export function Colgadero({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-3 lg:mx-0 lg:flex-wrap lg:gap-4 lg:overflow-visible lg:px-0">
      {children}
    </div>
  );
}
