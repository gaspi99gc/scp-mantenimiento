"use client";

// Hoja para reemplazar la unidad (el cilindro o equipo físico) de un puesto, o para completar
// los datos de la unidad nueva después de registrar un control con "Se cambió la unidad".
// Con los datos de la unidad se recalculan los controles que la siguen (prueba hidráulica y vida útil).

import { useState } from "react";
import { Hoja } from "@/components/hoja";
import { IconoAlerta } from "@/components/iconos";
import { Boton, Cifra } from "@/components/ui";
import { diasEntre, fechaMedia, hoy, proponerVencimiento } from "@/lib/fechas";
import type { FechaISO, TipoControl } from "@/lib/tipos";

export interface DatosUnidad {
  serie: string;
  fabricacion: FechaISO;
  ultimaPrueba: FechaISO;
}

const CAMPO = "min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3";

export function HojaUnidad({
  abierta,
  alCerrar,
  alConfirmar,
  modo,
  serieAnterior,
  tipoPrueba,
  tipoVida,
}: {
  abierta: boolean;
  alCerrar: () => void;
  alConfirmar: (d: DatosUnidad) => void;
  modo: "reemplazar" | "completar";
  serieAnterior?: string;
  tipoPrueba?: TipoControl;
  tipoVida?: TipoControl;
}) {
  const [serie, setSerie] = useState("");
  const [fabricacion, setFabricacion] = useState<FechaISO>("");
  const [ultimaPrueba, setUltimaPrueba] = useState<FechaISO>("");

  const faltan: string[] = [];
  if (!serie.trim()) faltan.push("el número de serie");
  if (!fabricacion) faltan.push("la fecha de fabricación");
  if (!ultimaPrueba) faltan.push("la fecha de la última prueba hidráulica");
  const pruebaAntes = fabricacion && ultimaPrueba && ultimaPrueba < fabricacion;

  const vencePrueba = tipoPrueba && ultimaPrueba ? proponerVencimiento(tipoPrueba, ultimaPrueba) : undefined;
  const venceVida = tipoVida && fabricacion ? proponerVencimiento(tipoVida, fabricacion) : undefined;
  const pruebaVencida = vencePrueba && diasEntre(hoy(), vencePrueba) < 0;
  const vidaVencida = venceVida && diasEntre(hoy(), venceVida) < 0;

  const verbo = modo === "reemplazar" ? "Reemplazar unidad" : "Guardar unidad";

  function confirmar() {
    if (faltan.length || pruebaAntes) return;
    alConfirmar({ serie: serie.trim().toUpperCase(), fabricacion, ultimaPrueba });
  }

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo={modo === "reemplazar" ? "Reemplazar unidad" : "Cargar la unidad nueva"}
      pie={
        <div>
          <Boton ancho onClick={confirmar} disabled={faltan.length > 0 || !!pruebaAntes}>
            {verbo}
          </Boton>
          {faltan.length > 0 && (
            <p className="mt-2 text-sm text-cemento" aria-live="polite">
              Falta {faltan.join(", ")}.
            </p>
          )}
        </div>
      }
    >
      <p className="-mt-1 mb-4 text-cemento">
        {modo === "reemplazar"
          ? "La unidad que sale queda en el historial del puesto, con la fecha de hoy como retiro."
          : "Registraste que se cambió la unidad. Cargá sus datos para recalcular la prueba hidráulica y la vida útil."}
      </p>

      <label className="mb-5 block">
        <span className="rotulo mb-1.5 block text-lg">Número de serie</span>
        <input
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          autoCapitalize="characters"
          placeholder={serieAnterior ? `La anterior era ${serieAnterior}` : "Ej.: C-700112"}
          className={`cifra text-xl uppercase placeholder:normal-case ${CAMPO}`}
        />
        <span className="mt-1 block text-sm text-cemento">Está grabado en el cilindro, cerca de la válvula.</span>
      </label>

      <label className="mb-5 block">
        <span className="rotulo mb-1.5 block text-lg">Fecha de fabricación</span>
        <input
          type="date"
          value={fabricacion}
          max={hoy()}
          onChange={(e) => setFabricacion(e.target.value)}
          className={`cifra text-xl ${CAMPO}`}
        />
      </label>

      <label className="mb-5 block">
        <span className="rotulo mb-1.5 block text-lg">Fecha de la última prueba hidráulica</span>
        <input
          type="date"
          value={ultimaPrueba}
          min={fabricacion || undefined}
          max={hoy()}
          onChange={(e) => setUltimaPrueba(e.target.value)}
          className={`cifra text-xl ${CAMPO}`}
        />
        <span className="mt-1 block text-sm text-cemento">
          La del sello o el certificado. Si la unidad es nueva, es la misma que la de fabricación.
        </span>
        {pruebaAntes && (
          <span className="mt-1 block text-sm font-medium text-rojo">
            La prueba no puede ser anterior a la fabricación. Revisá las dos fechas.
          </span>
        )}
      </label>

      {(vencePrueba || venceVida) && !pruebaAntes && (
        <section className="rounded-[var(--radius-planilla)] border border-junta bg-yeso/60 p-4" aria-live="polite">
          <div className="text-sm text-cemento">Con esta unidad</div>
          <dl className="mt-1 grid gap-2">
            {tipoPrueba && vencePrueba && (
              <div className="flex items-baseline justify-between gap-3">
                <dt>{tipoPrueba.nombre}</dt>
                <dd>
                  <Cifra className="text-xl">{fechaMedia(vencePrueba)}</Cifra>
                </dd>
              </div>
            )}
            {tipoVida && venceVida && (
              <div className="flex items-baseline justify-between gap-3">
                <dt>{tipoVida.nombre}</dt>
                <dd>
                  <Cifra className="text-xl">{fechaMedia(venceVida)}</Cifra>
                </dd>
              </div>
            )}
          </dl>
          {(pruebaVencida || vidaVencida) && (
            <p className="mt-3 flex gap-2 text-sm">
              <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={18} />
              {vidaVencida
                ? "Esta unidad ya cumplió su vida útil. No la instales: pedí otra a la recargadora."
                : "La prueba hidráulica de esta unidad ya venció. No se va a poder registrar la recarga hasta que la hagan."}
            </p>
          )}
        </section>
      )}
    </Hoja>
  );
}
