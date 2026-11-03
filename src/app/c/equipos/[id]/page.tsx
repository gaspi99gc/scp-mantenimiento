// Un equipo visto por el cliente: sus tarjetas de control (sin botones), la unidad instalada y el historial.
// Es también adonde lleva el QR pegado en el equipo cuando lo escanea el cliente.
// Si el equipo no es de uno de sus locales, la base no lo trae y da 404.

import { notFound } from "next/navigation";
import { rutaDelLocal } from "@/components/cliente/consultas";
import { controlesDeFicha, historialDeElemento } from "@/components/elementos/consultas";
import { TEXTO_ORIGEN, TEXTO_RESULTADO } from "@/components/elementos/textos";
import { IconoHerramienta } from "@/components/iconos";
import { Colgadero, Tarjeta } from "@/components/tarjeta";
import { Chapa, Cifra, Dato, Encabezado, Planilla, TituloPlanilla, Vacio } from "@/components/ui";
import { cargarDatosCliente, elementoDe, estadoControl, localDe } from "@/lib/datos";
import { fechaMedia, fechaNumerica } from "@/lib/fechas";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarDatosCliente();
  return { title: elementoDe(id)?.tipo ?? "Equipo" };
}

export default async function EquipoDelCliente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarDatosCliente();
  const equipo = elementoDe(id);
  if (!equipo) notFound();
  const local = localDe(equipo.localId)!;
  const controles = controlesDeFicha(equipo.id);
  const historial = historialDeElemento(equipo.id);

  return (
    <>
      <Encabezado
        volver={{ href: rutaDelLocal(local.id), texto: local.nombre }}
        titulo={equipo.tipo}
        bajada={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{equipo.ubicacion}</span>
            <Chapa className="text-[15px]">{equipo.codigo}</Chapa>
          </span>
        }
      />

      {equipo.estado === "en_servicio_externo" && (
        <p className="mb-6 flex gap-3 rounded-[var(--radius-planilla)] border-2 border-tinta bg-papel px-4 py-3">
          <IconoHerramienta className="mt-0.5 shrink-0" tamano={22} />
          <span>
            <strong className="font-semibold">Este equipo está en el taller.</strong> En su lugar dejamos una unidad
            sustituta.
          </span>
        </p>
      )}

      <section aria-labelledby="titulo-controles" className="mb-10">
        <h2 id="titulo-controles" className="sr-only">
          Controles
        </h2>
        {controles.length === 0 ? (
          <Vacio>Este equipo todavía no tiene controles cargados.</Vacio>
        ) : (
          <Colgadero>
            {controles.map(({ control, tipo }) => (
              <Tarjeta key={control.id} control={control} tipo={tipo} estado={estadoControl(control)} />
            ))}
          </Colgadero>
        )}
      </section>

      <div className="lg:grid lg:grid-cols-[1fr_288px] lg:gap-8">
        <section aria-labelledby="titulo-historial">
          <TituloPlanilla id="titulo-historial" titulo="Trabajos hechos" aparte={historial.length ? `${historial.length}` : undefined} />
          {historial.length === 0 ? (
            <div className="mb-8">
              <Vacio>Todavía no hay trabajos registrados en este equipo.</Vacio>
            </div>
          ) : (
            <Planilla>
              {historial.map((h) => (
                <li key={h.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{h.control}</span>
                    <Cifra className="shrink-0 text-[20px] leading-none">{fechaNumerica(h.fecha)}</Cifra>
                  </div>
                  <p className="mt-1 text-sm text-cemento">
                    {TEXTO_RESULTADO[h.resultado]}, {h.ejecutor}
                    {h.oblea ? `. Oblea ${h.oblea}` : ""}
                  </p>
                  {h.vencimientoNuevo && (
                    <p className="mt-0.5 text-sm">
                      Nuevo vencimiento: <Cifra className="text-[16px]">{fechaMedia(h.vencimientoNuevo)}</Cifra>
                      {TEXTO_ORIGEN[h.origen] ? <span className="text-cemento"> ({TEXTO_ORIGEN[h.origen]})</span> : null}
                    </p>
                  )}
                  {h.nota && <p className="mt-1 text-sm">{h.nota}</p>}
                </li>
              ))}
            </Planilla>
          )}
        </section>

        {equipo.unidad && (
          <section aria-labelledby="titulo-unidad">
            <TituloPlanilla id="titulo-unidad" titulo="Unidad instalada" />
            <div className="mb-8 rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel px-4">
              <Dato rotulo="Número de serie">
                <Cifra className="text-[24px]">{equipo.unidad.serie}</Cifra>
              </Dato>
              <div className="grid grid-cols-2 gap-4 border-t border-junta">
                <Dato rotulo="Fabricación">
                  <Cifra className="text-[19px]">{fechaMedia(equipo.unidad.fabricacion)}</Cifra>
                </Dato>
                <Dato rotulo="Instalada desde">
                  <Cifra className="text-[19px]">{fechaMedia(equipo.unidad.instaladaDesde)}</Cifra>
                </Dato>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
