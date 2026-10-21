"use client";

// Ficha del elemento: el colgadero con todos sus controles (D3), la unidad instalada y el historial.
// Registrar un control o reemplazar la unidad actualiza el estado local (todavía no hay base)
// y la tarjeta afectada muestra la fecha nueva con el golpe de sello.

import { useEffect, useState, type ReactNode } from "react";
import { IconoCerrar, IconoCheck, IconoHerramienta } from "@/components/iconos";
import { RegistrarEjecucion, type Registro } from "@/components/registrar-ejecucion";
import { Colgadero, Tarjeta } from "@/components/tarjeta";
import { Boton, Cifra, CLASE_PLANILLA, cx, Fila, Planilla, Vacio } from "@/components/ui";
import { estadoDe, fechaMedia, hoy, proponerVencimiento } from "@/lib/fechas";
import type { Elemento, FechaISO, Unidad } from "@/lib/tipos";
import type { ControlDeFicha, ItemHistorial } from "./consultas";
import { HojaUnidad, type DatosUnidad } from "./hoja-unidad";
import { TEXTO_ORIGEN, TEXTO_RESULTADO } from "./textos";

// Controles que siguen a la unidad física (en la propuesta: depende_de_unidad).
// TODO(supabase): leer la marca del tipo de control en lugar de fijar los ids.
const ID_PRUEBA = "tc-ph";
const ID_VIDA = "tc-vida";

type UnidadAnterior = Unidad & { retiradaEn: FechaISO };

interface Aviso {
  texto: string;
  tono: "verde" | "tinta";
  accion?: { texto: string; alTocar: () => void };
}

const masRecientePrimero = (h: ItemHistorial[]) => h.slice().sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));

