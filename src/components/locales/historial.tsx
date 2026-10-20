// Historial del local como línea de tiempo: un día por marca, del más nuevo al más viejo.
// Las visitas se marcan con un cuadrado (lleno si se hizo, vacío si fue fallida);
// los días con solo trabajos, con un agujero perforado, como la grilla de la tarjeta.

import Link from "next/link";
import { Cifra, cx } from "@/components/ui";
import { fechaMedia } from "@/lib/fechas";
import { haceCuanto, RESULTADO, type DiaHistorial, type EventoHistorial } from "./consultas";

function Marca({ dia }: { dia: DiaHistorial }) {
  const visita = dia.eventos.find((e) => e.clase === "visita");
  const base = "absolute left-0 top-[5px] z-10 size-4";
  if (!visita) return <span aria-hidden className={cx(base, "perforado rounded-full")} />;
  if (visita.estado === "fallida") return <span aria-hidden className={cx(base, "rounded-[3px] border-2 border-tinta bg-papel")} />;
  if (visita.estado === "en_curso")
    return <span aria-hidden className={cx(base, "rounded-[3px] bg-tinta ring-2 ring-tinta ring-offset-2 ring-offset-papel")} />;
  return <span aria-hidden className={cx(base, "rounded-[3px] bg-tinta")} />;
}

function Nota({ children }: { children: string }) {
  return <p className="mt-1.5 border-l-2 border-junta pl-3 text-sm">{children}</p>;
}

function Evento({ ev }: { ev: EventoHistorial }) {
  if (ev.clase === "visita") {
    return (
      <li>
        <p className="font-semibold leading-snug">{ev.titulo}</p>
        <p className="mt-0.5 text-sm text-cemento">
          De {ev.franja.replace(/ h$/, "\u00a0h")}.{ev.que && ` ${ev.que}.`}
        </p>
        {ev.nota && <Nota>{ev.nota}</Nota>}
        {ev.informe && (
          <Link
            href={`/s/informes/${ev.informe.id}`}
            className="mt-1 inline-flex min-h-10 items-center gap-1 text-sm font-semibold underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
          >
            Ver informe <Cifra className="text-base">{ev.informe.numero}</Cifra>
          </Link>
        )}
      </li>
    );
  }
  return (
    <li>
      <p className="font-semibold leading-snug">{ev.titulo}</p>
      <p className="mt-0.5 text-sm text-cemento">
        {ev.sobre}
        {ev.codigo && (
          <>
            {", "}
            <Cifra className="text-tinta">{ev.codigo}</Cifra>
          </>
        )}
      </p>
      {(ev.resultado || ev.ejecutor || ev.oblea) && (
        <p className="mt-0.5 text-sm">
          {ev.resultado && `${RESULTADO[ev.resultado]}. `}
          {ev.ejecutor && `Lo hizo ${ev.ejecutor}`}
          {ev.oblea && (
            <>
              {ev.ejecutor ? ", oblea " : "Oblea "}
              <Cifra>{ev.oblea}</Cifra>
            </>
          )}
          {(ev.oblea || (ev.ejecutor && !ev.ejecutor.endsWith("."))) && "."}
        </p>
      )}
      {ev.vencimientoNuevo && (
        <p className="mt-0.5 text-sm text-cemento">
          Nuevo vencimiento: <Cifra className="text-tinta">{fechaMedia(ev.vencimientoNuevo)}</Cifra>
        </p>
      )}
      {ev.nota && <Nota>{ev.nota}</Nota>}
    </li>
  );
}

export function LineaDeTiempo({ dias }: { dias: DiaHistorial[] }) {
  return (
    <div className="mb-7 rounded-[var(--radius-planilla)] border border-junta border-t-2 border-t-tinta bg-papel px-4 py-5">
      <ol>
        {dias.map((dia, i) => (
          <li key={dia.fecha} className="relative pb-7 pl-8 last:pb-0">
            {/* El tramo de línea que baja hasta la marca siguiente */}
            {i < dias.length - 1 && (
              <span aria-hidden className="absolute bottom-0 left-[7px] top-[13px] w-0.5 bg-junta" />
            )}
            <Marca dia={dia} />
            <h3 className="flex flex-wrap items-baseline gap-x-2">
              <Cifra className="text-xl leading-none">{fechaMedia(dia.fecha)}</Cifra>
              <span className="text-sm text-cemento">{haceCuanto(dia.fecha)}</span>
            </h3>
            <ul className="mt-2 space-y-4">
              {dia.eventos.map((ev) => (
                <Evento key={ev.id} ev={ev} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
