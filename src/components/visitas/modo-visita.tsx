"use client";

// Modo visita: la pantalla que el supervisor usa parado en el local, con el celular en la mano.
// Todo se guarda en el estado de la pantalla; lo que va a la base está marcado con TODO(supabase).

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { IconoCerrar, IconoCheck, IconoDocumento, IconoReloj, IconoSumar } from "@/components/iconos";
import { RegistrarEjecucion, type Registro } from "@/components/registrar-ejecucion";
import { BarraAccion, Boton, BotonLink, CLASE_PLANILLA, cx, Encabezado, Planilla } from "@/components/ui";
import { fechaLarga, fechaMedia } from "@/lib/fechas";
import type { FechaISO, Visita } from "@/lib/tipos";
import type { ControlVisita } from "./consultas";
import { Contador } from "./contador";
import { FilaControl } from "./fila-control";
import { HojaFallida, nombreMotivo, type Fallida } from "./hoja-fallida";
import { HojaTrabajo, nombreRubro, type Trabajo } from "./hoja-trabajo";
import { PadFirma } from "./pad-firma";
import { Progreso } from "./progreso";
import { desdeLaHora, enumerar, horaActual } from "./textos";

const TIPO_VISITA: Record<Visita["tipo"], string> = {
  preventiva: "Visita preventiva",
  correctiva: "Visita correctiva",
  relevamiento: "Relevamiento",
  obra: "Visita de obra",
};

type Punto = { x: number; y: number };

const CAMPO = "min-h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel px-3";

function Aviso({ children, tono = "neutro" }: { children: ReactNode; tono?: "neutro" | "confirmacion" }) {
  return (
    <div
      role="status"
      className={cx(
        "mb-6 flex gap-3 rounded-[var(--radius-planilla)] border-2 px-4 py-3 font-medium",
        tono === "confirmacion" ? "border-verde bg-papel" : "border-tinta bg-papel",
      )}
    >
      <IconoCheck className={cx("mt-px shrink-0", tono === "confirmacion" ? "text-verde" : "text-cemento")} tamano={22} />
      <div>{children}</div>
    </div>
  );
}

function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="rotulo mb-2 text-xl">{children}</h2>;
}

