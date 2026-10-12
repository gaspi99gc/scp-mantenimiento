// La tarjeta de control colgada en la pared, en grande: identidad del login en la computadora.
// Sin datos de nadie: los renglones vacíos del cartón y la grilla del año en curso, con los meses que ya pasaron perforados.

import { Cifra, cx } from "@/components/ui";
import { hoy } from "@/lib/fechas";

const LETRAS = ["e", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"];

function mesYAnio(referencia: string) {
  return { mes: Number(referencia.slice(5, 7)) - 1, anio: referencia.slice(0, 4) };
}

export function TarjetaPared({ referencia = hoy() }: { referencia?: string }) {
  const { mes, anio } = mesYAnio(referencia);

  return (
    <div aria-hidden className="relative w-[400px] xl:w-[440px]">
      {/* Hilo del precinto, hasta el clavo */}
      <span className="absolute -top-20 left-1/2 h-[104px] w-px -translate-x-1/2 bg-tinta/40" />
      <span className="absolute -top-[84px] left-1/2 size-2 -translate-x-1/2 rounded-full bg-tinta/60" />

      <div className="relative rounded-[6px] border border-junta bg-papel px-8 pb-9 pt-14">
        <span className="perforado absolute left-1/2 top-4 size-6 -translate-x-1/2 rounded-full" />

        <div className="flex items-end justify-between gap-4 border-b-2 border-tinta pb-3">
          <div>
            <div className="titulo text-3xl leading-none [font-stretch:62%]">SCP</div>
            <div className="mt-0.5 text-sm text-cemento">Mantenimiento integral</div>
          </div>
          <div className="pb-0.5 font-[650]">Tarjeta de control</div>
        </div>

        {/* Renglones del cartón, para completar a mano */}
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {["Elemento", "Ubicación", "Último service", "Vence"].map((r) => (
            <div key={r}>
              <dt className="text-cemento">{r}</dt>
              <dd className="mt-5 border-b border-junta" />
            </div>
          ))}
        </dl>

        <div className="mt-7 flex items-baseline justify-between">
          <span className="text-sm text-cemento">Meses</span>
          <Cifra className="text-4xl leading-none">{anio}</Cifra>
        </div>
        <ol className="mt-3 grid grid-cols-6 gap-3">
          {LETRAS.map((l, i) => (
            <li
              key={i}
              className={cx(
                "flex aspect-square items-center justify-center rounded-full",
                i < mes && "perforado",
                i === mes && "border-2 border-tinta text-tinta",
                i > mes && "border border-junta text-cemento",
              )}
            >
              {i >= mes && <span className="cifra text-xl leading-none">{l}</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** La misma grilla en una tira chica, para el celular. */
export function TiraMeses({ referencia = hoy(), className }: { referencia?: string; className?: string }) {
  const { mes } = mesYAnio(referencia);
  return (
    <ol aria-hidden className={cx("flex gap-1.5", className)}>
      {LETRAS.map((_, i) => (
        <li
          key={i}
          className={cx(
            "size-3.5 rounded-full",
            i < mes && "perforado",
            i === mes && "border-2 border-tinta",
            i > mes && "border border-junta",
          )}
        />
      ))}
    </ol>
  );
}
