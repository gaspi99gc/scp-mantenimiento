"use client";

// Hoja que sube desde abajo (en la computadora, panel centrado). Usa <dialog> nativo:
// atrapa el foco, cierra con Esc y devuelve el foco al botón que la abrió.

import { useEffect, useRef, type ReactNode } from "react";
import { IconoCerrar } from "./iconos";

export function Hoja({
  abierta,
  alCerrar,
  titulo,
  children,
  pie,
}: {
  abierta: boolean;
  alCerrar: () => void;
  titulo: ReactNode;
  children: ReactNode;
  /** Acciones fijas al pie de la hoja */
  pie?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  return (
    <dialog
      ref={ref}
      onClose={alCerrar}
      onClick={(e) => {
        if (e.target === ref.current) alCerrar();
      }}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[6px] bg-papel p-0 text-tinta shadow-[0_-12px_40px_rgb(22_24_27/0.3)] backdrop:bg-tinta/55 open:animate-subir lg:m-auto lg:max-w-[560px] lg:rounded-[4px]"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b-2 border-tinta py-2 pl-4 pr-2">
          <h2 className="titulo py-1.5 text-[24px]">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-[2px] text-cemento hover:bg-yeso hover:text-tinta"
            aria-label="Cerrar"
          >
            <IconoCerrar />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {pie && <div className="border-t border-junta bg-papel px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">{pie}</div>}
      </div>
    </dialog>
  );
}
