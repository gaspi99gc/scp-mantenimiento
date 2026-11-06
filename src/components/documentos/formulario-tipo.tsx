"use client";

// Crear o editar un documento del catálogo (solo admin): qué es, en qué solapas va, si se pide siempre
// o según el local, cuándo vence y si ya se usa. Mismo armado que el formulario de controles.
// Los valores que maneja React viajan en campos ocultos: si el guardado falla, React limpia el formulario
// y los radios y selectores quedarían marcados en pantalla pero vacíos al enviar.

import { useActionState, useState } from "react";
import { guardarTipoDocumento, type EstadoTipoDocumento } from "@/app/s/mas/documentos/acciones";
import { AvisoError, Campo, CLASE_CAMPO } from "@/components/cuenta/campos";
import { Boton, cx, TituloPlanilla } from "@/components/ui";
import { SOLAPAS, textoVencimiento, type Solapa } from "@/lib/documentos";

export interface DatosTipoDocumento {
  id?: string;
  nombre: string;
  grupo: string;
  detalle: string;
  norma: string;
  solapas: Solapa[];
  aplica: "siempre" | "de_corresponder";
  vence: "no" | "manual" | "mes" | "anio";
  periodoValor: string;
  anticipacion: string;
  uso: "activo" | "a_validar" | "apagado";
}

const CAMPO = cx(CLASE_CAMPO, "border-borde");
const CAJA = "grid gap-5 rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel p-4 sm:grid-cols-2";
const OPCION =
  "flex min-h-12 cursor-pointer items-start gap-2.5 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 py-2.5 has-[:checked]:border-tinta has-[:checked]:bg-yeso/60";
const MARCA = "mt-0.5 size-5 shrink-0 accent-[var(--color-tinta)]";

function Opcion({ name, value, checked, onChange, texto, ayuda }: {
  name: string; value: string; checked: boolean; onChange: () => void; texto: string; ayuda?: string;
}) {
  return (
    <label className={OPCION}>
      <input type="radio" name={`${name}-opcion`} value={value} defaultChecked={checked} onChange={onChange} className={MARCA} />
      <span>
        <span className="block font-semibold leading-tight">{texto}</span>
        {ayuda && <span className="block text-sm leading-snug text-cemento">{ayuda}</span>}
      </span>
    </label>
  );
}

