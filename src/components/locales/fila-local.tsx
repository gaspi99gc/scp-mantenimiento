// Fila de la lista de locales: cinta del peor estado, nombre y dirección, y a la derecha la regla de cumplimiento.

import Link from "next/link";
import { Cinta, cx } from "@/components/ui";
import type { EstadoControl } from "@/lib/tipos";
import { Regla } from "./regla";

export interface DatosFilaLocal {
  id: string;
  nombre: string;
  barrio: string;
  direccion: string;
  cliente: string;
  razonSocial: string;
  estados: EstadoControl[];
  peor: EstadoControl;
  /** "2 vencidos" / "de 13 controles" */
  texto: { principal: string; secundario: string };
  /** "2 vencidos, 1 vence pronto y 10 al día." */
  frase: string;
}

export function FilaLocal({ local }: { local: DatosFilaLocal }) {
  return (
    <li>
      <Link
        href={`/s/locales/${local.id}`}
        className="block transition-colors hover:bg-yeso/45 active:bg-yeso"
      >
        <div className="flex min-h-14 items-stretch">
          <Cinta estado={local.peor} />
          <div className="flex min-w-0 flex-1 items-stretch gap-3 py-3 pl-3.5 pr-4">
          <div className="min-w-0 flex-1">
            <div className="font-semibold leading-snug">{local.nombre}</div>
            <div className="mt-0.5 text-sm text-cemento">
              {local.barrio}, {local.direccion}
            </div>
          </div>
          <div className="flex w-[7.5rem] shrink-0 flex-col justify-center sm:w-48">
            <Regla estados={local.estados} etiqueta={local.frase} />
            <span aria-hidden className="mt-1.5 text-right leading-tight">
              <span
                className={cx("block text-sm font-medium", local.peor === "vencido" ? "text-rojo" : "text-tinta")}
              >
                {local.texto.principal}
              </span>
              <span className="block text-xs text-cemento">{local.texto.secundario}</span>
            </span>
          </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
