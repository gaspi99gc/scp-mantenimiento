// Pestañas de la ficha del local. Son enlaces (?ver=…), así cada sección tiene su dirección,
// se puede volver con el botón de atrás y funciona sin JavaScript.
// La activa se marca con aria-current, la línea de abajo y el peso de la letra, no solo con el color.

import Link from "next/link";
import { cx } from "@/components/ui";

export interface Pestana {
  clave: string;
  texto: string;
  cantidad?: number;
}

export function Pestanas({ base, activa, pestanas }: { base: string; activa: string; pestanas: Pestana[] }) {
  return (
    <nav aria-label="Secciones del local" className="mb-5 overflow-x-auto">
      <ul className="flex border-b border-junta">
        {pestanas.map((p) => {
          const es = p.clave === activa;
          return (
            <li key={p.clave} className="flex flex-1 sm:flex-none">
              <Link
                href={`${base}?ver=${p.clave}`}
                scroll={false}
                aria-current={es ? "page" : undefined}
                className={cx(
                  "relative inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-t-[var(--radius-boton)] px-1 text-sm sm:px-3.5 sm:text-base",
                  es
                    ? "font-semibold text-tinta after:absolute after:inset-x-1 after:-bottom-px after:h-[3px] after:rounded-full after:bg-tinta"
                    : "font-medium text-cemento hover:text-tinta",
                )}
              >
                {p.texto}
                {p.cantidad !== undefined && (
                  <span className={cx("cifra hidden sm:inline", es ? "text-tinta" : "text-cemento")}>
                    {p.cantidad}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
