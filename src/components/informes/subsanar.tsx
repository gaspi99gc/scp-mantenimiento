"use client";

// Hoja para subsanar un informe publicado. El original no se toca: se agrega una subsanación debajo.

import { useState } from "react";
import { Hoja } from "@/components/hoja";
import { IconoCheck, IconoDocumento } from "@/components/iconos";
import { Boton, Cifra, cx } from "@/components/ui";

const MOTIVOS = [
  { valor: "Dato mal cargado", ayuda: "Una cifra, un nombre o una fecha que no era." },
  { valor: "Faltaba información", ayuda: "Algo que se hizo y no quedó en el informe." },
  { valor: "Otro", ayuda: "Contá cuál en pocas palabras." },
];

export interface NuevaSubsanacion {
  motivo: string;
  texto: string;
  adjunto?: string;
}

export function HojaSubsanar({
  abierta,
  alCerrar,
  alGuardar,
  numero,
}: {
  abierta: boolean;
  alCerrar: () => void;
  alGuardar: (s: NuevaSubsanacion) => void;
  numero: string;
}) {
  const [motivo, setMotivo] = useState<string | null>(null);
  const [otro, setOtro] = useState("");
  const [texto, setTexto] = useState("");
  const [adjunto, setAdjunto] = useState("");

  const faltan: string[] = [];
  if (!motivo) faltan.push("elegir el motivo");
  if (motivo === "Otro" && !otro.trim()) faltan.push("contar el motivo");
  if (!texto.trim()) faltan.push("escribir la corrección");

  function guardar() {
    if (faltan.length || !motivo) return;
    alGuardar({
      motivo: motivo === "Otro" ? otro.trim() : motivo,
      texto: texto.trim(),
      adjunto: adjunto || undefined,
    });
  }

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo="Subsanar informe"
      pie={
        <div>
          <Boton ancho onClick={guardar} disabled={faltan.length > 0}>
            Agregar subsanación
          </Boton>
          {faltan.length > 0 && (
            <p className="mt-2 text-sm text-cemento" aria-live="polite">
              Falta {faltan.join(", ")}.
            </p>
          )}
        </div>
      }
    >
      <p className="-mt-1 mb-5 text-cemento">
        Informe <Cifra className="text-base text-tinta">{numero}</Cifra>. El original no cambia: la subsanación queda
        debajo, con tu nombre y la fecha de hoy, y el cliente la ve.
      </p>

      <fieldset className="mb-5">
        <legend className="mb-2 font-semibold">Motivo</legend>
        <div className="grid gap-2">
          {MOTIVOS.map((m) => {
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
                  name="motivo"
                  className="mt-1 size-4 accent-[var(--color-tinta)]"
                  checked={elegido}
                  onChange={() => setMotivo(m.valor)}
                />
                <span>
                  <span className="block font-medium">{m.valor}</span>
                  <span className="block text-sm text-cemento">{m.ayuda}</span>
                </span>
              </label>
            );
          })}
        </div>
        {motivo === "Otro" && (
          <input
            value={otro}
            onChange={(e) => setOtro(e.target.value)}
            aria-label="Cuál es el motivo"
            placeholder="Ej.: El cliente pidió aclarar un trabajo"
            className="mt-2 min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3"
          />
        )}
      </fieldset>

      <label className="mb-5 block">
        <span className="mb-1.5 block font-semibold">Corrección</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Ej.: Se cambiaron 3 filtros metálicos, no 2 como dice el resumen."
          className="w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2"
        />
        <span className="mt-1 block text-sm text-cemento">Escribila como querés que la lea el cliente.</span>
      </label>

      <label
        className={cx(
          "flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-boton)] border px-3",
          adjunto ? "border-verde/60" : "border-dashed border-cemento/50",
        )}
      >
        <span className={adjunto ? "text-verde" : "text-cemento"}>{adjunto ? <IconoCheck /> : <IconoDocumento />}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{adjunto ? "Adjunto agregado" : "Agregar foto o documento"}</span>
          <span className="block truncate text-sm text-cemento">{adjunto || "Opcional"}</span>
        </span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="sr-only"
          onChange={(e) => {
            // TODO(supabase): subir con URL firmada al bucket `adjuntos` y guardar el adjunto de la subsanación.
            const f = e.target.files?.[0];
            if (f) setAdjunto(f.name);
          }}
        />
      </label>
    </Hoja>
  );
}
