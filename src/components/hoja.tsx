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
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-[14px] bg-papel p-0 text-tinta shadow-[0_-8px_30px_rgb(29_41_64/0.18)] backdrop:bg-tinta/40 open:animate-subir lg:m-auto lg:max-w-[560px] lg:rounded-[14px]"
    >
      <div className="flex max-h-[92dvh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-junta px-4 pb-3 pt-4">
          <h2 className="titulo text-xl">{titulo}</h2>
          <button
            onClick={alCerrar}
            className="-mr-2 -mt-1 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-cemento hover:bg-yeso hover:text-tinta"
            aria-label="Cerrar"
          >
            <IconoCerrar />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {pie && <div className="border-t border-junta px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">{pie}</div>}
      </div>
    </dialog>
  );
}
