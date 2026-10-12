"use client";

// El informe como documento: lo que ve el cliente y lo que puede terminar en manos de un inspector.
// Hoja de papel con membrete, datos de la visita, cuerpo, firma de conformidad y verificación.
// Las subsanaciones van al pie, después de la firma: son agregados posteriores y el original no se toca.

import { Cifra, MarcaEstado } from "@/components/ui";
import { fechaLarga, fechaNumerica } from "@/lib/fechas";
import type { FechaISO } from "@/lib/tipos";
import { textoEtapa, type DatosInforme } from "./consultas";
import { CodigoQR, FotoPlaceholder, SinCortes } from "./piezas";

const minuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const fechaCompleta = (iso: FechaISO) => `${fechaLarga(iso)} de ${iso.slice(0, 4)}`;

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-lg font-[650] leading-tight">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Trazo de la firma. Representa la imagen que se captura en el celular al cerrar la visita.
 * TODO(supabase): mostrar la imagen real de la firma (adjunto de la visita).
 */
function TrazoFirma({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 168 56" fill="none" aria-hidden className={className}>
      <path
        d="M6 40c6-14 12-27 17-27 6 0 1 26 6 26 6 0 9-22 15-22 5 0 2 18 7 18 6 0 8-14 13-14 4 0 3 11 8 11 6 0 10-17 16-17 5 0 1 19 7 19 7 0 11-10 17-10 5 0 6 7 11 7 6 0 10-6 15-8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 47c30-4 70-6 118-9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentoInforme({
  d,
  publicado,
}: {
  /** Datos ya combinados con lo que se editó en pantalla. */
  d: DatosInforme;
  /** En la vista previa del borrador todavía no hay número, huella ni QR. */
  publicado: boolean;
}) {
  const fotos = d.fotos.filter((f) => f.visibleCliente);

  return (
    <article
      aria-label={publicado ? `Informe ${d.numero}` : "Vista previa del informe"}
      className="rounded-[var(--radius-planilla)] border border-junta bg-papel px-5 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-9 lg:px-14 lg:pb-12 lg:pt-11"
    >
      {/* Membrete */}
      <header className="flex items-end justify-between gap-4 border-b-2 border-tinta pb-4 sm:gap-8">
        <div>
          <div className="titulo text-4xl leading-[0.9] [font-stretch:62%]">SCP</div>
          <div className="mt-1 text-sm text-cemento">Mantenimiento integral</div>
        </div>
        <div className="text-right">
          <div className="font-[650]">Informe de visita</div>
          {publicado ? (
            <Cifra className="block text-xl leading-tight">{d.numero}</Cifra>
          ) : (
            <div className="text-sm text-cemento">Sin número hasta publicar</div>
          )}
          <Cifra className="block text-cemento">{fechaNumerica(d.fecha)}</Cifra>
        </div>
      </header>

      {/* Datos de la visita */}
      <dl className="grid gap-x-8 gap-y-4 border-b border-junta py-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-cemento">Local</dt>
          <dd className="font-medium">{d.local.nombre}</dd>
          <dd>
            {d.local.direccion}, {d.local.barrio}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-cemento">Cliente</dt>
          <dd className="font-medium">{d.cliente.razonSocial}</dd>
          <dd>
            CUIT <Cifra className="text-base">{d.cliente.cuit}</Cifra>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-cemento">Visita</dt>
          <dd className="font-medium">{d.tipoVisita}</dd>
          <dd>{fechaCompleta(d.fecha).replace(/^./, (c) => c.toUpperCase())}</dd>
        </div>
        <div>
          <dt className="text-sm text-cemento">Supervisor de SCP</dt>
          <dd className="font-medium">{d.supervisor}</dd>
        </div>
      </dl>

      <Seccion titulo="Resumen">
        {d.resumen.trim() ? (
          <p className="max-w-[62ch] whitespace-pre-line">{d.resumen}</p>
        ) : (
          <p className="text-cemento">Sin resumen.</p>
        )}
      </Seccion>

      {d.hechos.length > 0 && (
        <Seccion titulo="Controles realizados">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-tinta/60 text-sm text-cemento">
                <th scope="col" className="pb-1.5 font-normal">Control</th>
                <th scope="col" className="pb-1.5 pl-4 text-right font-normal">
                  <span className="sm:hidden">Vence</span>
                  <span className="hidden sm:inline">Próximo vencimiento</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {d.hechos.map((h) => (
                <tr key={h.id} className="border-b border-junta align-top">
                  <td className="py-2.5">
                    <div className="font-medium">{h.que}</div>
                    <div className="text-sm text-cemento">
                      {h.sobre}
                      {h.donde ? `, ${minuscula(h.donde)}` : ""}
                    </div>
                  </td>
                  <td className="py-2.5 pl-4 text-right">
                    <Cifra className="text-lg leading-tight">{fechaNumerica(h.vencimientoNuevo)}</Cifra>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Seccion>
      )}

      {d.pendientes.length > 0 && (
        <Seccion titulo="Quedó pendiente">
          <ul className="border-t border-tinta/60">
            {d.pendientes.map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-4 border-b border-junta py-2.5">
                <div className="min-w-0">
                  <div className="font-medium">{p.que}</div>
                  <div className="text-sm text-cemento">
                    {p.sobre}
                    {p.donde ? `, ${minuscula(p.donde)}` : ""}
                  </div>
                  <p className="mt-1 max-w-[62ch] text-sm">
                    <SinCortes texto={p.motivo} />
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <MarcaEstado estado={p.estado} />
                  {p.vencimiento && <Cifra className="block text-lg leading-tight">{fechaNumerica(p.vencimiento)}</Cifra>}
                </div>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {d.trabajos.length > 0 && (
        <Seccion titulo="Trabajos realizados">
          <ul className="max-w-[62ch] space-y-1.5">
            {d.trabajos.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-[9px] size-1.5 shrink-0 bg-tinta" />
                {t}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {d.recomendaciones.length > 0 && (
        <Seccion titulo="Recomendaciones">
          <ol className="max-w-[62ch] space-y-2.5">
            {d.recomendaciones.map((r, i) => (
              <li key={i} className="flex gap-3">
                <Cifra className="w-4 shrink-0 text-lg leading-6">{i + 1}</Cifra>
                <p>{r}</p>
              </li>
            ))}
          </ol>
        </Seccion>
      )}

      {fotos.length > 0 && (
        <Seccion titulo="Fotos">
          <ul className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            {fotos.map((f, i) => (
              <li key={f.id}>
                <figure>
                  <FotoPlaceholder numero={i + 1} />
                  <figcaption className="mt-1.5 text-sm leading-snug">
                    <span className="sr-only">Foto {i + 1}: </span>
                    <SinCortes texto={f.epigrafe || "Sin epígrafe"} />
                    <span className="block text-cemento">{textoEtapa(f.etapa)}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      {/* Pie: firma de conformidad y verificación */}
      <footer className="mt-10 grid gap-x-10 gap-y-8 border-t border-junta pt-6 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <div className="text-sm text-cemento">Firma de conformidad</div>
          {d.firma ? (
            <>
              <TrazoFirma className="mt-1 h-14 w-44 text-tinta" />
              <div className="max-w-64 border-t border-tinta pt-1.5">
                <div className="font-[650]">{d.firma.nombre}</div>
                <div className="text-sm text-cemento">
                  DNI <Cifra className="text-base text-tinta">{d.firma.dni}</Cifra>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-1">El encargado no firmó esta visita.</p>
          )}
        </div>

        <div className="flex items-start gap-4 sm:max-w-[300px]">
          {publicado ? (
            <CodigoQR texto={`https://${d.verificacion.url}`} tamano={84} className="shrink-0 text-tinta" />
          ) : (
            <span aria-hidden className="rayado-suave size-[84px] shrink-0 rounded-[4px] border border-junta" />
          )}
          <div className="min-w-0 text-sm">
            {publicado ? (
              <>
                <p className="font-[650]">Verificá este informe en</p>
                <p className="break-all font-medium">{d.verificacion.url}</p>
                <p className="mt-2 text-cemento">Huella SHA-256</p>
                <Cifra className="text-base">
                  {d.verificacion.huella.slice(0, 8)}…{d.verificacion.huella.slice(-6)}
                </Cifra>
              </>
            ) : (
              <p className="text-cemento">El código de verificación y la huella del documento se generan al publicar.</p>
            )}
          </div>
        </div>
      </footer>

      {/* Subsanaciones: agregados posteriores, numerados en orden */}
      {d.subsanaciones.length > 0 && (
        <section aria-labelledby="titulo-subsanaciones" className="mt-10 border-t-2 border-tinta pt-6">
          <h2 id="titulo-subsanaciones" className="text-lg font-[650] leading-tight">
            Subsanaciones
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-cemento">
            Se agregaron después de publicar. El informe de arriba quedó como se publicó el {fechaNumerica(d.fecha)}.
          </p>
          <ol className="mt-5 space-y-4">
            {d.subsanaciones.map((s, i) => (
              <li
                key={s.id}
                id={`subsanacion-${s.id}`}
                tabIndex={-1}
                className="scroll-mt-8 rounded-r-[var(--radius-boton)] border-l-4 border-tinta bg-yeso px-4 py-4 sm:px-5"
              >
                <div className="flex flex-wrap items-start gap-x-5 gap-y-3">
                  <h3 className="inline-flex shrink-0 flex-col rounded-[4px] border-[3px] border-double border-tinta px-2.5 pb-1 pt-1.5 leading-none">
                    <Cifra className="text-xl leading-none">Subsanación {i + 1}</Cifra>
                    <Cifra className="mt-1 text-sm leading-none text-cemento">{fechaNumerica(s.fecha)}</Cifra>
                  </h3>
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 pt-0.5 text-sm">
                    <dt className="text-cemento">Motivo</dt>
                    <dd className="font-medium">{s.motivo}</dd>
                    <dt className="text-cemento">Agregó</dt>
                    <dd>{s.autor}</dd>
                  </dl>
                </div>
                <p className="mt-3 max-w-[62ch]">{s.texto}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
