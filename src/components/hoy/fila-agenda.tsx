// Fila de la agenda. En el celular apila control, elemento y local; en la computadora
// separa el local en su propia columna para leer la planilla de corrido.

import Link from "next/link";
import { Cinta, cx, FechaFila } from "@/components/ui";
import type { FilaAgenda } from "./consultas";

export function FilaDeAgenda({ fila }: { fila: FilaAgenda }) {
  const sinDatos = fila.estado === "sin_datos";
  return (
    <li>
      <Link
        href={fila.href}
        className="flex min-h-14 items-stretch transition-colors hover:bg-yeso/45 active:bg-yeso"
      >
        <Cinta estado={fila.estado} />
        <div className="flex min-w-0 flex-1 items-stretch gap-3 py-3 pl-3.5 pr-4 lg:gap-4">
        <div className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)] lg:gap-6">
          <div className="min-w-0">
            <div className="font-semibold leading-snug">{fila.que}</div>
            <div className="mt-0.5 text-sm text-cemento">
              <span className="lg:hidden">{fila.elemento ? `${fila.elemento}, ${fila.local}` : fila.local}</span>
              <span className="hidden lg:inline">{fila.sobre}</span>
            </div>
            {fila.visita && <div className="mt-1 text-sm font-medium">{fila.visita.texto}</div>}
          </div>
          <div className="hidden min-w-0 lg:block">
            <div className="leading-snug">{fila.local}</div>
            <div className="mt-0.5 text-sm text-cemento">{fila.barrio}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-center text-right lg:w-36">
          {fila.fecha ? (
            <FechaFila fecha={fila.fecha} relativo={fila.relativo} tono={fila.estado === "vencido" ? "rojo" : "normal"} />
          ) : (
            <span className={cx("max-w-28 text-balance text-sm font-medium leading-snug lg:max-w-none", sinDatos ? "text-tinta" : "text-cemento")}>
              {fila.relativo}
            </span>
          )}
        </div>
        </div>
      </Link>
    </li>
  );
}
