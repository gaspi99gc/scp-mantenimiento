"use client";

// Armar visita: qué se hace, cuándo, y el aviso al encargado. Propone "ya que vas" lo que vence
// en los 30 días siguientes a la fecha elegida, para aprovechar el viaje.

import { useState, type ReactNode } from "react";
import { IconoAlerta, IconoCheck, IconoLlave, IconoWhatsapp } from "@/components/iconos";
import { BarraAccion, Boton, BotonLink, Chip, Cinta, cx, Encabezado, FechaFila, MarcaEstado, Planilla } from "@/components/ui";
import { fechaCorta, fechaLarga, sumarDias, textoRelativo } from "@/lib/fechas";
import type { FechaISO } from "@/lib/tipos";
import type { ControlVisita } from "./consultas";
import {
  horaCorta,
  horasDeAnticipacion,
  inicioDeVisita,
  linkWhatsapp,
  mensajeAlEncargado,
  primerDiaConAnticipacion,
} from "./textos";

const FRANJAS = ["8 a 10 h", "10 a 12 h", "14 a 16 h", "16 a 18 h"];
const CAMPO = "min-h-12 rounded-[var(--radius-boton)] border border-borde bg-papel px-3";

function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="rotulo mb-2 text-xl">{children}</h2>;
}

const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** "8 a 10 h" sin cortes de renglón, solo para mostrar (el mensaje de WhatsApp va con espacios comunes). */
const sinCortes = (s: string) => s.replace(/ /g, "\u00a0");

/** "martes 13 a las 8 h": el último momento para pedir el permiso. */
function limiteParaPedir(fecha: FechaISO, franja: string, horas: number): string {
  const inicio = new Date(inicioDeVisita(fecha, franja) - horas * 3_600_000);
  const ar = new Date(inicio.getTime() - 3 * 3_600_000); // a hora de Argentina, leída como UTC
  const dia = ar.toISOString().slice(0, 10);
  const hhmm = ar.toISOString().slice(11, 16);
  return `${fechaLarga(dia).replace(/ de \S+$/, "")} a las ${horaCorta(hhmm)} h`;
}

