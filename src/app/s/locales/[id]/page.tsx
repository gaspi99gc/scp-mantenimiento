// Ficha del local: estado, contacto y acceso arriba; controles, elementos, historial y pedidos en pestañas.

import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesContacto } from "@/components/locales/contacto";
import {
  clienteDeLocal,
  detallePedido,
  estadosDeLocal,
  fraseResumen,
  historialDeLocal,
  peorDe,
  plazoPedido,
} from "@/components/locales/consultas";
import { ControlesLocal, type ItemControl } from "@/components/locales/controles-local";
import { LineaDeTiempo } from "@/components/locales/historial";
import { Pestanas } from "@/components/locales/pestanas";
import { Regla } from "@/components/locales/regla";
import {
  IconoAlerta,
  IconoHerramienta,
  IconoReloj,
  IconoSumar,
  IconoTelefono,
} from "@/components/iconos";
import {
  Boton,
  BotonLink,
  Cifra,
  Dato,
  Encabezado,
  FechaFila,
  Fila,
  MarcaEstado,
  Planilla,
  Vacio,
} from "@/components/ui";
import { exigirStaff } from "@/lib/sesion";
import {
  cargarDatos,
  controlesDeElemento,
  controlesDeLocal,
  describirControl,
  elementosDeLocal,
  estadoControl,
  localDe,
  ORDEN_ESTADO,
  pedidosDeLocal,
  resumenLocal,
  tipoDe,
} from "@/lib/datos";
import { textoRelativo } from "@/lib/fechas";
import type { Control, Local } from "@/lib/tipos";

const SECCIONES = ["controles", "elementos", "historial", "pedidos"] as const;
type Seccion = (typeof SECCIONES)[number];

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarDatos();
  return { title: localDe(id)?.nombre ?? "Local" };
}

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** Peor estado primero; a igual estado, el que vence antes (sin fecha, primero). */
function compararControles(a: Control, b: Control) {
  return (
    ORDEN_ESTADO[estadoControl(a)] - ORDEN_ESTADO[estadoControl(b)] ||
    (a.vencimiento ?? "").localeCompare(b.vencimiento ?? "")
  );
}

export default async function FichaLocal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { ver } = await searchParams;
  await cargarDatos();
  const usuario = await exigirStaff();
  const local = localDe(id);
  if (!local) notFound();

  const seccion: Seccion = SECCIONES.includes(ver as Seccion) ? (ver as Seccion) : "controles";
  const cliente = clienteDeLocal(local);
  const resumen = resumenLocal(local.id);
  const estados = estadosDeLocal(local.id);
  const elementos = elementosDeLocal(local.id);
  const pedidos = pedidosDeLocal(local.id);
  const pedidosAbiertos = pedidos.filter((p) => p.estado !== "resuelto");

  return (
    <>
      <Encabezado
        volver={{ href: "/s/locales", texto: "Locales" }}
        titulo={local.nombre}
        bajada={`${cliente.nombre}, ${local.direccion}, ${local.barrio}`}
      >
        <div className="mt-5">
          <Regla estados={estados} etiqueta={fraseResumen(resumen)} className="max-w-md" />
          <p className="mt-2 font-medium" aria-hidden>
            {fraseResumen(resumen)}
          </p>
          {pedidosAbiertos.length > 0 && seccion !== "pedidos" && (
            <p className="mt-1">
              <Link
                href={`/s/locales/${local.id}?ver=pedidos`}
                scroll={false}
                className="font-medium underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
              >
                {pedidosAbiertos.length === 1 ? "Hay 1 pedido abierto" : `Hay ${pedidosAbiertos.length} pedidos abiertos`}
              </Link>
            </p>
          )}
        </div>
      </Encabezado>

      <AccionesContacto local={local} quienEscribe={usuario.nombre} />

      <Acceso local={local} />

      <Pestanas
        base={`/s/locales/${local.id}`}
        activa={seccion}
        pestanas={[
          { clave: "controles", texto: "Controles", cantidad: resumen.total },
          { clave: "elementos", texto: "Equipos", cantidad: elementos.length },
          { clave: "historial", texto: "Historial" },
          { clave: "pedidos", texto: "Pedidos", cantidad: pedidosAbiertos.length },
        ]}
      />

      <div>
        {seccion === "controles" && <SeccionControles localId={local.id} />}
        {seccion === "elementos" && <SeccionElementos localId={local.id} />}
        {seccion === "historial" && <SeccionHistorial localId={local.id} />}
        {seccion === "pedidos" && <SeccionPedidos localId={local.id} />}
      </div>

    </>
  );
}

// ——— Acceso ———

