"use client";

// Trabajos que no son controles: "Cambié 3 tubos LED", "Destapé la pileta de la cocina".

import { useState } from "react";
import { Hoja } from "@/components/hoja";
import { Boton, Chip } from "@/components/ui";

export const RUBROS = [
  { valor: "electricidad", texto: "Electricidad" },
  { valor: "plomeria", texto: "Plomería" },
  { valor: "gas", texto: "Gas" },
  { valor: "pintura", texto: "Pintura" },
  { valor: "albanileria", texto: "Albañilería" },
  { valor: "otro", texto: "Otro" },
] as const;

export type RubroTrabajo = (typeof RUBROS)[number]["valor"];

export interface Trabajo {
  id: string;
  descripcion: string;
  rubro: RubroTrabajo;
  materiales: string;
  fueraDeAbono: boolean;
}

export const nombreRubro = (r: RubroTrabajo) => RUBROS.find((x) => x.valor === r)?.texto ?? "Otro";

const CAMPO = "w-full rounded-[var(--radius-boton)] border border-junta bg-papel px-3";

export function HojaTrabajo({
  abierta,
  alCerrar,
  alAgregar,
}: {
  abierta: boolean;
  alCerrar: () => void;
  alAgregar: (t: Trabajo) => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [rubro, setRubro] = useState<RubroTrabajo | null>(null);
  const [materiales, setMateriales] = useState("");
  const [fueraDeAbono, setFueraDeAbono] = useState(false);

  const faltan: string[] = [];
  if (!descripcion.trim()) faltan.push("qué hiciste");
  if (!rubro) faltan.push("el rubro");

  function agregar() {
    if (faltan.length || !rubro) return;
    alAgregar({
      id: `tr-${Date.now()}`,
      descripcion: descripcion.trim(),
      rubro,
      materiales: materiales.trim(),
      fueraDeAbono,
    });
    setDescripcion("");
    setRubro(null);
    setMateriales("");
    setFueraDeAbono(false);
  }

  return (
    <Hoja
      abierta={abierta}
      alCerrar={alCerrar}
      titulo="Agregar trabajo"
      pie={
        <div>
          <Boton ancho onClick={agregar} disabled={faltan.length > 0}>
            Agregar trabajo
          </Boton>
          {faltan.length > 0 && (
            <p className="mt-2 text-sm text-cemento" aria-live="polite">
              Falta {faltan.join(" y ")}.
            </p>
          )}
        </div>
      }
    >
      <p className="-mt-1 mb-4 text-cemento">Lo que hiciste fuera de los controles. Sale en el informe.</p>

      <label className="mb-5 block">
        <span className="mb-1.5 block font-semibold">Qué hiciste</span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          rows={2}
          placeholder="Ej.: Cambié 3 tubos LED del salón."
          className={`${CAMPO} py-2`}
        />
      </label>

      <fieldset className="mb-5">
        <legend className="mb-2 font-semibold">Rubro</legend>
        <div className="flex flex-wrap gap-2">
          {RUBROS.map((r) => (
            <Chip key={r.valor} type="button" activo={rubro === r.valor} onClick={() => setRubro(r.valor)} className="min-h-12! px-4">
              {r.texto}
            </Chip>
          ))}
        </div>
      </fieldset>

      <label className="mb-5 block">
        <span className="mb-1.5 block font-semibold">Materiales</span>
        <input
          value={materiales}
          onChange={(e) => setMateriales(e.target.value)}
          placeholder="Ej.: 3 tubos LED 18 W"
          className={`${CAMPO} min-h-12`}
        />
      </label>

      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-[var(--radius-boton)] border border-junta px-3 py-2.5">
        <input
          type="checkbox"
          checked={fueraDeAbono}
          onChange={(e) => setFueraDeAbono(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 accent-[var(--color-tinta)]"
        />
        <span>
          <span className="block font-medium">Fuera del abono</span>
          <span className="block text-sm text-cemento">Se cobra aparte. Queda marcado en el informe.</span>
        </span>
      </label>
    </Hoja>
  );
}
