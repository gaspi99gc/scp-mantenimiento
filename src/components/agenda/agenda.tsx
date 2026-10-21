"use client";

// Agenda de vencimientos: filtra por estado y busca por local o elemento.
// Los datos llegan ya armados desde el servidor; acá solo se filtra y se agrupa.

import { useEffect, useMemo, useRef, useState } from "react";
import { IconoBuscar, IconoCerrar } from "@/components/iconos";
import { Boton, Chip, cx, ESTADO, Planilla, Vacio } from "@/components/ui";
import type { EstadoControl } from "@/lib/tipos";
import type { FilaAgenda } from "./consultas";
import { FilaDeAgenda } from "./fila-agenda";
import { cantidad, normalizar } from "./texto";

export type FiltroAgenda = "todos" | "vencido" | "pronto" | "sin_datos" | "al_dia";

const FILTROS: { clave: FiltroAgenda; texto: string }[] = [
  { clave: "todos", texto: "Todos" },
  { clave: "vencido", texto: "Vencidos" },
  { clave: "pronto", texto: "Vencen pronto" },
  { clave: "sin_datos", texto: "Sin datos" },
  { clave: "al_dia", texto: "Al día" },
];

const VACIO: Record<FiltroAgenda, string> = {
  todos: "No hay controles cargados.",
  vencido: "No hay controles vencidos.",
  pronto: "No hay controles que venzan pronto.",
  sin_datos: "Todos los controles tienen la fecha cargada.",
  al_dia: "No hay controles al día.",
};

/** Deja el filtro en la dirección, para poder volver o compartirla tal cual. */
function sincronizar(filtro: FiltroAgenda, q: string) {
  const url = new URL(window.location.href);
  if (filtro === "todos") url.searchParams.delete("estado");
  else url.searchParams.set("estado", filtro);
  if (q.trim()) url.searchParams.set("q", q);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

export function Agenda({
  filas,
  filtroInicial = "todos",
  busquedaInicial = "",
}: {
  filas: FilaAgenda[];
  filtroInicial?: FiltroAgenda;
  busquedaInicial?: string;
}) {
  const [filtro, setFiltro] = useState<FiltroAgenda>(filtroInicial);
  const [q, setQ] = useState(busquedaInicial);
  const chips = useRef<HTMLDivElement>(null);

  // Si se entra con un filtro elegido (?estado=…), que el chip activo quede a la vista en el celular.
  useEffect(() => {
    const fila = chips.current;
    const activo = fila?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!fila || !activo) return;
    const a = activo.getBoundingClientRect();
    const f = fila.getBoundingClientRect();
    if (a.right > f.right) fila.scrollLeft += a.left - f.left - 16;
  }, []);

  const porBusqueda = useMemo(() => {
    const terminos = normalizar(q).split(/\s+/).filter(Boolean);
    if (terminos.length === 0) return filas;
    return filas.filter((f) => terminos.every((t) => f.busqueda.includes(t)));
  }, [filas, q]);

  const cuentas = useMemo(() => {
    const c: Record<FiltroAgenda, number> = { todos: porBusqueda.length, vencido: 0, pronto: 0, sin_datos: 0, al_dia: 0 };
    for (const f of porBusqueda) if (f.estado in c) c[f.estado as Exclude<FiltroAgenda, "todos">]++;
    return c;
  }, [porBusqueda]);

  const grupos = useMemo(() => {
    const visibles = filtro === "todos" ? porBusqueda : porBusqueda.filter((f) => f.estado === filtro);
    const m = new Map<string, { titulo: string; filas: FilaAgenda[] }>();
    for (const f of visibles) {
      const g = m.get(f.periodo.clave) ?? { titulo: f.periodo.titulo, filas: [] };
      g.filas.push(f);
      m.set(f.periodo.clave, g);
    }
    return [...m.entries()];
  }, [porBusqueda, filtro]);

  const total = grupos.reduce((n, [, g]) => n + g.filas.length, 0);

  function elegir(f: FiltroAgenda) {
    setFiltro(f);
    sincronizar(f, q);
  }

  function buscar(v: string) {
    setQ(v);
    sincronizar(filtro, v);
  }

  return (
    <>
      <div className="mb-6 space-y-3">
        <div className="relative lg:max-w-md">
          <label htmlFor="buscar-agenda" className="sr-only">
            Buscar por local o elemento
          </label>
          <IconoBuscar tamano={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cemento" />
          <input
            id="buscar-agenda"
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={q}
            onChange={(e) => buscar(e.target.value)}
            placeholder="Buscar local o elemento"
            className="h-12 w-full rounded-[var(--radius-boton)] border border-borde bg-papel pl-11 pr-12 text-base text-tinta placeholder:text-cemento hover:border-tinta focus-visible:border-tinta"
          />
          {q && (
            <button
              type="button"
              onClick={() => buscar("")}
              aria-label="Borrar la búsqueda"
              className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-[var(--radius-boton)] text-cemento hover:text-tinta"
            >
              <IconoCerrar tamano={20} />
            </button>
          )}
        </div>

        <div
          ref={chips}
          role="group"
          aria-label="Filtrar por estado"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {FILTROS.map(({ clave, texto }) => {
            const activo = filtro === clave;
            return (
              <Chip key={clave} activo={activo} onClick={() => elegir(clave)}>
                {clave !== "todos" && (
                  <span
                    aria-hidden
                    className={cx(
                      "inline-block size-3 rounded-[1px]",
                      ESTADO[clave as EstadoControl].cinta,
                      clave === "sin_datos" && "bg-papel",
                    )}
                  />
                )}
                {texto}
                <span className={cx("cifra ml-0.5 text-base leading-none", activo ? "text-papel/75" : "text-cemento")}>
                  {cuentas[clave]}
                </span>
              </Chip>
            );
          })}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {cantidad(total, "control", "controles")}
      </p>

      {total === 0 ? (
        q.trim() ? (
          <Vacio accion={<Boton variante="secundario" onClick={() => buscar("")}>Borrar la búsqueda</Boton>}>
            No hay controles que coincidan con “{q.trim()}”. Probá con el nombre del local, el barrio o el tipo de elemento.
          </Vacio>
        ) : (
          <Vacio accion={<Boton variante="secundario" onClick={() => elegir("todos")}>Ver todos</Boton>}>
            {VACIO[filtro]}
          </Vacio>
        )
      ) : (
        grupos.map(([clave, g]) => (
          <Planilla key={clave} titulo={g.titulo} aparte={cantidad(g.filas.length, "control", "controles")}>
            {clave === "9-sin-datos" && (
              <li className="rayado-suave px-4 py-2.5">
                <span className="rounded-[2px] bg-papel px-1.5 py-0.5 text-sm font-semibold">Cuentan como vencidos.</span>
              </li>
            )}
            {g.filas.map((f) => (
              <FilaDeAgenda key={f.id} fila={f} />
            ))}
          </Planilla>
        ))
      )}
    </>
  );
}
