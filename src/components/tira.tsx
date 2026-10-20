// Tira perforada: casilleros numerados que se perforan cuando la tarea está hecha,
// como el boleto que pica el inspector o la grilla de la tarjeta de control.

import { cx } from "./ui";

export function TiraPerforada({
  hechos,
  oscura,
  className,
}: {
  /** Un casillero por tarea; `true` si ya está hecha. */
  hechos: boolean[];
  /** Sobre fondo tinta. */
  oscura?: boolean;
  className?: string;
}) {
  return (
    <ol
      aria-hidden
      className={cx(
        "grid max-w-[420px] gap-px overflow-hidden rounded-[2px] border",
        oscura ? "border-white/25 bg-white/25" : "border-junta bg-junta",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${Math.max(hechos.length, 1)}, minmax(0, 1fr))` }}
    >
      {hechos.map((h, i) => (
        <li
          key={i}
          className={cx("flex h-9 items-center justify-center", oscura ? "bg-tinta" : "bg-papel")}
        >
          {h ? (
            <span className="perforado size-4 rounded-full" />
          ) : (
            <span className={cx("cifra text-[17px] leading-none", oscura ? "text-hierro" : "text-cemento")}>{i + 1}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
