// Regla de cumplimiento: una celda por control, del peor estado al mejor.
// Se lee de un vistazo cuánto del local está en rojo; el texto de al lado dice lo mismo con palabras.

import { cx, ESTADO } from "@/components/ui";
import type { EstadoControl } from "@/lib/tipos";

export function Regla({
  estados,
  etiqueta,
  className,
}: {
  /** Ya ordenados del peor al mejor. */
  estados: EstadoControl[];
  /** La frase completa para lectores de pantalla: "2 vencidos, 1 vence pronto y 10 al día." */
  etiqueta: string;
  className?: string;
}) {
  return (
    <div role="img" aria-label={etiqueta} className={cx("flex h-2 w-full gap-[2px]", className)}>
      {estados.length === 0 ? (
        <span className="rayado flex-1 rounded-[2px]" />
      ) : (
        estados.map((e, i) => (
          <span
            key={i}
            className={cx(
              "min-w-[3px] flex-1 rounded-[2px]",
              ESTADO[e].cinta,
              e === "sin_datos" && "outline -outline-offset-1 outline-cemento/70",
            )}
          />
        ))
      )}
    </div>
  );
}
