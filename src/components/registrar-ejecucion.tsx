"use client";

// Formulario para registrar un trabajo sobre un control. Lo usan la ficha del elemento y la de controles del local.
// Es la interacción más importante de la app: tiene que poder hacerse en menos de un minuto, parado en el local.
// Por ahora no guarda nada: devuelve el resultado con `alRegistrar` y la pantalla que lo usa actualiza su estado.

import { useMemo, useState } from "react";
import { fechaMedia, hoy, proponerVencimiento, textoPeriodo } from "@/lib/fechas";
import type { Control, Elemento, FechaISO, ResultadoEjecucion, TipoControl } from "@/lib/tipos";
import { Hoja } from "./hoja";
import { IconoAlerta } from "./iconos";
import { Boton, Cifra, cx } from "./ui";

export interface Registro {
  controlId: string;
  resultado: ResultadoEjecucion;
  fecha: FechaISO;
  vencimientoNuevo?: FechaISO; // undefined si no se renovó (no se pudo hacer)
  origen: "calculado" | "certificado";
  motivo?: string;
  oblea?: string;
  serieNueva?: string; // si se cambió la unidad
}

type Opcion = { valor: ResultadoEjecucion; texto: string; ayuda: string };

const OPCIONES: Opcion[] = [
  { valor: "ok", texto: "Hecho", ayuda: "Se hizo el trabajo y quedó bien." },
  { valor: "reemplazo", texto: "Se cambió la unidad", ayuda: "Se puso otro equipo en el mismo lugar." },
  { valor: "observado", texto: "Hecho, con observaciones", ayuda: "Se hizo, pero hay algo para seguir." },
  { valor: "no_realizado", texto: "No se pudo hacer", ayuda: "El vencimiento sigue abierto." },
];

// Las fotos y los certificados quedan para más adelante; por ahora solo se pide el número de oblea, y es opcional.
const esNumero = (ev: string) => /número|oblea|precinto/i.test(ev);

