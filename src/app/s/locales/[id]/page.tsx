// Ficha del local: estado, contacto y acceso arriba; controles, elementos e historial en pestañas.

import Link from "next/link";
import { notFound } from "next/navigation";
import { AccionesContacto } from "@/components/locales/contacto";
import {
  clienteDeLocal,
  estadosDeLocal,
  fraseResumen,
  historialDeLocal,
  peorDe,
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
  BotonLink,
  Cifra,
  Dato,
  Encabezado,
  Fila,
  MarcaEstado,
  Planilla,
  Vacio,
} from "@/components/ui";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";
import {
  cargarDatos,
  controlesDeElemento,
  controlesDeLocal,
  describirControl,
  elementosDeLocal,
  estadoControl,
  localDe,
  ORDEN_ESTADO,
  resumenLocal,
  tipoDe,
} from "@/lib/datos";
import { textoRelativo } from "@/lib/fechas";
import type { Control, Local } from "@/lib/tipos";

const SECCIONES = ["controles", "elementos", "historial"] as const;
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

  // Quiénes del cliente ven este local en su app (los de todo el cliente y los de este local).
  const db = await clienteServidor();
  const { data: membresias } = await db.from("membresia").select("perfil_id, local_id").eq("cliente_id", cliente.id);
  const ids = (membresias ?? []).filter((m) => !m.local_id || m.local_id === local.id).map((m) => m.perfil_id);
  const { data: perfiles } = ids.length
    ? await db.from("perfil").select("nombre, usuario").in("id", ids).eq("activo", true).order("nombre")
    : { data: [] as { nombre: string; usuario: string | null }[] };
  const quienesVen = (perfiles ?? []).map((p) => (p.usuario ? `${p.nombre} (${p.usuario})` : p.nombre));

  return (
    <>
      <Encabezado
        volver={{ href: "/s/locales", texto: "Locales" }}
        titulo={local.nombre}
        bajada={
          <>
            <Link
              href={`/s/clientes/${cliente.id}`}
              className="text-tinta underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
            >
              {cliente.nombre}
            </Link>
            , {local.direccion}, {local.barrio}
          </>
        }
      >
        <div className="mt-5">
          <Regla estados={estados} etiqueta={fraseResumen(resumen)} className="max-w-md" />
          <p className="mt-2 font-medium" aria-hidden>
            {fraseResumen(resumen)}
          </p>
          <p className="mt-1 text-sm text-cemento">
            {quienesVen.length
              ? `En la app del cliente lo ${quienesVen.length === 1 ? "ve" : "ven"}: ${quienesVen.join(", ")}.`
              : "Nadie del cliente lo ve todavía en su app."}{" "}
            <Link
              href={`/s/clientes/${cliente.id}`}
              className="font-medium text-tinta underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
            >
              {usuario.rol === "admin" ? "Usuarios del cliente" : "Ver cliente"}
            </Link>
          </p>
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
        ]}
      />

      <div>
        {seccion === "controles" && <SeccionControles localId={local.id} />}
        {seccion === "elementos" && <SeccionElementos localId={local.id} />}
        {seccion === "historial" && <SeccionHistorial localId={local.id} />}
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
