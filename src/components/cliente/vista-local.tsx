// El local visto por el cliente: un cartel que contesta "¿está todo al día?", la regla de cumplimiento
// y tres pestañas (controles, equipos y trabajos hechos). Todo de solo lectura.
// Sirve para el inicio (cliente con un solo local, base "/c") y para /c/locales/[id] (cadenas).

import { Pestanas } from "@/components/locales/pestanas";
import { LineaDeTiempo } from "@/components/locales/historial";
import { Regla } from "@/components/locales/regla";
import { clienteDeLocal, estadosDeLocal, fraseResumen, historialDeLocal, peorDe } from "@/components/locales/consultas";
import { IconoHerramienta } from "@/components/iconos";
import { Chapa, cx, Encabezado, ESTADO, FechaFila, Fila, MarcaEstado, Planilla, Vacio } from "@/components/ui";
import {
  controlesDeElemento,
  controlesDeLocal,
  describirControl,
  elementosDeLocal,
  estadoControl,
  ORDEN_ESTADO,
  resumenLocal,
  tipoDe,
} from "@/lib/datos";
import { fechaCorta, fechaNumerica, textoRelativo } from "@/lib/fechas";
import type { EstadoControl, Local } from "@/lib/tipos";
import { compararControles, veredictoDe, type Veredicto } from "./consultas";

export const SECCIONES_LOCAL = ["controles", "equipos", "trabajos"] as const;
export type SeccionLocal = (typeof SECCIONES_LOCAL)[number];