export function FichaElemento({
  elemento,
  controles: controlesIniciales,
  historial: historialInicial,
  supervisor,
  etiqueta,
}: {
  elemento: Elemento;
  controles: ControlDeFicha[];
  historial: ItemHistorial[];
  supervisor: string;
  /** La etiqueta QR, ya armada en el servidor */
  etiqueta: ReactNode;
}) {
  // El orden (peor estado primero) se fija al abrir la ficha: una tarjeta recién registrada
  // no salta al final del colgadero, se queda donde el supervisor la tocó.
  const [items, setItems] = useState(controlesIniciales);
  const [historial, setHistorial] = useState(historialInicial);
  const [unidad, setUnidad] = useState<Unidad | undefined>(elemento.unidad);
  const [anteriores, setAnteriores] = useState<UnidadAnterior[]>(elemento.unidadesAnteriores ?? []);
  const [unidadPendienteDesde, setUnidadPendienteDesde] = useState<FechaISO | null>(null);
  const [selladas, setSelladas] = useState<string[]>([]);
  const [registro, setRegistro] = useState<{ controlId: string; abierta: boolean; vez: number } | null>(null);
  const [hojaUnidad, setHojaUnidad] = useState<{ modo: "reemplazar" | "completar"; abierta: boolean; vez: number } | null>(
    null,
  );
  const [aviso, setAviso] = useState<Aviso | null>(null);

  // El aviso se va solo, salvo que pida hacer algo.
  useEffect(() => {
    if (!aviso || aviso.accion) return;
    const t = setTimeout(() => setAviso(null), 7000);
    return () => clearTimeout(t);
  }, [aviso]);

  const tieneUnidad = !!elemento.unidad;
  const esMatafuego = elemento.tipo.toLowerCase().startsWith("matafuego");
  // La unidad que se fue al taller sigue siendo la del puesto hasta que se registra otra.
  const enTaller = elemento.estado === "en_servicio_externo" && unidad?.serie === elemento.unidad?.serie;
  const elementoActual: Elemento = { ...elemento, unidad };
  const itemPrueba = items.find((i) => i.tipo.id === ID_PRUEBA);
  const itemVida = items.find((i) => i.tipo.id === ID_VIDA);
  const activo = registro ? items.find((i) => i.control.id === registro.controlId) : undefined;

  /** El bloqueo de bloqueoDe() se levanta si la prueba hidráulica ya se registró en esta pantalla. */
  function bloqueoVigente(i: ControlDeFicha) {
    if (!i.bloqueo) return undefined;
    if (itemPrueba && estadoDe(itemPrueba.control, itemPrueba.tipo) !== "vencido") return undefined;
    return i.bloqueo;
  }

  function sellar(ids: string[]) {
    setSelladas((prev) => [...prev.filter((id) => !ids.includes(id)), ...ids]);
  }

  function abrirRegistro(controlId: string) {
    setAviso(null);
    setRegistro((prev) => ({ controlId, abierta: true, vez: (prev?.vez ?? 0) + 1 }));
  }

  function abrirUnidad(modo: "reemplazar" | "completar") {
    setAviso(null);
    setHojaUnidad((prev) => ({ modo, abierta: true, vez: (prev?.vez ?? 0) + 1 }));
  }

  function alRegistrar(r: Registro) {
    const item = items.find((i) => i.control.id === r.controlId);
    if (!item) return;
    const { tipo, control } = item;
    // TODO(supabase): registrar_ejecucion() en una sola transacción (§3.3 de la propuesta).
    // El formulario todavía no pide quién hizo el trabajo: se toma el ejecutor habitual del control.
    const ejecutor = tipo.ejecutor === "SCP" ? "SCP" : (control.ultimoEjecutor ?? supervisor);
    const nuevo = r.vencimientoNuevo;

    if (nuevo) {
      setItems((prev) =>
        prev.map((i) =>
          i.control.id === r.controlId
            ? {
                ...i,
                control: { ...i.control, vencimiento: nuevo, ultimaEjecucion: r.fecha, ultimoEjecutor: ejecutor },
              }
            : i,
        ),
      );
      sellar([r.controlId]);
    }

    setHistorial((prev) =>
      masRecientePrimero([
        {
          id: `nuevo-${Date.now()}`,
          fecha: r.fecha,
          control: tipo.nombre,
          resultado: r.resultado,
          ejecutor,
          vencimientoNuevo: nuevo,
          origen: r.origen,
          oblea: r.oblea,
          nota: r.motivo,
        },
        ...prev,
      ]),
    );

    // Se cambió la unidad: la que estaba pasa a "anteriores" y falta cargar la nueva.
    // TODO: Registro no devuelve la serie que se escribió en el formulario; por eso se pide en la hoja de la unidad.
    const cambioUnidad = r.resultado === "reemplazo" && !!unidad;
    if (cambioUnidad && unidad) {
      setAnteriores((prev) => [{ ...unidad, retiradaEn: r.fecha }, ...prev]);
      setUnidad(undefined);
      setUnidadPendienteDesde(r.fecha);
    }

    setRegistro((prev) => prev && { ...prev, abierta: false });
    setAviso(
      nuevo
        ? {
            tono: "verde",
            texto: `${tipo.hecho}. Vence el ${fechaMedia(nuevo)}.`,
            accion: cambioUnidad ? { texto: "Cargar la unidad nueva", alTocar: () => abrirUnidad("completar") } : undefined,
          }
        : { tono: "tinta", texto: `${tipo.nombre}: quedó registrado que no se pudo hacer. El vencimiento sigue abierto.` },
    );
  }

  function alConfirmarUnidad(d: DatosUnidad) {
    if (!hojaUnidad) return;
    const { modo } = hojaUnidad;
    // TODO(supabase): crear la Unidad, cerrar la anterior (retirada_en) y recalcular los controles que dependen de ella.
    const desde = modo === "completar" ? (unidadPendienteDesde ?? hoy()) : hoy();
    if (modo === "reemplazar" && unidad) {
      setAnteriores((prev) => [{ ...unidad, retiradaEn: desde }, ...prev]);
      setHistorial((prev) =>
        masRecientePrimero([
          {
            id: `nuevo-${Date.now()}`,
            fecha: desde,
            control: "Cambio de unidad",
            resultado: "reemplazo",
            ejecutor: supervisor,
            origen: "calculado",
            nota: `Sale ${unidad.serie}, entra ${d.serie}.`,
          },
          ...prev,
        ]),
      );
    }
    setUnidad({ serie: d.serie, fabricacion: d.fabricacion, instaladaDesde: desde });
    setUnidadPendienteDesde(null);

    // La prueba hidráulica se cuenta desde la última prueba de la unidad; la vida útil, desde la fabricación.
    const baseDe = (i: ControlDeFicha) =>
      i.tipo.id === ID_PRUEBA ? d.ultimaPrueba : i.tipo.id === ID_VIDA ? d.fabricacion : undefined;
    const recalculados = items.flatMap((i) => {
      const base = baseDe(i);
      return base ? [{ id: i.control.id, nombre: i.tipo.nombre, base, vence: proponerVencimiento(i.tipo, base) }] : [];
    });
    setItems((prev) =>
      prev.map((i) => {
        const r = recalculados.find((x) => x.id === i.control.id);
        return r
          ? {
              ...i,
              control: { ...i.control, vencimiento: r.vence, ultimaEjecucion: r.base, ultimoEjecutor: undefined },
            }
          : i;
      }),
    );
    const partes = recalculados.map((r) => `${r.nombre}: vence el ${fechaMedia(r.vence)}.`);
    sellar(recalculados.map((r) => r.id));

    setHojaUnidad((prev) => prev && { ...prev, abierta: false });
    setAviso({ tono: "verde", texto: [modo === "reemplazar" ? "Unidad reemplazada." : "Unidad guardada.", ...partes].join(" ") });
  }

  return (
    <>
      {enTaller && (
        <div className="mb-6 flex gap-3 rounded-[var(--radius-planilla)] border border-tinta bg-papel p-4">
          <IconoHerramienta className="mt-0.5 shrink-0" tamano={22} />
          <p>
            <span className="font-semibold">
              {esMatafuego ? "Este matafuego está en el taller." : "Este equipo está en el taller."}
            </span>{" "}
            En su lugar hay una unidad sustituta.
          </p>
        </div>
      )}

      <section aria-labelledby="titulo-controles" className="mb-8">
        <h2 id="titulo-controles" className="sr-only">
          Controles
        </h2>
        {items.length === 0 ? (
          <Vacio>Este equipo todavía no tiene controles. Se agregan desde el alta del local, con la plantilla del rubro.</Vacio>
        ) : (
          <Colgadero>
            {items.map((i) => {
              const estado = estadoDe(i.control, i.tipo);
              const urgente = estado === "vencido" || estado === "pronto" || estado === "sin_datos";
              return (
                <Tarjeta
                  key={i.control.id}
                  control={i.control}
                  tipo={i.tipo}
                  estado={estado}
                  sellada={selladas.includes(i.control.id)}
                >
                  <Boton ancho variante={urgente ? "primario" : "secundario"} onClick={() => abrirRegistro(i.control.id)}>
                    {i.tipo.verbo}
                  </Boton>
                </Tarjeta>
              );
            })}
          </Colgadero>
        )}
      </section>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_288px] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10">
        {tieneUnidad && (
          <section aria-labelledby="titulo-unidad" className="mb-7 lg:col-start-2 lg:row-start-1">
            <h2 id="titulo-unidad" className="rotulo mb-2 text-xl">
              Unidad instalada
            </h2>

            {unidad ? (
              <div className="overflow-hidden rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel">
                <div className="px-4 py-3">
                  <div className="text-sm text-cemento">Número de serie</div>
                  <Cifra className="mt-0.5 block text-[34px] leading-none">{unidad.serie}</Cifra>
                  {enTaller && (
                    <p className="mt-2 text-sm font-medium">Está en el taller. En el puesto quedó una sustituta.</p>
                  )}
                </div>
                <dl className="grid grid-cols-2 border-t border-junta">
                  <div className="px-4 py-3">
                    <dt className="text-sm text-cemento">Fabricación</dt>
                    <dd>
                      <Cifra className="text-xl">{fechaMedia(unidad.fabricacion)}</Cifra>
                    </dd>
                  </div>
                  <div className="border-l border-junta px-4 py-3">
                    <dt className="text-sm text-cemento">Instalada desde</dt>
                    <dd>
                      <Cifra className="text-xl">{fechaMedia(unidad.instaladaDesde)}</Cifra>
                    </dd>
                  </div>
                </dl>
                <div className="border-t border-junta p-3">
                  <Boton variante="secundario" ancho onClick={() => abrirUnidad("reemplazar")}>
                    Reemplazar unidad
                  </Boton>
                </div>
              </div>
            ) : (
              unidadPendienteDesde && (
                <div className="overflow-hidden rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel">
                  <div aria-hidden className="rayado-suave h-3 border-b border-junta" />
                  <div className="p-4">
                    <p className="font-semibold">Falta cargar la unidad nueva</p>
                    <p className="mt-1 text-sm text-cemento">
                      Se cambió el <Cifra className="text-tinta">{fechaMedia(unidadPendienteDesde)}</Cifra>. Con sus datos se
                      recalculan la prueba hidráulica y la vida útil.
                    </p>
                    <Boton ancho className="mt-3" onClick={() => abrirUnidad("completar")}>
                      Cargar la unidad nueva
                    </Boton>
                  </div>
                </div>
              )
            )}

            {anteriores.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 px-0.5 font-semibold">Unidades anteriores</h3>
                <ul className={CLASE_PLANILLA}>
                  {anteriores.map((u) => (
                    <Fila
                      key={`${u.serie}-${u.retiradaEn}`}
                      titulo={<Cifra className="text-xl font-semibold">{u.serie}</Cifra>}
                      detalle={
                        <>
                          Fabricada el <Cifra className="text-tinta">{fechaMedia(u.fabricacion)}</Cifra>
                          <br />
                          Instalada el <Cifra className="text-tinta">{fechaMedia(u.instaladaDesde)}</Cifra>
                        </>
                      }
                      derecha={
                        <>
                          <span className="text-xs font-medium text-cemento">Retirada</span>
                          <Cifra className="text-lg leading-tight">{fechaMedia(u.retiradaEn)}</Cifra>
                        </>
                      }
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          {historial.length === 0 ? (
            <section className="mb-7">
              <h2 className="rotulo mb-2 text-xl">Historial</h2>
              <Vacio>Todavía no hay trabajos cargados para este equipo. Lo que registres en las tarjetas va a quedar acá.</Vacio>
            </section>
          ) : (
            <Planilla titulo="Historial" aparte={historial.length === 1 ? "1 registro" : `${historial.length} registros`}>
              {/* Filas de varias líneas: la fecha va arriba a la derecha, a la altura del control,
                  y el detalle usa todo el ancho. */}
              {historial.map((h) => (
                <li key={h.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-semibold leading-snug">{h.control}</h3>
                    <Cifra className="shrink-0 text-xl leading-none">{fechaMedia(h.fecha)}</Cifra>
                  </div>
                  <p className="mt-0.5 text-sm text-cemento">
                    {TEXTO_RESULTADO[h.resultado]} ({h.ejecutor})
                  </p>
                  <p className="mt-2 text-sm text-cemento">
                    {h.vencimientoNuevo ? (
                      <>
                        Renovó hasta el <Cifra className="text-tinta">{fechaMedia(h.vencimientoNuevo)}</Cifra>
                        {TEXTO_ORIGEN[h.origen] ? `, ${TEXTO_ORIGEN[h.origen]}` : ""}.
                      </>
                    ) : h.control === "Cambio de unidad" ? (
                      "Se recalcularon la prueba hidráulica y la vida útil."
                    ) : (
                      "El vencimiento siguió abierto."
                    )}
                    {h.oblea && (
                      <>
                        {" "}
                        Oblea <Cifra className="text-tinta">{h.oblea}</Cifra>.
                      </>
                    )}
                  </p>
                  {h.nota && <p className="mt-1.5 border-l-2 border-junta pl-2.5 text-sm">{h.nota}</p>}
                </li>
              ))}
            </Planilla>
          )}
        </div>

        <div className={cx("lg:col-start-2", tieneUnidad ? "lg:row-start-2" : "lg:row-start-1")}>{etiqueta}</div>
      </div>

      {activo && registro && (
        <RegistrarEjecucion
          key={`${activo.control.id}-${registro.vez}`}
          abierta={registro.abierta}
          alCerrar={() => setRegistro((prev) => prev && { ...prev, abierta: false })}
          alRegistrar={alRegistrar}
          control={activo.control}
          tipo={activo.tipo}
          elemento={elementoActual}
          bloqueo={bloqueoVigente(activo)}
        />
      )}

      {hojaUnidad && (
        <HojaUnidad
          key={`${hojaUnidad.modo}-${hojaUnidad.vez}`}
          abierta={hojaUnidad.abierta}
          alCerrar={() => setHojaUnidad((prev) => prev && { ...prev, abierta: false })}
          alConfirmar={alConfirmarUnidad}
          modo={hojaUnidad.modo}
          serieAnterior={unidad?.serie ?? anteriores[0]?.serie}
          tipoPrueba={itemPrueba?.tipo}
          tipoVida={itemVida?.tipo}
        />
      )}

      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(64px+12px+env(safe-area-inset-bottom))] z-40 lg:inset-x-auto lg:bottom-6 lg:left-[280px] lg:w-[480px]"
      >
        {aviso && (
          <div
            className={cx(
              "pointer-events-auto mx-auto flex max-w-[608px] items-start gap-3 rounded-[var(--radius-boton)] py-2 pl-4 pr-1.5 text-papel",
              aviso.tono === "verde" ? "bg-verde" : "bg-tinta",
            )}
          >
            <IconoCheck className="mt-2.5 shrink-0" tamano={20} />
            <div className="min-w-0 flex-1 py-2">
              <p className="font-medium">{aviso.texto}</p>
              {aviso.accion && (
                <Boton variante="secundario" className="mt-2.5" onClick={aviso.accion.alTocar}>
                  {aviso.accion.texto}
                </Boton>
              )}
            </div>
            <button
              onClick={() => setAviso(null)}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-[2px] hover:bg-papel/15"
              aria-label="Cerrar aviso"
            >
              <IconoCerrar tamano={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
