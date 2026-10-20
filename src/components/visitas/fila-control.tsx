// Fila de un control planificado en el modo visita. Antes de registrar: estado actual y botón grande.
// Después: tilde, resultado y el nuevo vencimiento sellado, con "Deshacer" mientras la visita siga abierta.

import type { Registro } from "@/components/registrar-ejecucion";
import { IconoAlerta, IconoCerrar, IconoCheck } from "@/components/iconos";
import { Boton, Cifra, Cinta, cx, FechaFila, MarcaEstado } from "@/components/ui";
import { fechaCorta, fechaMedia, textoRelativo } from "@/lib/fechas";
import type { ResultadoEjecucion } from "@/lib/tipos";
import type { ControlVisita } from "./consultas";

const RESULTADO: Record<ResultadoEjecucion, string> = {
  ok: "Hecho",
  reemplazo: "Hecho, se cambió la unidad",
  observado: "Hecho, con observaciones",
  no_apto: "No apto",
  no_realizado: "No se pudo hacer",
};

function Deshacer({ tipo, alDeshacer, className }: { tipo: string; alDeshacer: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={alDeshacer}
      aria-label={`Deshacer ${tipo.toLowerCase()}`}
      className={cx(
        "inline-flex min-h-12 shrink-0 items-center rounded-[var(--radius-boton)] px-2 text-[15px] font-semibold text-tinta underline decoration-borde underline-offset-4 hover:decoration-tinta",
        className,
      )}
    >
      Deshacer
    </button>
  );
}

export function FilaControl({
  cv,
  registro,
  bloqueado,
  puedeRegistrar,
  alRegistrar,
  alDeshacer,
}: {
  cv: ControlVisita;
  registro?: Registro;
  bloqueado: boolean;
  puedeRegistrar: boolean;
  alRegistrar: () => void;
  alDeshacer: () => void;
}) {
  const { control, tipo, estado, sobre } = cv;
  const renovado = registro?.vencimientoNuevo;

  return (
    <li className="flex items-stretch">
      <Cinta estado={renovado ? "al_dia" : estado} />
      <div className="min-w-0 flex-1 py-3.5 pl-3.5 pr-4 lg:flex lg:items-center lg:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="rotulo text-[20px]">{tipo.nombre}</h3>
              <p className="mt-0.5 text-[15px] leading-snug text-cemento">{sobre}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end text-right">
              {renovado ? (
                <>
                  <span className="text-[13px] font-medium text-cemento">Nuevo vencimiento</span>
                  {/* El sello: recuadro verde que cae con el golpe. */}
                  <Cifra className="mt-1 inline-block origin-right animate-sellar rounded-[2px] border-2 border-verde px-1.5 pb-0.5 pt-1 text-[22px] leading-none text-verde">
                    {fechaMedia(renovado)}
                  </Cifra>
                </>
              ) : control.vencimiento ? (
                <FechaFila
                  fecha={fechaCorta(control.vencimiento)}
                  relativo={registro ? "Sigue abierto" : textoRelativo(control.vencimiento)}
                  tono={estado === "vencido" ? "rojo" : "normal"}
                />
              ) : (
                <span className="text-sm text-cemento">Sin fecha</span>
              )}
            </div>
          </div>

          {registro ? (
            <div className="-mb-2 mt-1 flex items-center justify-between gap-3">
              <p className={cx("flex items-start gap-1.5 py-1 font-semibold", renovado ? "text-verde" : "text-tinta")}>
                {renovado ? (
                  <IconoCheck tamano={20} className="mt-px shrink-0" />
                ) : (
                  <IconoCerrar tamano={20} className="mt-px shrink-0 text-cemento" />
                )}
                <span>
                  {RESULTADO[registro.resultado]}
                  {!renovado && registro.motivo ? `: ${registro.motivo.charAt(0).toLowerCase()}${registro.motivo.slice(1)}` : ""}
                </span>
              </p>
              {puedeRegistrar && <Deshacer tipo={tipo.nombre} alDeshacer={alDeshacer} className="-mr-2 lg:hidden" />}
            </div>
          ) : (
            <div className="mt-2">
              <MarcaEstado estado={estado} />
              {bloqueado && (
                <p className="mt-2 flex items-start gap-1.5 text-[15px] font-medium">
                  <IconoAlerta tamano={18} className="mt-px shrink-0 text-rojo" />
                  <span>Prueba hidráulica vencida: cambiá la unidad o registrá primero la prueba.</span>
                </p>
              )}
            </div>
          )}
        </div>

        {puedeRegistrar &&
          (registro ? (
            <div className="hidden shrink-0 text-right lg:block lg:w-[17rem]">
              <Deshacer tipo={tipo.nombre} alDeshacer={alDeshacer} />
            </div>
          ) : (
            <div className="mt-3 shrink-0 lg:mt-0 lg:w-[17rem]">
              <Boton ancho onClick={alRegistrar}>
                {tipo.verbo}
              </Boton>
            </div>
          ))}
      </div>
    </li>
  );
}