export function seccionDe(ver: unknown): SeccionLocal {
  return SECCIONES_LOCAL.includes(ver as SeccionLocal) ? (ver as SeccionLocal) : "controles";
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export function VistaLocal({
  local,
  base,
  seccion,
  volver,
}: {
  local: Local;
  /** Dirección de esta pantalla, para las pestañas: "/c" o "/c/locales/<id>". */
  base: string;
  seccion: SeccionLocal;
  volver?: { href: string; texto: string };
}) {
  const cliente = clienteDeLocal(local);
  const resumen = resumenLocal(local.id);
  const veredicto = veredictoDe(local.id);
  const trabajos = historialDeLocal(local.id);

  return (
    <>
      <Encabezado volver={volver} titulo={local.nombre} bajada={`${cliente.nombre}, ${local.direccion}, ${local.barrio}`} />

      <Cartel veredicto={veredicto} />

      <div className="mb-8 mt-4">
        <Regla estados={estadosDeLocal(local.id)} etiqueta={fraseResumen(resumen)} />
        <p className="mt-2 font-medium" aria-hidden>
          {fraseResumen(resumen)}
        </p>
      </div>

      <Pestanas
        base={base}
        activa={seccion}
        pestanas={[
          { clave: "controles", texto: "Controles", cantidad: resumen.total },
          { clave: "equipos", texto: "Equipos", cantidad: elementosDeLocal(local.id).length },
          { clave: "trabajos", texto: "Trabajos hechos" },
        ]}
      />

      {seccion === "controles" && <SeccionControles localId={local.id} />}
      {seccion === "equipos" && <SeccionEquipos localId={local.id} />}
      {seccion === "trabajos" &&
        (trabajos.length === 0 ? (
          <Vacio>Todavía no hay trabajos registrados. Cada vez que SCP haga un control en tu local, va a quedar anotado acá.</Vacio>
        ) : (
          <>
            <p className="mb-2 px-0.5 text-sm text-cemento">Lo que hizo SCP en tu local, del más nuevo al más viejo.</p>
            <LineaDeTiempo dias={trabajos} />
          </>
        ))}
    </>
  );
}

/**
 * El cartel: como los de seguridad, el color de fondo con su contraste encima. Es lo primero que se ve
 * y contesta la pregunta del cliente sin tener que leer la lista.
 */
function Cartel({ veredicto }: { veredicto: Veredicto }) {
  const e = ESTADO[veredicto.estado];
  const sinDatos = veredicto.estado === "sin_datos";
  return (
    <section
      aria-label="Estado del local"
      className={cx(
        "relative overflow-hidden rounded-[var(--radius-tarjeta)] px-5 pb-5 pt-6 lg:px-7 lg:pb-6 lg:pt-7",
        e.banda,
        e.textoBanda,
        sinDatos && "border-2 border-dashed border-tinta",
      )}
    >
      <p className={cx("titulo text-[34px] leading-[1.02] lg:text-[46px]", sinDatos && "inline bg-papel px-1")}>
        {veredicto.titulo}
      </p>
      <p
        className={cx(
          "mt-3 max-w-[60ch] text-[17px] font-medium leading-snug",
          sinDatos && "inline-block bg-papel px-1",
        )}
      >
        {veredicto.detalle}
      </p>
    </section>
  );
}

// ——— Controles ———

const GRUPOS: { estado: EstadoControl; titulo: string }[] = [
  { estado: "vencido", titulo: "Vencidos" },
  { estado: "sin_datos", titulo: "Sin fecha cargada" },
  { estado: "pronto", titulo: "Vencen pronto" },
  { estado: "al_dia", titulo: "Al día" },
];

function SeccionControles({ localId }: { localId: string }) {
  const todos = controlesDeLocal(localId).slice().sort(compararControles);
  if (todos.length === 0) {
    return <Vacio>Todavía no hay controles cargados en este local.</Vacio>;
  }
  return (
    <>
      {GRUPOS.map(({ estado, titulo }) => {
        const delGrupo = todos.filter((c) => estadoControl(c) === estado);
        if (delGrupo.length === 0) return null;
        return (
          <Planilla key={estado} titulo={titulo} aparte={delGrupo.length === 1 ? "1 control" : `${delGrupo.length} controles`}>
            {delGrupo.map((c) => {
              const { tipo, elemento, sobre, donde } = describirControl(c);
              return (
                <Fila
                  key={c.id}
                  href={elemento ? `/c/equipos/${elemento.id}` : undefined}
                  estado={estado}
                  titulo={tipo.nombre}
                  detalle={elemento ? `${sobre}${donde ? `, ${minuscula(donde)}` : ""}` : "Todo el local"}
                  derecha={
                    c.vencimiento ? (
                      <FechaFila
                        fecha={fechaCorta(c.vencimiento)}
                        relativo={estado === "al_dia" ? undefined : textoRelativo(c.vencimiento)}
                        tono={estado === "vencido" ? "rojo" : "normal"}
                      />
                    ) : (
                      <span className="text-sm text-cemento">Sin fecha</span>
                    )
                  }
                  debajo={
                    c.ultimaEjecucion ? (
                      <p className="text-sm text-cemento">
                        Último: <span className="cifra text-[15px] text-tinta">{fechaNumerica(c.ultimaEjecucion)}</span>
                        {c.ultimoEjecutor ? `, ${c.ultimoEjecutor}` : ""}
                      </p>
                    ) : undefined
                  }
                />
              );
            })}
          </Planilla>
        );
      })}
    </>
  );
}

// ——— Equipos ———

function SeccionEquipos({ localId }: { localId: string }) {
  const filas = elementosDeLocal(localId)
    .map((e) => {
      const cs = controlesDeElemento(e.id).slice().sort(compararControles);
      return { e, peor: cs[0], estado: peorDe(cs.map(estadoControl)) };
    })
    .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || a.e.codigo.localeCompare(b.e.codigo));

  if (filas.length === 0) {
    return <Vacio>Todavía no hay equipos cargados en este local.</Vacio>;
  }
  return (
    <Planilla aparte={filas.length === 1 ? "1 equipo" : `${filas.length} equipos`}>
      {filas.map(({ e, peor, estado }) => (
        <Fila
          key={e.id}
          href={`/c/equipos/${e.id}`}
          estado={estado}
          titulo={e.tipo}
          detalle={e.ubicacion}
          derecha={<Chapa className="text-[15px]">{e.codigo}</Chapa>}
          debajo={
            <div className="space-y-1 text-sm">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <MarcaEstado estado={estado} />
                {peor && (
                  <span className="text-cemento">
                    {tipoDe(peor).nombre}, {peor.vencimiento ? minuscula(textoRelativo(peor.vencimiento)) : "sin fecha cargada"}
                  </span>
                )}
              </p>
              {e.estado === "en_servicio_externo" && (
                <p className="flex items-center gap-1.5 font-medium">
                  <IconoHerramienta tamano={18} />
                  En el taller, con una unidad sustituta
                </p>
              )}
            </div>
          }
        />
      ))}
    </Planilla>
  );
}
