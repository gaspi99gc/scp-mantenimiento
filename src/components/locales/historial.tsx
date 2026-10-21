// Historial del local como línea de tiempo: un día por marca, del más nuevo al más viejo.
// Cada día se marca con un agujero perforado, como la grilla de la tarjeta.

import { Cifra } from "@/components/ui";
import { fechaMedia } from "@/lib/fechas";
import { haceCuanto, RESULTADO, type DiaHistorial, type EventoHistorial } from "./consultas";

function Marca() {
  return <span aria-hidden className="perforado absolute left-0 top-[5px] z-10 size-4 rounded-full" />;
}

function Nota({ children }: { children: string }) {
  return <p className="mt-1.5 border-l-2 border-junta pl-3 text-sm">{children}</p>;
}

function Evento({ ev }: { ev: EventoHistorial }) {
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
            <Marca />
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
