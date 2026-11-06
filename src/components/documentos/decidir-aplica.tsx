"use client";

// "¿Aplica en este local?": Sí o No, y si no aplica, por qué. Al guardar vuelve a la solapa del local.
// La elección viaja en un campo oculto: si el guardado falla, React limpia el formulario y los radios
// quedarían marcados en pantalla pero vacíos al enviar.

import { useActionState, useState } from "react";
import { decidirDocumento, type EstadoDecision } from "@/app/s/documentos/acciones";
import { AvisoError, Campo, CLASE_CAMPO } from "@/components/cuenta/campos";
import { Boton, cx } from "@/components/ui";

const OPCION =
  "flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2.5 has-[:checked]:border-tinta has-[:checked]:bg-yeso/60";
const RADIO = "size-5 shrink-0 accent-[var(--color-tinta)]";

export function DecidirAplica({
  id,
  aplica,
  motivo,
  solapa,
}: {
  id: string;
  aplica: boolean | null;
  motivo?: string;
  solapa: string;
}) {
  const [estado, guardar, guardando] = useActionState<EstadoDecision, FormData>(decidirDocumento, {});
  const [eleccion, setEleccion] = useState<"si" | "no" | null>(aplica === null ? null : aplica ? "si" : "no");

  return (
    <form action={guardar} className="mb-8">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="solapa" value={solapa} />
      <input type="hidden" name="aplica" value={eleccion ?? ""} />
      <fieldset>
        <legend className="rotulo mb-2 text-xl">¿Aplica en este local?</legend>
        {estado.error && (
          <div className="mb-3">
            <AvisoError>
              <p className="font-semibold">{estado.error}</p>
            </AvisoError>
          </div>
        )}
        <div className="grid gap-2 sm:max-w-md sm:grid-cols-2">
          <label className={OPCION}>
            <input type="radio" name="eleccion" value="si" defaultChecked={eleccion === "si"} onChange={() => setEleccion("si")} className={RADIO} />
            <span className="font-semibold">Sí, aplica</span>
          </label>
          <label className={OPCION}>
            <input type="radio" name="eleccion" value="no" defaultChecked={eleccion === "no"} onChange={() => setEleccion("no")} className={RADIO} />
            <span className="font-semibold">No aplica</span>
          </label>
        </div>
      </fieldset>

      {eleccion === "no" && (
        <div className="mt-4 sm:max-w-md">
          <Campo id="motivo" rotulo="Por qué no aplica">
            <textarea
              id="motivo"
              name="motivo"
              required
              rows={2}
              maxLength={300}
              defaultValue={estado.motivo ?? motivo ?? ""}
              placeholder="Por ejemplo: no tiene ascensor…"
              autoComplete="off"
              className={cx(CLASE_CAMPO, "border-borde py-2.5")}
            />
          </Campo>
        </div>
      )}

      <Boton type="submit" disabled={guardando} className="mt-4 max-sm:w-full">
        {guardando ? "Guardando…" : "Guardar"}
      </Boton>
    </form>
  );
}
