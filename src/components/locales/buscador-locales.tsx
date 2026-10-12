"use client";

// Lista de locales agrupada por cliente, con buscador por local, cliente o barrio.
// La página arma los datos en el servidor; acá solo se filtra.

import { useId, useState } from "react";
import { IconoCerrar } from "@/components/iconos";
import { Boton, Planilla, Vacio } from "@/components/ui";
import { FilaLocal, type DatosFilaLocal } from "./fila-local";
import { IconoBuscar } from "./iconos";

export interface GrupoCliente {
  id: string;
  nombre: string;
  razonSocial: string;
  locales: DatosFilaLocal[];
}

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export function BuscadorLocales({ grupos }: { grupos: GrupoCliente[] }) {
  const [busqueda, setBusqueda] = useState("");
  const idCampo = useId();

  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean);

  const filtrados =
    palabras.length === 0
      ? grupos
      : grupos
          .map((g) => ({
            ...g,
            locales: g.locales.filter((l) => {
              const texto = normalizar([l.nombre, l.barrio, l.direccion, g.nombre, g.razonSocial].join(" "));
              return palabras.every((p) => texto.includes(p));
            }),
          }))
          .filter((g) => g.locales.length > 0);

  const cantidad = filtrados.reduce((n, g) => n + g.locales.length, 0);

  return (
    <>
      <div className="relative mb-6">
        <label htmlFor={idCampo} className="sr-only">
          Buscar por local, cliente o barrio
        </label>
        <IconoBuscar
          tamano={20}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cemento"
        />
        <input
          id={idCampo}
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por local, cliente o barrio"
          autoComplete="off"
          className="min-h-12 w-full appearance-none rounded-[var(--radius-boton)] border border-junta bg-papel pl-11 pr-12 placeholder:text-cemento focus:border-tinta [&::-webkit-search-cancel-button]:hidden"
        />
        {busqueda && (
          <button
            type="button"
            onClick={() => setBusqueda("")}
            aria-label="Borrar la búsqueda"
            className="absolute right-0 top-0 inline-flex size-12 items-center justify-center rounded-[var(--radius-boton)] text-cemento hover:text-tinta"
          >
            <IconoCerrar tamano={20} />
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {palabras.length > 0 && (cantidad === 1 ? "1 local encontrado" : `${cantidad} locales encontrados`)}
      </p>

      {filtrados.map((g) => (
        <Planilla
          key={g.id}
          titulo={
            <>
              {g.nombre}{" "}
              <span className="ml-1 whitespace-nowrap text-sm font-normal text-cemento">{g.razonSocial}</span>
            </>
          }
          aparte={g.locales.length === 1 ? "1 local" : `${g.locales.length} locales`}
        >
          {g.locales.map((l) => (
            <FilaLocal key={l.id} local={l} />
          ))}
        </Planilla>
      ))}

      {cantidad === 0 && (
        <Vacio accion={<Boton variante="secundario" onClick={() => setBusqueda("")}>Borrar la búsqueda</Boton>}>
          No hay locales que coincidan con «{busqueda.trim()}». Probá con el barrio o con el nombre del cliente.
        </Vacio>
      )}
    </>
  );
}
