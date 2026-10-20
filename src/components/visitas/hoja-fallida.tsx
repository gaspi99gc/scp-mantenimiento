"use client";

// Visita fallida: local cerrado, sin acceso... Se registra con foto, hora y motivo, y se avisa al cliente.
// Respalda a SCP si después el control vence por causa del local.

import { useState } from "react";
import { Hoja } from "@/components/hoja";
import { IconoAlerta, IconoCamara, IconoCheck } from "@/components/iconos";
import { Boton, cx } from "@/components/ui";

export const MOTIVOS_FALLIDA = [
  { valor: "cerrado", texto: "Local cerrado", ayuda: "Persiana baja o sin nadie que abra." },
  { valor: "sin_acceso", texto: "Sin acceso", ayuda: "No nos dejaron entrar o falta el permiso." },
  { valor: "sin_personal", texto: "Sin personal", ayuda: "No había nadie del local para recibirnos." },
  { valor: "otro", texto: "Otro", ayuda: "Contalo en la nota." },
] as const;

export type MotivoFallida = (typeof MOTIVOS_FALLIDA)[number]["valor"];

export interface Fallida {
  motivo: MotivoFallida;
  foto: string;
  nota: string;
}

export const nombreMotivo = (m: MotivoFallida) => MOTIVOS_FALLIDA.find((x) => x.valor === m)?.texto ?? "Otro";

export function HojaFallida({
  abierta,
  alCerrar,
  alConfirmar,
  registrados,
}: {
  abierta: boolean;
  alCerrar: () => void;
  alConfirmar: (f: Fallida) => void;
  /** Controles ya registrados en la visita: se descartan si se marca fallida. */
  registrados: number;
}) {
  const [motivo, setMotivo] = useState<MotivoFallida | null>(null);
  const [foto, setFoto] = useState("");
  const [nota, setNota] = useState("");

  const faltan: string[] = [];
  if (!motivo) faltan.push("el motivo");
  if (!foto) faltan.push("la foto");
  if (motivo === "otro" && !nota.trim()) faltan.push("contar qué pasó en la nota");

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo="Marcar visita fallida"
      pie={
        <div>
          <Boton
            ancho
            variante="peligro"
            disabled={faltan.length > 0}
            onClick={() => motivo && alConfirmar({ motivo, foto, nota: nota.trim() })}
          >
            Marcar visita fallida
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
        Queda registrada la hora y le avisamos al cliente. Si después algo vence por esto, sirve de respaldo.
      </p>

      {registrados > 0 && (
        <div className="mb-5 flex gap-3 rounded-[var(--radius-boton)] border border-rojo/50 bg-rojo/5 p-3 text-sm">
          <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={20} />
          <p>
            Ya registraste {registrados === 1 ? "1 control" : `${registrados} controles`}. Si marcás la visita fallida,{" "}
            {registrados === 1 ? "ese registro se descarta" : "esos registros se descartan"}.
          </p>
        </div>
      )}

      <fieldset className="mb-5">
        <legend className="mb-2 font-semibold">¿Qué pasó?</legend>
        <div className="grid gap-2">
          {MOTIVOS_FALLIDA.map((m) => {
            const elegido = motivo === m.valor;
            return (
              <label
                key={m.valor}
                className={cx(
                  "flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-boton)] border px-3 py-2.5",
                  elegido ? "border-tinta bg-tinta/[0.04]" : "border-junta",
                )}
              >
                <input
                  type="radio"
                  name="motivo-fallida"
                  className="mt-1 size-4 accent-[var(--color-tinta)]"
                  checked={elegido}
                  onChange={() => setMotivo(m.valor)}
                />
                <span>
                  <span className="block font-medium">{m.texto}</span>
                  <span className="block text-sm text-cemento">{m.ayuda}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mb-5">
        <span className="mb-1.5 block font-semibold">Foto</span>
        <label
          className={cx(
            "flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-boton)] border px-3",
            foto ? "border-verde/60" : "border-dashed border-cemento/50",
          )}
        >
          <span className={foto ? "text-verde" : "text-cemento"}>{foto ? <IconoCheck /> : <IconoCamara />}</span>
          <span className="min-w-0 flex-1 py-2">
            <span className="block font-medium">{foto ? "Foto agregada" : "Sacar foto del frente del local"}</span>
            <span className="block truncate text-sm text-cemento">{foto || "Que se vea la persiana o la puerta, con el número."}</span>
          </span>
          {/* TODO(supabase): subir la foto a Storage con la hora de captura; reintentar si no hay señal. */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFoto(f.name);
            }}
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block font-semibold">Nota</span>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={3}
          placeholder="Ej.: Llamé a la encargada a las 9:20 y no atendió."
          className="w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2"
        />
      </label>
    </Hoja>
  );
}
