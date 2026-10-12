// La tarjeta de control: la pieza central del diseño (ver docs/diseno.md, "La idea").
// Imita la tarjeta que cuelga de cada matafuego: agujero del precinto, franja de estado,
// vencimiento grande y la grilla del período, con las casillas ya transcurridas perforadas.

import type { ReactNode } from "react";
import { fechaMedia, fechaNumerica, grillaPeriodo, hoy, textoPeriodo, textoRelativo } from "@/lib/fechas";
import type { Control, EstadoControl, TipoControl } from "@/lib/tipos";
import { Cifra, cx, ESTADO } from "./ui";

const ANILLO_FINAL: Record<EstadoControl, string> = {
  vencido: "ring-rojo",
  pronto: "ring-amarillo",
  al_dia: "ring-verde",
  sin_datos: "ring-cemento",
  suspendido: "ring-junta",
};

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
  const chicas = casillas.length > 12;
  const e = ESTADO[estado];

  return (
    <article
      className={cx(
        "relative flex w-[244px] shrink-0 snap-start flex-col overflow-hidden rounded-[6px] border border-junta bg-papel",
        className,
      )}
      aria-label={`${tipo.nombre}: ${e.nombre}`}
    >
      {/* Agujero del precinto */}
      <span aria-hidden className="perforado absolute left-1/2 top-2 z-10 size-4 -translate-x-1/2 rounded-full" />

      {/* Franja de estado */}
      <div className={cx("flex items-end justify-between px-3.5 pb-2 pt-8", e.banda, e.textoBanda)}>
        <span className={cx("text-sm font-semibold", estado === "sin_datos" && "rounded-[3px] bg-papel px-1.5")}>
          {e.nombre}
        </span>
        {control.vencimiento && estado !== "al_dia" && (
          <span className="text-xs font-medium">{textoRelativo(control.vencimiento, referencia)}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <h3 className="text-lg font-[650] leading-tight">{tipo.nombre}</h3>
        <p className="mt-0.5 text-sm text-cemento">
          {textoPeriodo(tipo).replace(/^./, (c) => c.toUpperCase())}
          {tipo.norma ? `, ${tipo.norma}` : ""}
        </p>

        <div className="mt-4">
          {control.vencimiento ? (
            <>
              <div className="text-sm text-cemento">Vence</div>
              <Cifra
                key={control.vencimiento}
                className={cx("block origin-left text-[40px] leading-[0.95]", sellada && "animate-sellar")}
              >
                {fechaMedia(control.vencimiento)}
              </Cifra>
            </>
          ) : (
            <p className="text-base font-medium">Falta cargar la fecha</p>
          )}
        </div>

        {casillas.length > 0 && (
          <ol
            className={cx("mt-4 grid gap-1.5", chicas ? "grid-cols-10" : "grid-cols-6")}
            aria-label="Período desde el último service"
          >
            {casillas.map((c, i) => (
              <li
                key={i}
                className={cx(
                  "flex items-center justify-center rounded-full",
                  chicas ? "size-3.5" : "size-[26px]",
                  c.perforada ? "perforado text-transparent" : "border border-junta text-cemento",
                  c.actual && !c.perforada && "border-tinta text-tinta",
                  c.final && cx("ring-2 ring-offset-1 ring-offset-papel", ANILLO_FINAL[estado]),
                )}
                title={c.perforada ? "Transcurrido" : c.final ? "Vence" : undefined}
              >
                {!chicas && <span className="cifra text-[13px] leading-none">{c.rotulo}</span>}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-4 space-y-1 text-sm text-cemento">
          {control.ultimaEjecucion && (
            <p>
              Último: <Cifra className="text-tinta">{fechaNumerica(control.ultimaEjecucion)}</Cifra>
              {control.ultimoEjecutor ? `, ${control.ultimoEjecutor}` : ""}
            </p>
          )}
          {programada && <p className="font-medium text-tinta">{programada}</p>}
        </div>

        {children && <div className="mt-auto pt-4">{children}</div>}
      </div>
    </article>
  );
}

/** Colgadero: fila horizontal de tarjetas (en el celular se desliza; en la computadora se acomodan). */
export function Colgadero({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
      {children}
    </div>
  );
}
