// Las cuatro solapas de la carpeta, como las de una carpeta de papeles: cada una dice lo que tiene
// pendiente. Son enlaces (?solapa=…), así cada solapa tiene su dirección y funciona sin JavaScript.
// En el celular van de a dos; la elegida queda en tinta, como un chip activo.

import Link from "next/link";
import { cx } from "@/components/ui";
import { SOLAPAS, type Solapa } from "@/lib/documentos";

export function SelectorSolapas({
  activa,
  href,
  resumen,
}: {
  activa: Solapa;
  href: (s: Solapa) => string;
  resumen: Record<Solapa, string>;
}) {
  return (
    <nav aria-label="Solapas" className="mb-5">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SOLAPAS.map((s) => {
          const es = s.clave === activa;
          return (
            <li key={s.clave} className="flex">
              <Link
                href={href(s.clave)}
                scroll={false}
                aria-current={es ? "page" : undefined}
                className={cx(
                  "flex min-h-16 flex-1 flex-col justify-center rounded-[var(--radius-boton)] border px-3 py-2 transition-colors",
                  es ? "border-tinta bg-tinta text-papel" : "border-tinta/30 bg-papel text-tinta hover:border-tinta",
                )}
              >
                <span className="rotulo text-lg leading-tight">{s.corto}</span>
                <span className={cx("text-sm leading-snug", es ? "text-papel" : "text-cemento")}>{resumen[s.clave]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
