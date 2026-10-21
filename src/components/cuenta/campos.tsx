// Piezas de formulario de las pantallas de cuenta (login, contraseña, usuarios):
// rótulo arriba del campo, error debajo en rojo y el aviso general con el borde rojo grueso.

import type { ReactNode } from "react";
import { IconoAlerta } from "@/components/iconos";

export const CLASE_CAMPO =
  "min-h-12 w-full rounded-[var(--radius-boton)] border bg-papel px-3 text-base text-tinta placeholder:text-cemento";

export function Campo({
  id,
  rotulo,
  error,
  ayuda,
  children,
  extra,
}: {
  id: string;
  rotulo: string;
  error?: string;
  ayuda?: ReactNode;
  children: ReactNode;
  extra?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-end justify-between gap-3">
        <label htmlFor={id} className="rotulo text-lg">
          {rotulo}
        </label>
        {extra}
      </div>
      {children}
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="mt-1.5 text-sm text-cemento">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-rojo">
          {error}
        </p>
      )}
    </div>
  );
}

export function AvisoError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-3 rounded-[var(--radius-planilla)] border-2 border-rojo bg-papel p-3">
      <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={20} />
      <div className="text-sm">{children}</div>
    </div>
  );
}
