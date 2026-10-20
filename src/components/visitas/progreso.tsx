// Progreso de la visita como la tira de la tarjeta: un casillero por control,
// que queda perforado cuando el control se registra.

import { TiraPerforada } from "@/components/tira";
import { Cifra } from "@/components/ui";

export function Progreso({ hechos }: { hechos: boolean[] }) {
  const n = hechos.filter(Boolean).length;
  const total = hechos.length;
  return (
    <li className="bg-yeso/45 px-4 py-4">
      <p aria-live="polite" className="flex items-baseline gap-2">
        <Cifra className="text-[34px] font-bold leading-none">
          {n} de {total}
        </Cifra>
        <span className="text-cemento">{total === 1 ? "control registrado" : "controles registrados"}</span>
      </p>
      <TiraPerforada className="mt-3" hechos={hechos} />
    </li>
  );
}
