"use client";

// Pantalla del informe: revisión del borrador (con vista previa del cliente) y, ya publicado, el documento
// con sus subsanaciones. Un informe publicado no se edita (D4): si hay un error, se subsana.
// No hay base todavía: todo cambia en el estado local.

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Hoja } from "@/components/hoja";
import { IconoCheck, IconoDocumento } from "@/components/iconos";
import { BarraAccion, Boton, Cifra, cx, Encabezado, FechaFila, Fila, Planilla, Vacio } from "@/components/ui";
import { fechaConDia, fechaNumerica, hoy, textoRelativo } from "@/lib/fechas";
import type { Subsanacion } from "@/lib/tipos";
import { ETAPAS, type DatosInforme, type Etapa, type Foto } from "./consultas";
import { DocumentoInforme } from "./documento";
import { Aviso, FotoPlaceholder, Interruptor, SinCortes, type AvisoTexto } from "./piezas";
import { HojaSubsanar, type NuevaSubsanacion } from "./subsanar";

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function PantallaInforme({
  datos,
  autor,
  avisoInicial = null,
}: {
  datos: DatosInforme;
  autor: string;
  /** Aviso con el que se llega a la pantalla (por ejemplo, al cerrar la visita). */
  avisoInicial?: AvisoTexto | null;
}) {
  const [estado, setEstado] = useState(datos.estado);
  const [vista, setVista] = useState<"revision" | "cliente">("revision");
  const [resumen, setResumen] = useState(datos.resumen);
  const [recomendaciones, setRecomendaciones] = useState(datos.recomendaciones);
  const [fotos, setFotos] = useState(datos.fotos);
  const [subsanaciones, setSubsanaciones] = useState<Subsanacion[]>(datos.subsanaciones);
  const [fechaPublicado, setFechaPublicado] = useState(datos.fecha);

  const [hojaPublicar, setHojaPublicar] = useState(false);
  const [hojaSubsanar, setHojaSubsanar] = useState(false);
  const [vecesSubsanar, setVecesSubsanar] = useState(0);
  const [nueva, setNueva] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoTexto | null>(avisoInicial);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  const actual: DatosInforme = { ...datos, resumen, recomendaciones, fotos, subsanaciones };

  // Al agregar una subsanación, llevar la vista y el foco hasta ella
  useEffect(() => {
    if (!nueva) return;
    const el = document.getElementById(`subsanacion-${nueva}`);
    if (!el) return;
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
    el.focus({ preventScroll: true });
  }, [nueva]);

  function publicar() {
    // TODO(supabase): rpc("publicar_informe", { id }) numera, congela, genera el PDF con su hash y avisa al cliente.
    setEstado("publicado");
    setFechaPublicado(hoy());
    setHojaPublicar(false);
    setAviso({ texto: `Informe publicado. Le avisamos a ${datos.encargado} por email.` });
    window.scrollTo({ top: 0 });
  }

  function agregarSubsanacion(s: NuevaSubsanacion) {
    // TODO(supabase): rpc("subsanar_informe", { id, motivo, texto }) y el PDF se regenera con la subsanación al pie.
    const id = `sub-${Date.now()}`;
    setSubsanaciones((prev) => [...prev, { id, fecha: hoy(), motivo: s.motivo, texto: s.texto, autor }]);
    setHojaSubsanar(false);
    setNueva(id);
    setAviso({ texto: "Subsanación agregada. El cliente la ve debajo del informe." });
  }

  // ——— Publicado: documento + subsanar ———
  if (estado === "publicado") {
    const acciones = (
      <>
        <Boton
          variante="secundario"
          className="flex-1 lg:flex-none"
          onClick={() => {
            // TODO(supabase): descargar el PDF publicado con una URL firmada de corta duración.
            setAviso({ texto: "La descarga del PDF todavía no está disponible.", tono: "info" });
          }}
        >
          Descargar PDF
        </Boton>
        <Boton
          className="flex-1 lg:flex-none"
          onClick={() => {
            setVecesSubsanar((n) => n + 1);
            setHojaSubsanar(true);
          }}
        >
          Subsanar
        </Boton>
      </>
    );

    return (
      <>
        <Encabezado
          volver={{ href: `/s/locales/${datos.local.id}`, texto: datos.local.nombre }}
          titulo="Informe de visita"
          bajada={`${datos.local.nombre}, ${datos.local.direccion}`}
          acciones={<div className="hidden gap-2 lg:flex">{acciones}</div>}
        >
          <p className="mt-3 flex items-start gap-2 text-sm">
            <IconoCheck tamano={18} className="mt-px shrink-0 text-verde" />
            <span>
              Publicado el <Cifra className="text-base">{fechaNumerica(fechaPublicado)}</Cifra>. El cliente lo ve así y
              no se edita: si hay un error, se subsana.
            </span>
          </p>
        </Encabezado>

        <DocumentoInforme d={actual} publicado />

        <div className="lg:hidden">
          <BarraAccion>{acciones}</BarraAccion>
        </div>

        <HojaSubsanar
          key={vecesSubsanar}
          abierta={hojaSubsanar}
          alCerrar={() => setHojaSubsanar(false)}
          alGuardar={agregarSubsanacion}
          numero={datos.numero}
        />
        <Aviso aviso={aviso} alCerrar={cerrarAviso} />
      </>
    );
  }

  // ——— Borrador: revisión antes de publicar ———
  const visibles = fotos.filter((f) => f.visibleCliente).length;
  const ocultas = fotos.length - visibles;
  const faltaResumen = !resumen.trim();

  return (
    <>
      <Encabezado
        volver={{ href: `/s/visitas/${datos.visitaId}`, texto: "Visita" }}
        titulo="Informe de visita"
        bajada={
          <>
            {datos.local.nombre}, {datos.local.direccion}.{" "}
            <span className="whitespace-nowrap">
              {datos.tipoVisita} del <Cifra className="text-lg text-tinta">{fechaConDia(datos.fecha)}</Cifra>
            </span>
          </>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-[var(--radius-chip)] border border-dashed border-tinta/60 bg-papel px-2 py-0.5 text-sm font-semibold">
            Borrador
          </span>
          <span className="text-sm text-cemento">No está publicado. El cliente todavía no lo ve.</span>
        </div>
        <Boton
          variante="secundario"
          className="mt-4 w-full sm:w-auto"
          aria-pressed={vista === "cliente"}
          onClick={() => setVista(vista === "cliente" ? "revision" : "cliente")}
        >
          {vista === "cliente" ? (
            "Volver a la revisión"
          ) : (
            <>
              <IconoDocumento tamano={20} />
              Ver como lo ve el cliente
            </>
          )}
        </Boton>
      </Encabezado>

      {vista === "cliente" ? (
        <>
          <p className="mb-3 px-0.5 text-sm text-cemento">
            Así lo va a ver {datos.encargado} cuando publiques.
            {ocultas > 0 && ` ${ocultas === 1 ? "La foto oculta no aparece" : `Las ${ocultas} fotos ocultas no aparecen`}.`}
          </p>
          <DocumentoInforme d={actual} publicado={false} />
        </>
      ) : (
        <Revision
          datos={datos}
          resumen={resumen}
          setResumen={setResumen}
          recomendaciones={recomendaciones}
          setRecomendaciones={setRecomendaciones}
          fotos={fotos}
          setFotos={setFotos}
        />
      )}

      <BarraAccion>
        <Boton ancho className="lg:w-auto lg:px-6" onClick={() => setHojaPublicar(true)}>
          Publicar informe
        </Boton>
      </BarraAccion>

      <Hoja
        abierta={hojaPublicar}
        alCerrar={() => setHojaPublicar(false)}
        titulo="Publicar informe"
        pie={
          <div className="grid gap-2">
            <Boton ancho onClick={publicar} disabled={faltaResumen}>
              Publicar informe
            </Boton>
            {faltaResumen && (
              <p className="text-sm text-cemento" aria-live="polite">
                Falta escribir el resumen.
              </p>
            )}
            <Boton variante="fantasma" ancho onClick={() => setHojaPublicar(false)}>
              Seguir revisando
            </Boton>
          </div>
        }
      >
        <p>
          Una vez publicado, el cliente lo ve y no se puede editar. Si después encontrás un error, lo vas a poder
          subsanar.
        </p>
        <ul className="mt-4 divide-y divide-junta rounded-[var(--radius-planilla)] border border-junta text-sm">
          <li className="px-3 py-2.5">
            Le avisamos por email a <span className="font-semibold">{datos.encargado}</span>.
          </li>
          <li className="px-3 py-2.5">
            {visibles === 1 ? "Va 1 foto" : `Van ${visibles} fotos`}
            {ocultas > 0 && `. ${ocultas === 1 ? "1 queda oculta" : `${ocultas} quedan ocultas`}`}.
          </li>
          <li className="px-3 py-2.5">
            {datos.firma ? `Firmado por ${datos.firma.nombre}.` : "Sin firma del encargado: el informe lo va a decir."}
          </li>
        </ul>
      </Hoja>

      <Aviso aviso={aviso} alCerrar={cerrarAviso} />
    </>
  );
}

// ——— Revisión del borrador ———

function Revision({
  datos,
  resumen,
  setResumen,
  recomendaciones,
  setRecomendaciones,
  fotos,
  setFotos,
}: {
  datos: DatosInforme;
  resumen: string;
  setResumen: (s: string) => void;
  recomendaciones: string[];
  setRecomendaciones: (r: string[]) => void;
  fotos: Foto[];
  setFotos: (f: Foto[]) => void;
}) {
  const [nuevaRec, setNuevaRec] = useState("");
  const visibles = fotos.filter((f) => f.visibleCliente).length;

  function agregarRec(e: FormEvent) {
    e.preventDefault();
    if (!nuevaRec.trim()) return;
    setRecomendaciones([...recomendaciones, nuevaRec.trim()]);
    setNuevaRec("");
  }

  const cambiarFoto = (id: string, cambios: Partial<Foto>) =>
    setFotos(fotos.map((f) => (f.id === id ? { ...f, ...cambios } : f)));

  return (
    <>
      <section className="mb-7">
        <label htmlFor="resumen" className="mb-2 block px-0.5 text-lg font-[650] leading-tight">
          Resumen
        </label>
        <textarea
          id="resumen"
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
          rows={7}
          aria-describedby="ayuda-resumen"
          className="w-full rounded-[var(--radius-planilla)] border border-junta bg-papel px-4 py-3 leading-[1.45]"
        />
        <p id="ayuda-resumen" className="mt-1.5 px-0.5 text-sm text-cemento">
          Lo armamos con lo que cargaste en la visita. Corregilo o completalo antes de publicar.
        </p>
      </section>

      {datos.hechos.length > 0 && (
        <Planilla
          titulo="Controles realizados"
          aparte={datos.hechos.length === 1 ? "1 control" : `${datos.hechos.length} controles`}
        >
          {datos.hechos.map((h) => (
            <Fila
              key={h.id}
              estado="al_dia"
              titulo={h.que}
              detalle={h.donde ? `${h.sobre}, ${minuscula(h.donde)}` : h.sobre}
              derecha={<FechaFila fecha={fechaNumerica(h.vencimientoNuevo)} relativo="Nuevo vencimiento" />}
            />
          ))}
        </Planilla>
      )}

      {datos.pendientes.length > 0 && (
        <Planilla titulo="Quedó pendiente">
          {datos.pendientes.map((p) => (
            <Fila
              key={p.id}
              estado={p.estado}
              titulo={p.que}
              detalle={p.donde ? `${p.sobre}, ${minuscula(p.donde)}` : p.sobre}
              debajo={
                <p className="text-sm">
                  <SinCortes texto={p.motivo} />
                </p>
              }
              derecha={
                p.vencimiento ? (
                  <FechaFila
                    fecha={fechaNumerica(p.vencimiento)}
                    relativo={textoRelativo(p.vencimiento)}
                    tono={p.estado === "vencido" ? "rojo" : "normal"}
                  />
                ) : (
                  <span className="text-sm text-cemento">Sin fecha</span>
                )
              }
            />
          ))}
        </Planilla>
      )}

      {datos.trabajos.length > 0 ? (
        <Planilla titulo="Trabajos extra">
          {datos.trabajos.map((t, i) => (
            <li key={i} className="flex min-h-12 items-start gap-3 px-4 py-3">
              <span aria-hidden className="mt-[9px] size-1.5 shrink-0 bg-tinta" />
              {t}
            </li>
          ))}
        </Planilla>
      ) : (
        <section className="mb-7">
          <h2 className="mb-2 px-0.5 text-lg font-[650]">Trabajos extra</h2>
          <Vacio>No cargaste trabajos fuera de los controles. Si hiciste algo más, sumalo desde la visita.</Vacio>
        </section>
      )}

      <Planilla titulo="Recomendaciones" aparte={<span className="hidden sm:inline">El cliente las ve en el informe</span>}>
        {recomendaciones.map((r, i) => (
          <li key={`${i}-${r}`} className="flex items-start gap-3 py-1.5 pl-4 pr-1.5">
            <Cifra className="mt-[11px] w-4 shrink-0 text-lg leading-none text-cemento">{i + 1}</Cifra>
            <p className="min-w-0 flex-1 py-2.5">{r}</p>
            <Boton
              variante="fantasma"
              className="shrink-0 px-3 text-sm text-cemento hover:text-tinta"
              aria-label={`Quitar recomendación ${i + 1}`}
              onClick={() => setRecomendaciones(recomendaciones.filter((_, j) => j !== i))}
            >
              Quitar
            </Boton>
          </li>
        ))}
        <li className="p-3">
          <form onSubmit={agregarRec} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <label htmlFor="nueva-recomendacion" className="sr-only">
              Nueva recomendación
            </label>
            <textarea
              id="nueva-recomendacion"
              value={nuevaRec}
              onChange={(e) => setNuevaRec(e.target.value)}
              rows={2}
              placeholder={
                recomendaciones.length
                  ? "Otra recomendación. Ej.: Conviene cambiar el burlete de la cámara de frío."
                  : "Si viste algo para arreglar, anotalo acá. Ej.: Conviene cambiar el burlete de la cámara de frío."
              }
              className="min-h-12 w-full flex-1 rounded-[var(--radius-boton)] border border-junta bg-papel px-3 py-2.5 leading-snug"
            />
            <Boton type="submit" variante="secundario" disabled={!nuevaRec.trim()} className="shrink-0">
              Agregar recomendación
            </Boton>
          </form>
        </li>
      </Planilla>

      <Planilla
        titulo="Fotos"
        aparte={`${visibles} de ${fotos.length} ${fotos.length === 1 ? "visible" : "visibles"} para el cliente`}
      >
        {fotos.map((f, i) => (
          <FilaFoto key={f.id} foto={f} numero={i + 1} alCambiar={(cambios) => cambiarFoto(f.id, cambios)} />
        ))}
      </Planilla>

      <Planilla titulo="Firma del encargado">
        <li className="flex items-start gap-3 px-4 py-3.5">
          {datos.firma ? (
            <>
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-verde text-papel">
                <IconoCheck tamano={16} />
              </span>
              <div>
                <div className="font-semibold">
                  Firmó {datos.firma.nombre}, DNI <Cifra className="text-lg">{datos.firma.dni}</Cifra>
                </div>
                <div className="text-sm text-cemento">Firmó en tu celular al cerrar la visita.</div>
              </div>
            </>
          ) : (
            <>
              <span aria-hidden className="rayado mt-0.5 size-6 shrink-0 rounded-full" />
              <div>
                <div className="font-semibold">Falta la firma</div>
                <div className="text-sm text-cemento">
                  Pedísela a {datos.encargado} antes de irte. Si publicás sin firma, el informe lo dice.
                </div>
              </div>
            </>
          )}
        </li>
      </Planilla>
    </>
  );
}

function FilaFoto({
  foto,
  numero,
  alCambiar,
}: {
  foto: Foto;
  numero: number;
  alCambiar: (cambios: Partial<Foto>) => void;
}) {
  return (
    <li className="grid grid-cols-[96px_minmax(0,1fr)] gap-x-3 gap-y-3 p-3 sm:grid-cols-[168px_minmax(0,1fr)] sm:gap-x-5 sm:p-4">
      <FotoPlaceholder numero={numero} oculta={!foto.visibleCliente} className="self-start sm:row-span-2" />
      <label className="block">
        <span className="mb-1 block text-sm text-cemento">Epígrafe de la foto {numero}</span>
        <textarea
          value={foto.epigrafe}
          onChange={(e) => alCambiar({ epigrafe: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-[var(--radius-boton)] border border-junta bg-papel px-3 py-2 leading-snug"
        />
      </label>
      <div className="col-span-2 flex flex-col gap-3 sm:col-span-1 sm:col-start-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6 sm:gap-y-2">
        <fieldset>
          <legend className="sr-only">Etapa de la foto {numero}</legend>
          <div className="inline-flex rounded-[var(--radius-boton)] border border-junta bg-papel p-0.5">
            {ETAPAS.map((e) => {
              const elegida = foto.etapa === e.valor;
              return (
                <label
                  key={e.valor}
                  className={cx(
                    "flex min-h-11 cursor-pointer items-center rounded-[6px] px-3 text-sm font-medium transition-colors",
                    "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-tinta",
                    elegida ? "bg-tinta text-papel" : "text-tinta hover:bg-yeso",
                  )}
                >
                  <input
                    type="radio"
                    name={`etapa-${foto.id}`}
                    className="sr-only"
                    checked={elegida}
                    onChange={() => alCambiar({ etapa: e.valor as Etapa })}
                  />
                  {e.texto}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="sm:min-w-0 sm:max-w-[320px] sm:flex-1">
          <Interruptor
            activo={foto.visibleCliente}
            alCambiar={(v) => alCambiar({ visibleCliente: v })}
            texto="Visible para el cliente"
            ayuda={foto.visibleCliente ? "Aparece en el informe." : "Oculta. Para fotos con personas o con la caja."}
          />
        </div>
      </div>
    </li>
  );
}
