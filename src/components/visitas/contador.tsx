"use client";

// Contador con botones grandes de restar y sumar: se usa con una mano, sin abrir el teclado.

import { useId } from "react";
import { IconoSumar } from "@/components/iconos";

const IconoRestar = ({ tamano = 24 }: { tamano?: number }) => (
  <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" aria-hidden="true">
    <path d="M5 12h14" />
  </svg>
);

const BOTON =
  "inline-flex size-12 items-center justify-center rounded-[var(--radius-boton)] border border-tinta/25 bg-papel text-tinta " +
  "hover:border-tinta/60 active:bg-yeso disabled:pointer-events-none disabled:opacity-45";

export function Contador({
  etiqueta,
  valor,
  alCambiar,
  paso = 1,
  min = 0,
  max = 99,
  vacio,
}: {
  etiqueta: string;
  valor: number;
  alCambiar: (v: number) => void;
  paso?: number;
  min?: number;
  max?: number;
  /** Texto cuando el valor es 0 (por ejemplo, "Sin cargar"). */
  vacio?: string;
}) {
  const id = useId();
  const texto = valor === 0 && vacio ? vacio : String(valor).replace(".", ",");
  return (
    <div role="group" aria-labelledby={id} className="flex items-center justify-between gap-3">
      <div id={id} className="font-medium">
        {etiqueta}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={BOTON}
          onClick={() => alCambiar(Math.max(min, valor - paso))}
          disabled={valor <= min}
          aria-label={`Restar ${etiqueta.toLowerCase()}`}
        >
          <IconoRestar />
        </button>
        <output aria-live="polite" className="min-w-20 text-center">
          <span className={valor === 0 && vacio ? "text-sm text-cemento" : "cifra text-[28px] leading-none"}>{texto}</span>
        </output>
        <button
          type="button"
          className={BOTON}
          onClick={() => alCambiar(Math.min(max, valor + paso))}
          disabled={valor >= max}
          aria-label={`Sumar ${etiqueta.toLowerCase()}`}
        >
          <IconoSumar />
        </button>
      </div>
    </div>
  );
}
