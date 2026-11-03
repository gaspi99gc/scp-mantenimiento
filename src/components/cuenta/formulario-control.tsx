"use client";

// Crear o editar un control del catálogo (solo admin). Muestra cómo va a quedar: "Cada 12 meses,
// desde el día del trabajo. Aviso 10 días antes."

import { useActionState, useState, useTransition } from "react";
import { cambiarActivoControl, guardarControl, type EstadoCatalogo } from "@/app/s/mas/catalogo/acciones";
import { Boton, cx, TituloPlanilla } from "@/components/ui";
import { AvisoError, Campo, CLASE_CAMPO } from "./campos";

export interface DatosControl {
  id?: string;
  nombre: string;
  alcance: "local" | "equipos";
  equipos: string[];
  periodoUnidad: "dia" | "mes" | "anio" | "manual";
  periodoValor: string;
  base: "desde_ejecucion" | "desde_vencimiento";
  anticipacion: string;
  ejecutor: "scp" | "tercero";
  norma: string;
  pideOblea: boolean;
  activo: boolean;
}

const CAMPO = cx(CLASE_CAMPO, "border-borde");
const CAJA = "grid gap-5 rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel p-4 sm:grid-cols-2";
const OPCION =
  "flex min-h-12 cursor-pointer items-start gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2.5 has-[:checked]:border-tinta has-[:checked]:bg-yeso/60";
const RADIO = "mt-0.5 size-5 shrink-0 accent-[var(--color-tinta)]";

function Opcion({ name, value, checked, onChange, texto, ayuda }: {
  name: string; value: string; checked: boolean; onChange: () => void; texto: string; ayuda?: string;
}) {
  return (
    <label className={OPCION}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className={RADIO} />
      <span>
        <span className="block font-semibold leading-tight">{texto}</span>
        {ayuda && <span className="block text-sm leading-snug text-cemento">{ayuda}</span>}
      </span>
    </label>
  );
}

