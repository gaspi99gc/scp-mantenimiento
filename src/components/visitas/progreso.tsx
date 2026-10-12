// Progreso de la visita como la grilla de la tarjeta: una casilla por control,
// que queda perforada cuando el control se registra.

import { Cifra, cx } from "@/components/ui";

export function Progreso({ hechos }: { hechos: boolean[] }) {
  const n = hechos.filter(Boolean).length;
  const total = hechos.length;
  return (
    <li className="px-4 py-4">
      <p aria-live="polite">
        <Cifra className="text-[28px] leading-none">
          {n} de {total}
        </Cifra>{" "}
        <span className="text-cemento">{total === 1 ? "control registrado" : "controles registrados"}</span>
      </p>
      <ol className="mt-3 flex flex-wrap gap-1.5" aria-hidden>
        {hechos.map((h, i) => (
          <li
            key={i}
            className={cx(
              "flex size-[30px] items-center justify-center rounded-full",
              h ? "perforado text-transparent" : "border border-junta text-cemento",
            )}
          >
            <span className="cifra text-sm leading-none">{i + 1}</span>
          </li>
        ))}
      </ol>
    </li>
  );
}