export function ModoVisita({
  visita,
  local,
  encargado,
  controles,
  checkIn: checkInInicial,
  informeHref,
  armarHref,
}: {
  visita: { id: string; tipo: Visita["tipo"]; fecha: FechaISO; franja: string; estado: Visita["estado"]; nota?: string };
  local: { id: string; nombre: string };
  encargado: string;
  controles: ControlVisita[];
  checkIn?: string;
  informeHref: string;
  armarHref: string;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState(visita.estado);
  const [checkIn, setCheckIn] = useState(checkInInicial);
  const [registros, setRegistros] = useState<Record<string, Registro>>({});
  const [elegidoId, setElegidoId] = useState<string | null>(null);
  const [hojaRegistrar, setHojaRegistrar] = useState(false);
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [hojaTrabajo, setHojaTrabajo] = useState(false);
  const [personas, setPersonas] = useState(1);
  const [horas, setHoras] = useState(0);
  const [trazos, setTrazos] = useState<Punto[][]>([]);
  const [firmante, setFirmante] = useState(encargado);
  const [dni, setDni] = useState("");
  const [hojaFallida, setHojaFallida] = useState(false);
  const [fallida, setFallida] = useState<(Fallida & { hora: string }) | null>(null);
  const [anuncio, setAnuncio] = useState("");

  const enCurso = estado === "en_curso";
  const abierta = estado === "programada" || estado === "en_curso";
  const elegido = controles.find((c) => c.control.id === elegidoId);
  const pendientes = controles.filter((c) => !registros[c.control.id]);

  /** La recarga queda bloqueada mientras la prueba hidráulica siga vencida; si se registra en esta visita, se libera. */
  const bloqueoActivo = (cv: ControlVisita) =>
    cv.bloqueo && !(cv.levantaBloqueo && registros[cv.levantaBloqueo]?.vencimientoNuevo) ? cv.bloqueo : undefined;

  function empezar() {
    // TODO(supabase): guardar visita.check_in con la hora del servidor y pasar la visita a EN_CURSO.
    setCheckIn(horaActual());
    setEstado("en_curso");
  }

  function abrirRegistro(id: string) {
    setElegidoId(id);
    setHojaRegistrar(true);
  }

  function registrar(r: Registro) {
    // TODO(supabase): registrar_ejecucion() en una transacción (§3.3), con la evidencia subida a Storage.
    setRegistros((prev) => ({ ...prev, [r.controlId]: r }));
    setHojaRegistrar(false);
    const cv = controles.find((c) => c.control.id === r.controlId);
    setAnuncio(
      r.vencimientoNuevo
        ? `${cv?.tipo.hecho ?? "Registrado"}. Nuevo vencimiento: ${fechaMedia(r.vencimientoNuevo)}.`
        : "Quedó registrado que no se pudo hacer.",
    );
  }

  function deshacer(id: string) {
    // TODO(supabase): anular la ejecución, que reabre el vencimiento anterior. Queda auditado.
    setRegistros((prev) => {
      const n = { ...prev };
      delete n[id];
      // Una recarga registrada gracias a esta prueba hidráulica deja de tener respaldo: se deshace también.
      for (const cv of controles) {
        const r = n[cv.control.id];
        if (cv.levantaBloqueo === id && r && (r.resultado === "ok" || r.resultado === "observado")) delete n[cv.control.id];
      }
      return n;
    });
    const cv = controles.find((c) => c.control.id === id);
    setAnuncio(`Registro deshecho: ${cv?.tipo.nombre.toLowerCase() ?? "control"}.`);
  }

  function marcarFallida(f: Fallida) {
    // TODO(supabase): guardar motivo, foto y hora; pasar la visita a FALLIDA y encolar el aviso al cliente.
    setFallida({ ...f, hora: horaActual() });
    setRegistros({});
    setEstado("fallida");
    setHojaFallida(false);
    window.scrollTo({ top: 0 });
  }

  function cerrar() {
    if (pendientes.length) return;
    // TODO(supabase): check-out, horas, trabajos y firma (imagen a Storage); armar el borrador del informe.
    setEstado("cerrada");
    router.push(`${informeHref}?aviso=visita-cerrada`);
  }

  // Qué falta para cerrar. En el celular, con más de 2 pendientes alcanza con la cuenta: la lista está arriba.
  const nombresPendientes = enumerar([...new Set(pendientes.map((c) => c.tipo.nombre.toLowerCase()))]);
  const faltaLargo = `Falta registrar: ${nombresPendientes}.`;
  const faltaCorto = pendientes.length > 2 ? `Faltan ${pendientes.length} controles por registrar.` : faltaLargo;

  return (
    <>
      <Encabezado
        titulo={local.nombre}
        // Espacios duros en la franja: "9 a 11 h" no se corta en dos renglones.
        bajada={`${TIPO_VISITA[visita.tipo]} del ${fechaLarga(visita.fecha)}, de ${visita.franja.replace(/ /g, "\u00a0")}`}
        volver={{ href: "/s", texto: "Hoy" }}
      >
        {estado === "programada" && (
          <div className="mt-4">
            <Boton onClick={empezar} className="w-full lg:w-auto lg:px-8">
              Empezar visita
            </Boton>
            <p className="mt-2 text-sm text-cemento">Queda guardada la hora de llegada.</p>
          </div>
        )}
        {/* El estado de la visita, como el rótulo que se cuelga en la puerta del tablero. */}
        {estado === "en_curso" && (
          <p className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[2px] bg-tinta px-3 font-semibold text-papel">
            <IconoReloj tamano={20} />
            {checkIn ? `En curso ${desdeLaHora(checkIn)}` : "En curso"}
          </p>
        )}
        {estado === "fallida" && (
          <p className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[2px] border-2 border-tinta px-3 font-semibold">
            <IconoCerrar tamano={20} />
            {fallida ? `Fallida a las ${fallida.hora}: ${nombreMotivo(fallida.motivo).toLowerCase()}` : "Visita fallida"}
          </p>
        )}
        {estado === "cerrada" && (
          <p className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[2px] bg-verde px-3 font-semibold text-papel">
            <IconoCheck tamano={20} />
            Visita cerrada
          </p>
        )}
      </Encabezado>

      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>

      {fallida && (
        <Aviso>
          Visita marcada como fallida. Le avisamos al cliente.
          <span className="mt-0.5 block text-sm font-normal text-cemento">
            Foto: {fallida.foto}
            {fallida.nota ? `. ${fallida.nota}` : ""}
          </span>
        </Aviso>
      )}
      {estado === "cerrada" && visita.estado !== "cerrada" && (
        <Aviso tono="confirmacion">Visita cerrada. Revisá el informe antes de publicarlo.</Aviso>
      )}

      {visita.nota && (
        <div className="mb-6 flex gap-3 rounded-[var(--radius-planilla)] border border-junta border-l-[6px] border-l-tinta bg-papel px-4 py-3">
          <IconoDocumento tamano={20} className="mt-0.5 shrink-0 text-cemento" />
          <p>{visita.nota}</p>
        </div>
      )}

      <Planilla titulo={estado === "fallida" ? "Siguen pendientes" : "Controles"}>
        {abierta && <Progreso hechos={controles.map((c) => !!registros[c.control.id])} />}
        {controles.map((cv) => (
          <FilaControl
            key={cv.control.id}
            cv={cv}
            registro={registros[cv.control.id]}
            bloqueado={abierta && !!bloqueoActivo(cv)}
            puedeRegistrar={enCurso}
            alRegistrar={() => abrirRegistro(cv.control.id)}
            alDeshacer={() => deshacer(cv.control.id)}
          />
        ))}
      </Planilla>

      {enCurso && (
        <>
          <section className="mb-7">
            <TituloSeccion>Otros trabajos</TituloSeccion>
            {trabajos.length > 0 ? (
              <>
                <ul className={CLASE_PLANILLA}>
                  {trabajos.map((t) => (
                    <li key={t.id} className="flex items-start gap-3 py-3 pl-4 pr-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug">{t.descripcion}</p>
                        <p className="mt-0.5 text-sm text-cemento">
                          {nombreRubro(t.rubro)}
                          {t.materiales ? `. Materiales: ${t.materiales}` : ""}
                        </p>
                        {t.fueraDeAbono && (
                          <span className="mt-1.5 inline-flex rounded-[var(--radius-chip)] border border-tinta/30 px-2 py-0.5 text-sm font-medium">
                            Fuera del abono
                          </span>
                        )}
                      </div>
                      <Boton
                        variante="fantasma"
                        onClick={() => setTrabajos(trabajos.filter((x) => x.id !== t.id))}
                        aria-label={`Quitar el trabajo: ${t.descripcion}`}
                      >
                        Quitar
                      </Boton>
                    </li>
                  ))}
                </ul>
                <Boton variante="secundario" className="mt-3" onClick={() => setHojaTrabajo(true)}>
                  <IconoSumar tamano={20} />
                  Agregar trabajo
                </Boton>
              </>
            ) : (
              <div className="rounded-[var(--radius-planilla)] border border-dashed border-junta px-4 py-4">
                <p className="text-cemento">¿Hiciste algo que no es un control? Cambiar tubos, destapar una pileta: anotalo y sale en el informe.</p>
                <Boton variante="secundario" className="mt-3" onClick={() => setHojaTrabajo(true)}>
                  <IconoSumar tamano={20} />
                  Agregar trabajo
                </Boton>
              </div>
            )}
          </section>

          <section className="mb-7">
            <TituloSeccion>Horas y materiales</TituloSeccion>
            <ul className={cx(CLASE_PLANILLA, "lg:max-w-md")}>
              <li className="py-2.5 pl-4 pr-2.5">
                <Contador etiqueta="Personas" valor={personas} alCambiar={setPersonas} min={1} max={20} />
              </li>
              <li className="py-2.5 pl-4 pr-2.5">
                <Contador etiqueta="Horas" valor={horas} alCambiar={setHoras} paso={0.5} max={24} vacio="Sin cargar" />
              </li>
            </ul>
            <p className="mt-2 px-0.5 text-sm text-cemento">Opcional. Los materiales van en cada trabajo.</p>
          </section>

          <section className="mb-7">
            <TituloSeccion>Firma del encargado</TituloSeccion>
            <div className="rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel p-4">
              {/* TODO(supabase): guardar la firma como imagen en Storage junto con nombre y DNI. */}
              <PadFirma trazos={trazos} alCambiar={setTrazos} etiqueta="Firma del encargado" />
              <div className="mt-1 flex justify-end">
                <Boton variante="fantasma" onClick={() => setTrazos([])} disabled={trazos.length === 0}>
                  Borrar
                </Boton>
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_12rem]">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-cemento">Nombre y apellido</span>
                  <input value={firmante} onChange={(e) => setFirmante(e.target.value)} autoComplete="off" className={CAMPO} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-cemento">DNI</span>
                  <input
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    className={cx(CAMPO, "cifra text-xl")}
                  />
                </label>
              </div>
            </div>
            <p className="mt-2 px-0.5 text-sm text-cemento">Si el encargado no está, podés cerrar igual: el informe sale sin firma.</p>
          </section>
        </>
      )}


      {enCurso && (
        <>
          <BarraAccion>
            <div className="min-w-0 flex-1">
              <Boton ancho className="lg:w-auto lg:px-10" onClick={cerrar} disabled={pendientes.length > 0}>
                Cerrar visita
              </Boton>
              <p className="mt-1.5 text-sm text-cemento" aria-live="polite">
                {pendientes.length > 0 ? (
                  <>
                    <span className="lg:hidden">{faltaCorto}</span>
                    <span className="hidden lg:inline">{faltaLargo}</span>
                  </>
                ) : (
                  "Todo registrado. Al cerrar se arma el borrador del informe."
                )}
              </p>
            </div>
          </BarraAccion>
        </>
      )}
      {estado === "fallida" && (
        <BarraAccion>
          <BotonLink href={armarHref} className="flex-1 lg:flex-none lg:px-8">
            Armar otra visita
          </BotonLink>
          <BotonLink href="/s" variante="secundario" className="flex-1 lg:flex-none lg:px-8">
            Volver a Hoy
          </BotonLink>
        </BarraAccion>
      )}
      {estado === "cerrada" && (
        <BarraAccion>
          <BotonLink href={informeHref} className="flex-1 lg:flex-none lg:px-8">
            {visita.estado === "cerrada" ? "Ver informe" : "Revisar informe"}
          </BotonLink>
        </BarraAccion>
      )}

      {abierta && (
        <section className="mt-10 border-t border-junta pt-5">
          <p className="max-w-prose text-sm text-cemento">
            ¿No pudiste trabajar? Si el local estaba cerrado o no te dejaron entrar, dejalo registrado con una foto.
          </p>
          <Boton variante="peligro" className="mt-3" onClick={() => setHojaFallida(true)}>
            Marcar visita fallida
          </Boton>
        </section>
      )}
      {enCurso && <div className="h-12 lg:hidden" aria-hidden />}

      {elegido && (
        <RegistrarEjecucion
          key={elegido.control.id}
          abierta={hojaRegistrar}
          alCerrar={() => setHojaRegistrar(false)}
          alRegistrar={registrar}
          control={elegido.control}
          tipo={elegido.tipo}
          elemento={elegido.elemento}
          bloqueo={bloqueoActivo(elegido)}
        />
      )}
      <HojaTrabajo
        abierta={hojaTrabajo}
        alCerrar={() => setHojaTrabajo(false)}
        alAgregar={(t) => {
          // TODO(supabase): guardar el trabajo de la visita.
          setTrabajos((prev) => [...prev, t]);
          setHojaTrabajo(false);
          setAnuncio("Trabajo agregado.");
        }}
      />
      <HojaFallida
        abierta={hojaFallida}
        alCerrar={() => setHojaFallida(false)}
        alConfirmar={marcarFallida}
        registrados={Object.keys(registros).length}
      />
    </>
  );
}
