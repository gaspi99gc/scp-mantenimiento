// La tarjeta de control colgada en la pared, en grande: identidad del login en la computadora.
// Sin datos de nadie: los renglones vacíos del cartón y la tira del año en curso, con los meses que ya pasaron perforados.

import { Cifra, cx, MarcaSCP } from "@/components/ui";
import { hoy } from "@/lib/fechas";

const LETRAS = ["e", "f", "m", "a", "m", "j", "j", "a", "s", "o", "n", "d"];

function mesYAnio(referencia: string) {
  return { mes: Number(referencia.slice(5, 7)) - 1, anio: referencia.slice(0, 4) };
}

/** Tira de los doce meses: perforados los que pasaron, marcado el actual. */
function Tira({ mes, grande, className }: { mes: number; grande?: boolean; className?: string }) {
  return (
    <ol
      aria-hidden
      className={cx("grid grid-cols-12 gap-px overflow-hidden rounded-[2px] border border-junta bg-junta", className)}
    >
      {LETRAS.map((l, i) => (
        <li
          key={i}
          className={cx(
            "flex items-center justify-center",
            grande ? "h-11" : "h-6",
            i === mes ? "bg-tinta text-papel" : "bg-papel text-cemento",
          )}
        >
          {i < mes ? (
            <span className={cx("perforado rounded-full", grande ? "size-4" : "size-2.5")} />
          ) : (
            grande && <span className="cifra text-xl font-bold leading-none">{l}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function TarjetaPared({ referencia = hoy() }: { referencia?: string }) {
  const { mes, anio } = mesYAnio(referencia);

  return (
    <div aria-hidden className="relative w-[400px] xl:w-[440px]">
      {/* Hilo del precinto, hasta el clavo */}
      <span className="absolute -top-20 left-1/2 h-[104px] w-px -translate-x-1/2 bg-tinta/40" />
      <span className="absolute -top-[84px] left-1/2 size-2 -translate-x-1/2 rounded-full bg-tinta/60" />

      <div className="relative overflow-hidden rounded-[var(--radius-tarjeta)] border border-tinta/30 bg-papel">
        <div className="relative bg-tinta px-8 pb-4 pt-14 text-papel">
          <span className="ojal absolute left-1/2 top-4 size-6 -translate-x-1/2 rounded-full" />
          <div className="flex items-end justify-between gap-4">
            <MarcaSCP clara className="text-[34px]" />
            <div className="rotulo pb-0.5 text-lg">Tarjeta de control</div>
          </div>
        </div>

        <div className="px-8 pb-9 pt-6">
          {/* Renglones del cartón, para completar a mano */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {["Elemento", "Ubicación", "Último service", "Vence"].map((r) => (
              <div key={r}>
                <dt className="text-cemento">{r}</dt>
                <dd className="mt-6 border-b border-tinta/40" />
              </div>
            ))}
          </dl>

          <div className="mt-8 flex items-baseline justify-between">
            <span className="text-sm text-cemento">Meses</span>
            <Cifra className="text-4xl font-bold leading-none">{anio}</Cifra>
          </div>
          <Tira mes={mes} grande className="mt-3" />
        </div>
      </div>
    </div>
  );
}

/** La misma tira en chico, para el celular. */
export function TiraMeses({ referencia = hoy(), className }: { referencia?: string; className?: string }) {
  const { mes } = mesYAnio(referencia);
  return <Tira mes={mes} className={cx("max-w-[288px]", className)} />;
}
