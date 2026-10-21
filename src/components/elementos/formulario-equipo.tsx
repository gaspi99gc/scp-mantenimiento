"use client";

// Alta de equipo: tipo, código (sugerido, editable), ubicación, detalle y, si lleva cilindro,
// el número de serie y la fabricación de la unidad instalada.

import { useActionState, useState } from "react";
import { crearEquipo, type EstadoEquipo } from "@/app/s/locales/[id]/equipos/nuevo/acciones";
import { AvisoError, Campo, CLASE_CAMPO } from "@/components/cuenta/campos";
import { Boton, cx, TituloPlanilla } from "@/components/ui";

export interface TipoEquipoOpcion {
  id: string;
  nombre: string;
  usaUnidad: boolean;
}

const CAMPO = cx(CLASE_CAMPO, "border-borde");
const CAJA = "grid gap-5 rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel p-4 sm:grid-cols-2";

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Abreviatura del tipo para el código: Matafuego → MAT, Luces de emergencia → LUZ. */
function abreviatura(tipo: string): string {
  const t = sinTildes(tipo).toLowerCase();
  if (t.startsWith("luces")) return "LUZ";
  if (t.includes("aire")) return "AIR";
  return sinTildes(tipo).replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
}

/** El código siguiente: mismo prefijo que los equipos del local y el número que sigue para ese tipo. */
function sugerirCodigo(prefijo: string, tipo: string, existentes: string[]): string {
  const base = `${prefijo}-${abreviatura(tipo)}-`;
  const usados = existentes
    .filter((c) => c.startsWith(base))
    .map((c) => Number(c.slice(base.length)))
    .filter((n) => Number.isFinite(n));
  return `${base}${String((usados.length ? Math.max(...usados) : 0) + 1).padStart(2, "0")}`;
}

export function FormularioEquipo({
  localId,
  tipos,
  prefijo,
  codigosExistentes,
}: {
  localId: string;
  tipos: TipoEquipoOpcion[];
  prefijo: string;
  codigosExistentes: string[];
}) {
  const [estado, crear, creando] = useActionState<EstadoEquipo, FormData>(crearEquipo, {});
  const v = estado.valores ?? {};
  const [tipoId, setTipoId] = useState(v.tipoEquipoId ?? "");
  const [codigo, setCodigo] = useState(v.codigo ?? "");
  const [codigoTocado, setCodigoTocado] = useState(!!v.codigo);
  const tipo = tipos.find((t) => t.id === tipoId);

  function elegirTipo(id: string) {
    setTipoId(id);
    const t = tipos.find((x) => x.id === id);
    if (t && !codigoTocado) setCodigo(sugerirCodigo(prefijo, t.nombre, codigosExistentes));
  }

  return (
    <form action={crear}>
      <input type="hidden" name="localId" value={localId} />
      {estado.error && (
        <div className="mb-6">
          <AvisoError>
            <p className="font-semibold">{estado.error}</p>
          </AvisoError>
        </div>
      )}

      <section className="mb-7" aria-labelledby="equipo">
        <TituloPlanilla id="equipo" titulo="Equipo" />
        <div className={CAJA}>
          <Campo id="tipoEquipoId" rotulo="Tipo de equipo">
            <select
              id="tipoEquipoId"
              name="tipoEquipoId"
              required
              value={tipoId}
              onChange={(e) => elegirTipo(e.target.value)}
              className={CAMPO}
            >
              <option value="" disabled>
                Elegí el tipo
              </option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </Campo>
          <Campo id="codigo" rotulo="Código" ayuda="Es el que va impreso en la etiqueta QR. Se puede cambiar.">
            <input
              id="codigo"
              name="codigo"
              required
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase());
                setCodigoTocado(true);
              }}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={`${prefijo}-MAT-01`}
              aria-describedby="codigo-ayuda"
              className={cx(CAMPO, "cifra text-xl")}
            />
          </Campo>
          <Campo id="ubicacion" rotulo="Dónde está">
            <input
              id="ubicacion"
              name="ubicacion"
              required
              defaultValue={v.ubicacion}
              autoComplete="off"
              placeholder="Salón, junto a la caja"
              className={CAMPO}
            />
          </Campo>
          <Campo id="detalle" rotulo="Detalle (opcional)" ayuda="Capacidad o cantidad: 1.000 l, (6), 4.500 fg…">
            <input id="detalle" name="detalle" defaultValue={v.detalle} autoComplete="off" className={CAMPO} />
          </Campo>
        </div>
      </section>

      {tipo?.usaUnidad && (
        <section className="mb-7" aria-labelledby="cilindro">
          <TituloPlanilla id="cilindro" titulo="Cilindro instalado (si lo tenés a mano)" />
          <div className={CAJA}>
            <Campo id="serie" rotulo="Número de serie">
              <input
                id="serie"
                name="serie"
                defaultValue={v.serie}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="C-448120"
                className={cx(CAMPO, "cifra text-xl")}
              />
            </Campo>
            <Campo id="fabricacion" rotulo="Fecha de fabricación" ayuda="Con esta fecha se calcula la vida útil (20 años).">
              <input
                id="fabricacion"
                name="fabricacion"
                type="date"
                defaultValue={v.fabricacion}
                max={new Date().toISOString().slice(0, 10)}
                aria-describedby="fabricacion-ayuda"
                className={cx(CAMPO, "cifra text-xl")}
              />
            </Campo>
          </div>
        </section>
      )}

      <Boton type="submit" disabled={creando} className="max-sm:w-full">
        {creando ? "Creando…" : "Crear equipo"}
      </Boton>
      <p className="mb-8 mt-2 text-sm text-cemento">
        Al crearlo se le agregan solos sus controles (por ejemplo, un matafuego recibe recarga, prueba hidráulica y vida
        útil). Después vas a su ficha, donde está la etiqueta QR para imprimir.
      </p>
    </form>
  );
}