export function FormularioTipoDocumento({ inicial, grupos }: { inicial: DatosTipoDocumento; grupos: string[] }) {
  const [estado, guardar, guardando] = useActionState<EstadoTipoDocumento, FormData>(guardarTipoDocumento, {});
  const [aplica, setAplica] = useState(inicial.aplica);
  const [vence, setVence] = useState(inicial.vence);
  const [valor, setValor] = useState(inicial.periodoValor);
  const [aviso, setAviso] = useState(inicial.anticipacion);
  const [uso, setUso] = useState(inicial.uso);
  // Si el guardado falla, el formulario se vuelve a llenar con lo que se había escrito.
  const texto = (k: "nombre" | "grupo" | "detalle" | "norma") => {
    const v = estado.valores?.[k];
    return typeof v === "string" ? v : inicial[k];
  };
  const solapas = (estado.valores?.solapas as Solapa[] | undefined) ?? inicial.solapas;

  const n = Number(valor);
  const cada = vence === "mes" || vence === "anio";
  const resumen =
    vence === "no"
      ? "No vence: alcanza con tener el PDF."
      : cada && !(n > 0)
        ? "Poné cada cuánto vence."
        : `${textoVencimiento({ periodoValor: cada ? n : undefined, periodoUnidad: vence })}. Pasa a Por vencer ${
            aviso === "1" ? "1 día" : `${aviso || 0} días`
          } antes.`;

  return (
    <form action={guardar}>
      <input type="hidden" name="id" value={inicial.id ?? ""} />
      <input type="hidden" name="aplica" value={aplica} />
      <input type="hidden" name="vence" value={vence} />
      <input type="hidden" name="periodoValor" value={cada ? valor : ""} />
      <input type="hidden" name="anticipacion" value={aviso} />
      <input type="hidden" name="uso" value={uso} />
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
          <div className="sm:col-span-2">
            <Campo id="nombre" rotulo="Nombre del documento">
              <input id="nombre" name="nombre" required defaultValue={texto("nombre")} autoComplete="off" className={CAMPO} />
            </Campo>
          </div>
          <div className="sm:col-span-2">
            <Campo id="detalle" rotulo="Detalle (opcional)" ayuda="Lo que mira el inspector: con QR, firmado, vigente…">
              <input id="detalle" name="detalle" defaultValue={texto("detalle")} autoComplete="off" className={CAMPO} />
            </Campo>
          </div>
          <Campo id="grupo" rotulo="Grupo (opcional)" ayuda="En AGC: Habilitación, Seguridad, Higiene…">
            <input id="grupo" name="grupo" list="grupos" defaultValue={texto("grupo")} autoComplete="off" className={CAMPO} />
          </Campo>
          <datalist id="grupos">
            {grupos.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <Campo id="norma" rotulo="Norma (opcional)" ayuda="Por ejemplo Ley 5920.">
            <input id="norma" name="norma" defaultValue={texto("norma")} autoComplete="off" className={CAMPO} />
          </Campo>
          <fieldset className="sm:col-span-2">
            <legend className="rotulo mb-1.5 text-lg">Solapas</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SOLAPAS.map((s) => (
                <label key={s.clave} className="flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[var(--radius-boton)] border border-junta bg-papel px-3 has-[:checked]:border-tinta">
                  <input type="checkbox" name="solapas" value={s.clave} defaultChecked={solapas.includes(s.clave)}
                    className="size-5 shrink-0 accent-[var(--color-tinta)]" />
                  <span className="font-medium">{s.corto}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="sm:col-span-2">
            <legend className="rotulo mb-1.5 text-lg">Se pide</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <Opcion name="aplica" value="siempre" checked={aplica === "siempre"} onChange={() => setAplica("siempre")}
                texto="Siempre" ayuda="Todos los locales lo tienen que tener." />
              <Opcion name="aplica" value="de_corresponder" checked={aplica === "de_corresponder"}
                onChange={() => setAplica("de_corresponder")}
                texto="De corresponder" ayuda="En cada local se define si aplica: ascensor, calderas, show…" />
            </div>
          </fieldset>
        </div>
      </section>

      <section className="mb-7" aria-labelledby="cuando">
        <TituloPlanilla id="cuando" titulo="Cuándo vence" />
        <div className={CAJA}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,6rem)] gap-3 sm:col-span-2 sm:max-w-md">
            <Campo id="vence" rotulo="Vence">
              <select id="vence" value={vence} onChange={(e) => setVence(e.target.value as DatosTipoDocumento["vence"])}
                className={CAMPO}>
                <option value="manual">Según el certificado</option>
                <option value="mes">Cada tantos meses</option>
                <option value="anio">Cada tantos años</option>
                <option value="no">No vence</option>
              </select>
            </Campo>
            <Campo id="periodoValor" rotulo="Cada">
              <input id="periodoValor" inputMode="numeric" autoComplete="off" value={cada ? valor : ""}
                onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))} disabled={!cada}
                className={cx(CAMPO, "cifra text-xl")} />
            </Campo>
          </div>
          {vence !== "no" && (
            <Campo id="anticipacion" rotulo="Avisar con cuántos días">
              <input id="anticipacion" inputMode="numeric" autoComplete="off" required value={aviso}
                onChange={(e) => setAviso(e.target.value.replace(/\D/g, ""))} className={cx(CAMPO, "cifra text-xl")} />
            </Campo>
          )}
          <p className="self-end rounded-[var(--radius-boton)] bg-yeso/70 p-3 text-sm font-medium sm:col-span-2" aria-live="polite">
            {resumen}
          </p>
        </div>
      </section>

      <section className="mb-7" aria-labelledby="uso">
        <TituloPlanilla id="uso" titulo="¿Se usa?" />
        <div className={CAJA}>
          <fieldset className="sm:col-span-2">
            <legend className="sr-only">¿Se usa?</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              <Opcion name="uso" value="activo" checked={uso === "activo"} onChange={() => setUso("activo")}
                texto="Activo" ayuda="Lo tienen todos los locales." />
              <Opcion name="uso" value="a_validar" checked={uso === "a_validar"} onChange={() => setUso("a_validar")}
                texto="A validar" ayuda="Apagado hasta confirmarlo." />
              <Opcion name="uso" value="apagado" checked={uso === "apagado"} onChange={() => setUso("apagado")}
                texto="Apagado" ayuda="Deja de mostrarse en los locales." />
            </div>
          </fieldset>
        </div>
      </section>

      <Boton type="submit" disabled={guardando} className="mb-8 max-sm:w-full">
        {guardando ? "Guardando…" : inicial.id ? "Guardar cambios" : "Crear documento"}
      </Boton>
    </form>
  );
}