export function RegistrarEjecucion({
  abierta,
  alCerrar,
  alRegistrar,
  control,
  tipo,
  elemento,
  bloqueo,
}: {
  abierta: boolean;
  alCerrar: () => void;
  alRegistrar: (r: Registro) => void;
  control: Control;
  tipo: TipoControl;
  elemento?: Elemento;
  bloqueo?: { texto: string; permiteReemplazo: boolean };
}) {
  const [resultado, setResultado] = useState<ResultadoEjecucion | null>(bloqueo ? "reemplazo" : "ok");
  const [fecha, setFecha] = useState<FechaISO>(hoy());
  const [oblea, setOblea] = useState("");
  const [otraFecha, setOtraFecha] = useState(false);
  const [fechaTarjeta, setFechaTarjeta] = useState<FechaISO>("");
  const [motivo, setMotivo] = useState("");
  const [serieNueva, setSerieNueva] = useState("");

  const renueva = resultado === "ok" || resultado === "reemplazo" || resultado === "observado";
  const propuesta = useMemo(
    () => proponerVencimiento(tipo, fecha || hoy(), control.vencimiento),
    [tipo, fecha, control.vencimiento],
  );
  const vencimientoFinal = otraFecha && fechaTarjeta ? fechaTarjeta : propuesta;

  const faltan: string[] = [];
  if (!resultado) faltan.push("elegir el resultado");
  if (!fecha) faltan.push("la fecha del trabajo");
  if (resultado === "reemplazo" && elemento?.unidad && !serieNueva) faltan.push("el número de serie de la unidad nueva");
  if (renueva && otraFecha && !fechaTarjeta) faltan.push("la fecha que dice la tarjeta");
  if (renueva && otraFecha && !motivo.trim()) faltan.push("el motivo del cambio de fecha");
  if (!renueva && resultado && !motivo.trim()) faltan.push("por qué no se pudo hacer");
  if (bloqueo && (resultado === "ok" || resultado === "observado")) faltan.push("resolver la prueba hidráulica vencida");

  const sobre = elemento ? `${elemento.tipo}, ${elemento.ubicacion.toLowerCase()}` : "Control del local";

  function confirmar() {
    if (faltan.length || !resultado) return;
    alRegistrar({
      controlId: control.id,
      resultado,
      fecha,
      vencimientoNuevo: renueva ? vencimientoFinal : undefined,
      origen: otraFecha ? "certificado" : "calculado",
      motivo: motivo.trim() || undefined,
      oblea: oblea.trim() || undefined,
      serieNueva: resultado === "reemplazo" ? serieNueva.trim() || undefined : undefined,
    });
  }

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo={tipo.verbo}
      pie={
        <div>
          <Boton ancho onClick={confirmar} disabled={faltan.length > 0}>
            {renueva || !resultado ? tipo.verbo : "Registrar que no se pudo hacer"}
          </Boton>
          {faltan.length > 0 && (
            <p className="mt-2 text-sm text-cemento" aria-live="polite">
              Falta {faltan.join(", ")}.
            </p>
          )}
        </div>
      }
    >
      <p className="-mt-1 mb-4 text-cemento">{sobre}</p>

      {bloqueo && (
        <div className="mb-5 flex gap-3 rounded-[var(--radius-planilla)] border-2 border-rojo bg-papel p-3 text-[15px] font-medium">
          <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={20} />
          <p>{bloqueo.texto}</p>
        </div>
      )}

      {/* Las opciones son los renglones de la planilla: se marca uno, como con la birome. */}
      <fieldset className="mb-6">
        <legend className="rotulo mb-2 text-lg">¿Cómo quedó?</legend>
        <div className="overflow-hidden rounded-[var(--radius-planilla)] border border-borde divide-y divide-junta">
          {OPCIONES.filter((o) => o.valor !== "reemplazo" || elemento?.unidad).map((o) => {
            const deshabilitada = !!bloqueo && (o.valor === "ok" || o.valor === "observado");
            const elegida = resultado === o.valor;
            return (
              <label
                key={o.valor}
                className={cx(
                  "relative flex min-h-14 cursor-pointer items-start gap-3 px-3 py-3 transition-colors",
                  elegida ? "bg-yeso/70" : "hover:bg-yeso/35",
                  deshabilitada && "rayado-suave cursor-not-allowed text-cemento hover:bg-transparent",
                )}
              >
                {elegida && <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-tinta" />}
                <input
                  type="radio"
                  name="resultado"
                  className="mt-0.5 size-5 shrink-0 accent-[var(--color-tinta)]"
                  checked={elegida}
                  disabled={deshabilitada}
                  onChange={() => setResultado(o.valor)}
                />
                <span>
                  <span className="block font-semibold">{o.texto}</span>
                  <span className="block text-[15px] leading-snug text-cemento">{o.ayuda}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mb-5 block">
        <span className="rotulo mb-1.5 block text-lg">Fecha del trabajo</span>
        <input
          type="date"
          value={fecha}
          max={hoy()}
          onChange={(e) => setFecha(e.target.value)}
          className="cifra min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 text-xl"
        />
        <span className="mt-1 block text-sm text-cemento">La del día en que se hizo, aunque lo cargues después.</span>
      </label>

      {resultado === "reemplazo" && elemento?.unidad && (
        <label className="mb-5 block">
          <span className="rotulo mb-1.5 block text-lg">Número de serie de la unidad nueva</span>
          <input
            value={serieNueva}
            onChange={(e) => setSerieNueva(e.target.value)}
            placeholder={`La anterior era ${elemento.unidad.serie}`}
            className="cifra min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 text-xl"
          />
        </label>
      )}

      {renueva && tipo.evidencia.some(esNumero) && (
        <label className="mb-5 block">
          <span className="rotulo mb-1.5 block text-lg">Número de oblea</span>
          <input
            inputMode="numeric"
            value={oblea}
            onChange={(e) => setOblea(e.target.value)}
            className="cifra min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 text-xl"
          />
          <span className="mt-1 block text-sm text-cemento">Opcional. Es el número de la oblea que dejó la recargadora.</span>
        </label>
      )}

      {renueva ? (
        // El sello que va a quedar en la tarjeta: recuadro grueso, como el del sello fechador.
        <section className="rounded-[var(--radius-planilla)] border-2 border-tinta bg-papel p-4" aria-live="polite">
          <div className="text-sm font-medium text-cemento">Nuevo vencimiento</div>
          <Cifra key={vencimientoFinal} className="mt-0.5 block text-[46px] leading-[0.95]">
            {fechaMedia(vencimientoFinal)}
          </Cifra>
          <p className="mt-1.5 text-sm text-cemento">
            {otraFecha && fechaTarjeta
              ? "Según la tarjeta o el certificado."
              : `${textoPeriodo(tipo).replace(/^./, (c) => c.toUpperCase())} ${
                  tipo.base === "desde_ejecucion" ? "desde el día del trabajo" : "desde el vencimiento anterior"
                }.`}
          </p>

          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              className="size-5 accent-[var(--color-tinta)]"
              checked={otraFecha}
              onChange={(e) => setOtraFecha(e.target.checked)}
            />
            <span className="font-medium">La tarjeta dice otra fecha</span>
          </label>
          {otraFecha && (
            <div className="mt-2 grid gap-3">
              <input
                type="date"
                value={fechaTarjeta}
                onChange={(e) => setFechaTarjeta(e.target.value)}
                aria-label="Fecha que dice la tarjeta"
                className="cifra min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 text-xl"
              />
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Por qué es otra fecha. Ej.: la recargadora fechó la tarjeta el día que retiró el equipo."
                rows={2}
                className="w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2"
              />
            </div>
          )}
        </section>
      ) : (
        resultado && (
          <label className="block">
            <span className="rotulo mb-1.5 block text-lg">¿Por qué no se pudo hacer?</span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ej.: el local estaba cerrado; el equipo no está en el lugar."
              className="w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2"
            />
            <span className="mt-1 block text-sm text-cemento">
              El vencimiento sigue abierto y queda anotado como observación del local.
            </span>
          </label>
        )
      )}
    </Hoja>
  );
}