function FilaElegible({
  cv,
  elegido,
  alCambiar,
  nota,
  conRelativo = true,
}: {
  cv: ControlVisita;
  elegido: boolean;
  alCambiar?: (v: boolean) => void;
  nota?: ReactNode;
  conRelativo?: boolean;
}) {
  const v = cv.control.vencimiento;
  const contenido = (
    <>
      <Cinta estado={cv.estado} />
      <div className="flex min-w-0 flex-1 items-stretch gap-3 py-3 pl-3.5 pr-4">
      {alCambiar && (
        <input
          type="checkbox"
          checked={elegido}
          onChange={(e) => alCambiar(e.target.checked)}
          className="mt-0.5 size-5 shrink-0 self-start accent-[var(--color-tinta)]"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-snug">{cv.tipo.nombre}</div>
        <div className="mt-0.5 text-sm text-cemento">{cv.sobre}</div>
        {nota && <div className="mt-1.5 text-sm">{nota}</div>}
      </div>
      <div className="flex shrink-0 flex-col items-end text-right">
        {v ? (
          <FechaFila
            fecha={fechaCorta(v)}
            relativo={conRelativo ? textoRelativo(v) : undefined}
            tono={cv.estado === "vencido" ? "rojo" : "normal"}
          />
        ) : (
          <span className="text-sm text-cemento">Sin fecha</span>
        )}
        {cv.visita && <span className="mt-1 text-xs font-medium">Visita el {fechaCorta(cv.visita.fecha)}</span>}
      </div>
      </div>
    </>
  );
  return (
    <li>
      {alCambiar ? (
        <label className="flex min-h-14 cursor-pointer items-stretch transition-colors hover:bg-yeso/45">
          {contenido}
        </label>
      ) : (
        <div className="flex min-h-14 items-stretch">{contenido}</div>
      )}
    </li>
  );
}

export function ArmarVisita({
  local,
  supervisor,
  controles,
  requisito,
  hoy,
  ahora,
}: {
  local: { id: string; nombre: string; encargado: { nombre: string; telefono: string } };
  supervisor: string;
  controles: ControlVisita[];
  requisito?: { pedido: string; aviso: string; detalle: string; horas?: number };
  hoy: FechaISO;
  /** Momento de la consulta (ms), para calcular la anticipación igual en el servidor y en el celular. */
  ahora: number;
}) {
  const manana = sumarDias(hoy, 1);
  const horasPermiso = requisito?.horas;

  const [franjaElegida, setFranjaElegida] = useState<string>(FRANJAS[0]);
  const [desde, setDesde] = useState("13:00");
  const [hasta, setHasta] = useState("15:00");
  const franja = franjaElegida === "otra" ? `${horaCorta(desde)} a ${horaCorta(hasta)} h` : franjaElegida;

  // Por defecto, mañana; si el local pide permiso con anticipación, el primer día que lo permite.
  const [fecha, setFecha] = useState<FechaISO>(() =>
    horasPermiso ? primerDiaConAnticipacion(manana, FRANJAS[0], horasPermiso, ahora) : manana,
  );

  const pendientes = controles.filter((c) => c.estado === "vencido" || c.estado === "pronto" || c.estado === "sin_datos");
  const [seleccion, setSeleccion] = useState<Set<string>>(
    () => new Set(pendientes.map((c) => c.control.id)),
  );
  const [armada, setArmada] = useState(false);
  const [verResto, setVerResto] = useState(false);

  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha >= hoy;
  const base = fechaValida ? fecha : manana;
  const limite = sumarDias(base, 30);
  const yaQueVas = controles.filter((c) => c.estado === "al_dia" && c.control.vencimiento && c.control.vencimiento <= limite);
  const resto = controles.filter((c) => !pendientes.includes(c) && !yaQueVas.includes(c));
  const elegidos = controles.filter((c) => seleccion.has(c.control.id));
  const restoElegidos = resto.filter((c) => seleccion.has(c.control.id)).length;

  const anticipacion = horasPermiso && fechaValida ? horasDeAnticipacion(fecha, franja, ahora) : Infinity;
  const faltaAnticipacion = !!horasPermiso && anticipacion < horasPermiso;
  const primeraPosible = horasPermiso ? primerDiaConAnticipacion(manana, franja, horasPermiso, ahora) : manana;

  const mensaje = elegidos.length
    ? mensajeAlEncargado({
        encargado: local.encargado.nombre,
        fecha: base,
        franja,
        controles: elegidos.map((c) => ({ tipoControlId: c.tipo.id, nombreTipo: c.tipo.nombre })),
        local: local.nombre,
        supervisor,
      })
    : "";
  const whatsapp = linkWhatsapp(local.encargado.telefono, mensaje);

  function cambiar(id: string, si: boolean) {
    setSeleccion((prev) => {
      const n = new Set(prev);
      if (si) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  function armar() {
    if (!elegidos.length || !fechaValida) return;
    // TODO(supabase): crear la visita PROGRAMADA con sus vencimientos planificados (quedan "programados").
    setArmada(true);
    window.scrollTo({ top: 0 });
  }

  const vistaPrevia = (
    <section className="mb-7">
      <TituloSeccion>Aviso al encargado</TituloSeccion>
      {mensaje ? (
        <>
          <blockquote className="rounded-[var(--radius-planilla)] border border-junta bg-papel px-4 py-3 text-pretty">
            {mensaje.replace(franja, sinCortes(franja))}
          </blockquote>
          <p className="mt-2 px-0.5 text-sm text-cemento">
            Le llega a {local.encargado.nombre} por WhatsApp, al {sinCortes(local.encargado.telefono)}.
          </p>
        </>
      ) : (
        <p className="rounded-[var(--radius-planilla)] border border-dashed border-junta px-4 py-4 text-cemento">
          Elegí al menos un control y armamos el mensaje para {local.encargado.nombre.split(" ")[0]}.
        </p>
      )}
    </section>
  );

  // ——— Visita armada ———
  if (armada) {
    return (
      <>
        <Encabezado
          titulo={`Visita armada para el ${fechaLarga(fecha)}`}
          bajada={`${local.nombre}, de ${sinCortes(franja)}`}
          volver={{ href: "/s", texto: "Hoy" }}
        >
          <p className="mt-3 flex items-center gap-2 font-medium" role="status">
            <IconoCheck tamano={20} className="text-verde" />
            {elegidos.length === 1 ? "El control queda programado." : `Los ${elegidos.length} controles quedan programados.`}
          </p>
        </Encabezado>

        {requisito && horasPermiso && (
          <div className="mb-6 flex gap-3 rounded-[var(--radius-planilla)] border border-tinta/60 bg-papel px-4 py-3">
            <IconoLlave tamano={22} className="mt-px shrink-0" />
            <p className="font-medium">
              {requisito.pedido} antes del {limiteParaPedir(fecha, franja, horasPermiso)}.
            </p>
          </div>
        )}

        <Planilla titulo="Qué vas a hacer">
          {elegidos.map((c) => (
            <FilaElegible key={c.control.id} cv={c} elegido />
          ))}
        </Planilla>

        {vistaPrevia}

        <div className="h-14 lg:hidden" aria-hidden />
        <BarraAccion>
          <div className="flex flex-1 flex-col gap-2 lg:flex-row">
            <BotonLink href={whatsapp} target="_blank" rel="noopener noreferrer" className="lg:px-6">
              <IconoWhatsapp tamano={20} />
              Avisar por WhatsApp
            </BotonLink>
            <BotonLink href="/s" variante="secundario" className="lg:px-6">
              Volver a Hoy
            </BotonLink>
          </div>
        </BarraAccion>
      </>
    );
  }

  // ——— Formulario ———
  return (
    <>
      <Encabezado titulo="Armar visita" bajada={local.nombre} volver={{ href: "/s", texto: "Hoy" }} />

      {requisito && (
        <div className="mb-6 flex gap-3 rounded-[var(--radius-planilla)] border border-tinta/60 bg-papel px-4 py-3">
          <IconoLlave tamano={22} className="mt-px shrink-0" />
          <div>
            <p className="font-semibold">{requisito.aviso}.</p>
            <p className="mt-0.5 text-sm text-cemento">{requisito.detalle}</p>
          </div>
        </div>
      )}

      {pendientes.length > 0 ? (
        <Planilla titulo="Pendientes" aparte={`${pendientes.filter((c) => seleccion.has(c.control.id)).length} de ${pendientes.length} elegidos`}>
          {pendientes.map((c) => (
            <FilaElegible
              key={c.control.id}
              cv={c}
              elegido={seleccion.has(c.control.id)}
              alCambiar={(si) => cambiar(c.control.id, si)}
              nota={<MarcaEstado estado={c.estado} />}
            />
          ))}
        </Planilla>
      ) : (
        <p className="mb-7 rounded-[var(--radius-planilla)] border border-dashed border-junta px-4 py-4 text-cemento">
          No hay nada vencido ni por vencer en este local. Elegí abajo lo que quieras adelantar.
        </p>
      )}

      {yaQueVas.length > 0 ? (
        <Planilla titulo="Ya que vas" aparte="Vencen en los 30 días siguientes">
          {yaQueVas.map((c) => (
            <FilaElegible
              key={c.control.id}
              cv={c}
              elegido={seleccion.has(c.control.id)}
              alCambiar={(si) => cambiar(c.control.id, si)}
              conRelativo={false}
              nota={<span className="font-medium">{textoRelativo(c.control.vencimiento!)}: aprovechá el viaje</span>}
            />
          ))}
        </Planilla>
      ) : (
        <p className="mb-7 px-0.5 text-sm text-cemento">Nada más vence en los 30 días siguientes a la visita.</p>
      )}

      {resto.length > 0 && (
        <details className="group mb-7" open={verResto || restoElegidos > 0} onToggle={(e) => setVerResto(e.currentTarget.open)}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-[var(--radius-planilla)] border border-junta bg-papel px-4 font-medium [&::-webkit-details-marker]:hidden">
            <span>
              Otros controles ({resto.length})
              {restoElegidos > 0 && <span className="text-cemento">, {restoElegidos} elegido{restoElegidos > 1 ? "s" : ""}</span>}
            </span>
            <span className="text-sm text-cemento group-open:hidden">Ver</span>
            <span className="hidden text-sm text-cemento group-open:inline">Ocultar</span>
          </summary>
          <ul className="mt-2 divide-y divide-junta overflow-hidden rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel">
            {resto.map((c) => (
              <FilaElegible
                key={c.control.id}
                cv={c}
                elegido={seleccion.has(c.control.id)}
                alCambiar={(si) => cambiar(c.control.id, si)}
                nota={<MarcaEstado estado={c.estado} />}
              />
            ))}
          </ul>
        </details>
      )}

      <section className="mb-7">
        <TituloSeccion>Cuándo</TituloSeccion>
        <div className="rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel p-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-cemento">Fecha</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <input
                type="date"
                value={fecha}
                min={hoy}
                onChange={(e) => setFecha(e.target.value)}
                className={cx(CAMPO, "cifra w-full text-xl sm:w-64")}
              />
              {fechaValida && <span className="font-medium">{capital(fechaLarga(fecha))}</span>}
            </div>
          </label>
          {!fechaValida && (
            <p className="mt-2 text-sm text-rojo" role="alert">
              Elegí una fecha de hoy en adelante.
            </p>
          )}

          {faltaAnticipacion && (
            <div className="mt-3 flex gap-3 rounded-[var(--radius-boton)] border border-rojo/50 bg-rojo/5 p-3 text-sm" role="alert">
              <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={20} />
              <div>
                <p>
                  Con esta fecha no llegás a pedir el permiso con {horasPermiso} h de anticipación. La primera fecha posible es el{" "}
                  {fechaLarga(primeraPosible)}.
                </p>
                <Boton variante="secundario" className="mt-2" onClick={() => setFecha(primeraPosible)}>
                  Pasar al {fechaLarga(primeraPosible).replace(/ de \S+$/, "")}
                </Boton>
              </div>
            </div>
          )}

          <fieldset className="mt-5">
            <legend className="mb-1.5 text-sm text-cemento">Franja</legend>
            <div className="flex flex-wrap gap-2">
              {FRANJAS.map((f) => (
                <Chip key={f} type="button" activo={franjaElegida === f} onClick={() => setFranjaElegida(f)} className="min-h-12! px-4">
                  {f}
                </Chip>
              ))}
              <Chip type="button" activo={franjaElegida === "otra"} onClick={() => setFranjaElegida("otra")} className="min-h-12! px-4">
                Otra
              </Chip>
            </div>
            {franjaElegida === "otra" && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label>
                  <span className="mb-1 block text-sm text-cemento">Desde</span>
                  <input type="time" value={desde} step={1800} onChange={(e) => setDesde(e.target.value || "08:00")} className={cx(CAMPO, "cifra w-32 text-xl")} />
                </label>
                <label>
                  <span className="mb-1 block text-sm text-cemento">Hasta</span>
                  <input type="time" value={hasta} step={1800} onChange={(e) => setHasta(e.target.value || "10:00")} className={cx(CAMPO, "cifra w-32 text-xl")} />
                </label>
              </div>
            )}
          </fieldset>
        </div>
      </section>

      {vistaPrevia}
      {mensaje && (
        <div className="-mt-4 mb-7">
          <BotonLink href={whatsapp} target="_blank" rel="noopener noreferrer" variante="secundario">
            <IconoWhatsapp tamano={20} />
            Avisar por WhatsApp
          </BotonLink>
        </div>
      )}

      <div className="h-6 lg:hidden" aria-hidden />
      <BarraAccion>
        <div className="min-w-0 flex-1">
          <Boton ancho className="lg:w-auto lg:px-10" onClick={armar} disabled={!elegidos.length || !fechaValida}>
            Armar visita ({elegidos.length} {elegidos.length === 1 ? "control" : "controles"})
          </Boton>
          {!elegidos.length && <p className="mt-1.5 text-sm text-cemento">Elegí al menos un control.</p>}
        </div>
      </BarraAccion>
    </>
  );
}