export function FormularioControl({ inicial, tiposEquipo }: { inicial: DatosControl; tiposEquipo: { id: string; nombre: string }[] }) {
  const [estado, guardar, guardando] = useActionState<EstadoCatalogo, FormData>(guardarControl, {});
  const [alcance, setAlcance] = useState(inicial.alcance);
  const [unidad, setUnidad] = useState(inicial.periodoUnidad);
  const [valor, setValor] = useState(inicial.periodoValor);
  const [base, setBase] = useState(inicial.base);
  const [aviso, setAviso] = useState(inicial.anticipacion);
  const [ejecutor, setEjecutor] = useState(inicial.ejecutor);
  const [estadoActivo, setEstadoActivo] = useState<EstadoCatalogo>({});
  const [activo, setActivo] = useState(inicial.activo);
  const [cambiando, empezar] = useTransition();

  const unidades = { dia: ["día", "días"], mes: ["mes", "meses"], anio: ["año", "años"] } as const;
  const n = Number(valor);
  const resumen =
    unidad === "manual"
      ? "La fecha de vencimiento la dice el certificado o el documento."
      : n > 0
        ? `Cada ${n} ${n === 1 ? unidades[unidad][0] : unidades[unidad][1]}, ${
            base === "desde_ejecucion" ? "desde el día del trabajo" : "desde el vencimiento anterior"
          }. Aviso ${aviso || 0} ${aviso === "1" ? "día" : "días"} antes.`
        : "Poné cada cuánto se hace.";

  function alternarActivo() {
    if (!inicial.id) return;
    const texto = activo
      ? `¿Desactivar "${inicial.nombre}"? Los locales y equipos nuevos ya no lo reciben; los que lo tienen lo conservan.`
      : `¿Activar "${inicial.nombre}" de nuevo?`;
    if (!window.confirm(texto)) return;
    empezar(async () => {
      const r = await cambiarActivoControl(inicial.id!, !activo);
      setEstadoActivo(r);
      if (!r.error) setActivo(!activo);
    });
  }

  return (
    <>
      <form action={guardar}>
        <input type="hidden" name="id" value={inicial.id ?? ""} />
        {estado.error && (
          <div className="mb-6">
            <AvisoError>
              <p className="font-semibold">{estado.error}</p>
            </AvisoError>
          </div>
        )}

        <section className="mb-7" aria-labelledby="que">
          <TituloPlanilla id="que" titulo="Qué es" />
          <div className={CAJA}>
            <Campo id="nombre" rotulo="Nombre del control" ayuda="Lo que se hace: Recarga, Limpieza de tanque…">
              <input id="nombre" name="nombre" required defaultValue={inicial.nombre} autoComplete="off" className={CAMPO} />
            </Campo>
            <Campo id="norma" rotulo="Norma (opcional)" ayuda="Por ejemplo IRAM 3517-2.">
              <input id="norma" name="norma" defaultValue={inicial.norma} autoComplete="off" className={CAMPO} />
            </Campo>
            <fieldset className="sm:col-span-2">
              <legend className="rotulo mb-1.5 text-lg">Se aplica a</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Opcion name="alcance" value="local" checked={alcance === "local"} onChange={() => setAlcance("local")}
                  texto="Todo el local" ayuda="Plagas, puesta a tierra, habilitación…" />
                <Opcion name="alcance" value="equipos" checked={alcance === "equipos"} onChange={() => setAlcance("equipos")}
                  texto="Ciertos tipos de equipo" ayuda="Matafuegos, tanques, campanas…" />
              </div>
              {alcance === "equipos" && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2" role="group" aria-label="Tipos de equipo">
                  {tiposEquipo.map((t) => (
                    <label key={t.id} className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[var(--radius-boton)] border border-junta bg-papel px-3 has-[:checked]:border-tinta">
                      <input type="checkbox" name="equipos" value={t.id} defaultChecked={inicial.equipos.includes(t.id)}
                        className="size-5 shrink-0 accent-[var(--color-tinta)]" />
                      <span className="font-medium">{t.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          </div>
        </section>

        <section className="mb-7" aria-labelledby="cuando">
          <TituloPlanilla id="cuando" titulo="Cada cuánto" />
          <div className={CAJA}>
            <div className="grid grid-cols-[minmax(0,6rem)_minmax(0,1fr)] gap-3 sm:col-span-2 sm:max-w-md">
              <Campo id="periodoValor" rotulo="Cada">
                <input id="periodoValor" name="periodoValor" inputMode="numeric" value={unidad === "manual" ? "" : valor}
                  onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))} disabled={unidad === "manual"}
                  className={cx(CAMPO, "cifra text-xl")} />
              </Campo>
              <Campo id="periodoUnidad" rotulo="Unidad">
                <select id="periodoUnidad" name="periodoUnidad" value={unidad}
                  onChange={(e) => setUnidad(e.target.value as DatosControl["periodoUnidad"])} className={CAMPO}>
                  <option value="dia">Días</option>
                  <option value="mes">Meses</option>
                  <option value="anio">Años</option>
                  <option value="manual">Según el documento</option>
                </select>
              </Campo>
            </div>
            {unidad !== "manual" && (
              <fieldset className="sm:col-span-2">
                <legend className="rotulo mb-1.5 text-lg">Se cuenta desde</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Opcion name="base" value="desde_ejecucion" checked={base === "desde_ejecucion"} onChange={() => setBase("desde_ejecucion")}
                    texto="El día del trabajo" ayuda="Lo normal: recarga, limpiezas." />
                  <Opcion name="base" value="desde_vencimiento" checked={base === "desde_vencimiento"} onChange={() => setBase("desde_vencimiento")}
                    texto="El vencimiento anterior" ayuda="Calendario fijo: plagas, service anual." />
                </div>
              </fieldset>
            )}
            <Campo id="anticipacion" rotulo="Avisar con cuántos días">
              <input id="anticipacion" name="anticipacion" inputMode="numeric" required value={aviso}
                onChange={(e) => setAviso(e.target.value.replace(/\D/g, ""))} className={cx(CAMPO, "cifra text-xl")} />
            </Campo>
            <p className="self-end rounded-[var(--radius-boton)] bg-yeso/70 p-3 text-sm font-medium sm:col-span-2" aria-live="polite">
              {resumen}
            </p>
          </div>
        </section>

        <section className="mb-7" aria-labelledby="quien">
          <TituloPlanilla id="quien" titulo="Quién lo hace" />
          <div className={CAJA}>
            <fieldset className="sm:col-span-2">
              <legend className="sr-only">Quién lo hace</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Opcion name="ejecutor" value="scp" checked={ejecutor === "scp"} onChange={() => setEjecutor("scp")} texto="SCP" />
                <Opcion name="ejecutor" value="tercero" checked={ejecutor === "tercero"} onChange={() => setEjecutor("tercero")}
                  texto="Un tercero" ayuda="Recargadora, fumigadora, matriculado…" />
              </div>
            </fieldset>
            <label className="flex min-h-12 cursor-pointer items-center gap-2.5 sm:col-span-2">
              <input type="checkbox" name="pideOblea" value="si" defaultChecked={inicial.pideOblea}
                className="size-5 shrink-0 accent-[var(--color-tinta)]" />
              <span className="font-medium">Al registrarlo, pedir el número de oblea</span>
            </label>
          </div>
        </section>

        <Boton type="submit" disabled={guardando} className="max-sm:w-full">
          {guardando ? "Guardando…" : inicial.id ? "Guardar cambios" : "Crear control"}
        </Boton>
        <p className="mb-8 mt-2 text-sm text-cemento">
          {inicial.id
            ? "Un cambio de período rige desde la próxima vez que se registra: no cambia los vencimientos que ya están cargados."
            : "Al crearlo, los locales o equipos que correspondan lo reciben sin fecha, listo para cargarle la primera."}
        </p>
      </form>

      {inicial.id && (
        <section className="mb-8 border-t-2 border-dashed border-junta pt-5" aria-labelledby="desactivar">
          <h2 id="desactivar" className="rotulo text-lg">{activo ? "Dejar de usar este control" : "Volver a usar este control"}</h2>
          <p className="mb-3 mt-1 text-sm text-cemento">
            No se borra: los que ya lo tienen conservan su historial. Solo deja de agregarse a locales y equipos nuevos.
          </p>
          <div aria-live="polite" className="mb-3 empty:hidden">
            {estadoActivo.error && <AvisoError><p className="font-semibold">{estadoActivo.error}</p></AvisoError>}
            {estadoActivo.ok && <p role="status" className="rounded-[var(--radius-planilla)] border-2 border-verde bg-papel p-3 text-sm font-medium">{estadoActivo.ok}</p>}
          </div>
          <Boton type="button" variante={activo ? "peligro" : "secundario"} onClick={alternarActivo} disabled={cambiando} className="max-sm:w-full">
            {cambiando ? "Guardando…" : activo ? "Desactivar control" : "Activar control"}
          </Boton>
        </section>
      )}
    </>
  );
}