function Acceso({ local }: { local: Local }) {
  return (
    <section className="mb-8" aria-labelledby="acceso">
      <h2 id="acceso" className="rotulo mb-2 text-xl">
        Acceso al local
      </h2>
      <div className="rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel">
        <div className="divide-y divide-junta px-4 sm:grid sm:grid-cols-2 sm:gap-6 sm:divide-y-0">
          <Dato rotulo="Horario de acceso" icono={<IconoReloj tamano={22} />}>
            {local.horarioAcceso || <span className="text-cemento">Sin cargar</span>}
          </Dato>
          <Dato rotulo="Encargado" icono={<IconoTelefono tamano={22} />}>
            {local.encargado.nombre || "Sin cargar"}
            {local.encargado.telefono && (
              <>
                ,{" "}
                <a
                  href={`tel:+${local.encargado.telefono.replace(/[^\d]/g, "")}`}
                  className="cifra whitespace-nowrap text-lg underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
                >
                  {local.encargado.telefono}
                </a>
              </>
            )}
          </Dato>
          {local.observaciones && (
            <div className="sm:col-span-2">
              <Dato rotulo="Observaciones" icono={<IconoAlerta tamano={22} />}>
                <span className="whitespace-pre-line">{local.observaciones}</span>
              </Dato>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ——— Secciones ———

function Bajada({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 px-0.5 text-sm text-cemento">{children}</p>;
}

function SeccionControles({ localId }: { localId: string }) {
  const items: ItemControl[] = controlesDeLocal(localId)
    .sort(compararControles)
    .map((c) => {
      const { tipo, elemento } = describirControl(c);
      return { control: c, tipo, elemento };
    });

  if (items.length === 0) {
    return (
      <Vacio>Todavía no hay controles cargados. Agregá los elementos del local y sus fechas.</Vacio>
    );
  }

  const delLocal = items.filter((i) => !i.elemento).length;
  return (
    <section aria-labelledby="titulo-seccion">
      <h2 id="titulo-seccion" className="sr-only">
        Controles
      </h2>
      <Bajada>
        Del peor estado al mejor.
        {delLocal > 0 && ` ${delLocal === 1 ? "El control del local se registra" : "Los controles del local se registran"} desde acá; los demás, en la ficha de cada equipo.`}
      </Bajada>
      <ControlesLocal items={items} />
    </section>
  );
}

function SeccionElementos({ localId }: { localId: string }) {
  const filas = elementosDeLocal(localId)
    .map((e) => {
      const cs = controlesDeElemento(e.id).sort(compararControles);
      return { e, peor: cs[0], estado: peorDe(cs.map(estadoControl)) };
    })
    .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || a.e.codigo.localeCompare(b.e.codigo));

  return (
    <section aria-labelledby="titulo-seccion">
      <h2 id="titulo-seccion" className="sr-only">
        Equipos
      </h2>
      {filas.length === 0 ? (
        <div className="mb-7">
          <Vacio>Este local todavía no tiene equipos cargados. Agregá los matafuegos, el tanque, la campana y lo que haya.</Vacio>
        </div>
      ) : (
        <>
          <Bajada>{filas.length === 1 ? "1 equipo" : `${filas.length} equipos`}, del peor estado al mejor.</Bajada>
          <Planilla>
            {filas.map(({ e, peor, estado }) => (
              <Fila
                key={e.id}
                href={`/s/elementos/${e.id}`}
                estado={estado}
                titulo={e.tipo}
                detalle={e.ubicacion}
                derecha={<Cifra className="text-lg leading-none">{e.codigo}</Cifra>}
                debajo={
                  <div className="space-y-1 text-sm">
                    <p className="flex flex-wrap items-center gap-x-2">
                      <MarcaEstado estado={estado} />
                      {peor && (
                        <span className="text-cemento">
                          {tipoDe(peor).nombre},{" "}
                          {peor.vencimiento ? minuscula(textoRelativo(peor.vencimiento)) : "falta cargar la fecha"}
                        </span>
                      )}
                    </p>
                    {e.estado === "en_servicio_externo" && (
                      <p className="flex items-center gap-1.5 font-medium">
                        <IconoHerramienta tamano={18} />
                        En el taller
                      </p>
                    )}
                  </div>
                }
              />
            ))}
          </Planilla>
        </>
      )}
      <BotonLink href={`/s/locales/${localId}/equipos/nuevo`} variante="secundario" className="mb-7">
        <IconoSumar tamano={20} />
        Agregar equipo
      </BotonLink>
    </section>
  );
}

function SeccionHistorial({ localId }: { localId: string }) {
  const dias = historialDeLocal(localId);
  return (
    <section aria-labelledby="titulo-seccion">
      <h2 id="titulo-seccion" className="sr-only">
        Historial
      </h2>
      {dias.length === 0 ? (
        <div className="mb-7">
          <Vacio>Todavía no hay trabajos registrados en este local. Lo que registres va a quedar acá.</Vacio>
        </div>
      ) : (
        <>
          <Bajada>Trabajos registrados, del más nuevo al más viejo.</Bajada>
          <LineaDeTiempo dias={dias} />
        </>
      )}
    </section>
  );
}

function SeccionPedidos({ localId }: { localId: string }) {
  const lista = pedidosDeLocal(localId).sort((a, b) => (a.slaVence < b.slaVence ? -1 : 1));
  return (
    <section aria-labelledby="titulo-seccion">
      <h2 id="titulo-seccion" className="sr-only">
        Pedidos
      </h2>
      {lista.length === 0 ? (
        <div className="mb-7">
          <Vacio
            accion={
              // TODO(supabase): carga de pedidos que llegan por WhatsApp o por teléfono.
              <Boton variante="secundario">
                <IconoSumar tamano={20} />
                Cargar pedido
              </Boton>
            }
          >
            No hay pedidos de este local. Si el encargado te pide algo por WhatsApp o por teléfono, cargalo acá para que
            corra el plazo del abono.
          </Vacio>
        </div>
      ) : (
        <>
          <Bajada>Ordenados por el plazo del abono que les queda.</Bajada>
          <Planilla>
            {lista.map((p) => {
              const plazo = plazoPedido(p);
              return (
                <Fila
                  key={p.id}
                  estado={plazo.estado}
                  titulo={p.titulo}
                  detalle={p.detalle}
                  derecha={
                    <FechaFila fecha={plazo.cifra} relativo={plazo.texto} tono={plazo.estado === "vencido" ? "rojo" : "normal"} />
                  }
                  debajo={<p className="text-sm">{detallePedido(p)}</p>}
                />
              );
            })}
          </Planilla>
        </>
      )}
    </section>
  );
}
