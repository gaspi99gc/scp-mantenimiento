// Escanear: la cámara para leer el QR del equipo y, siempre a mano, la alternativa de escribir el código.
// La búsqueda por código es un formulario GET: si hay coincidencia, el servidor lleva directo a la ficha.

import type { Metadata } from "next";
import Form from "next/form";
import { redirect } from "next/navigation";
import { buscarElemento, codigosParecidos, nombreLocal, peorControl } from "@/components/elementos/consultas";
import { Escaner } from "@/components/elementos/escaner";
import { enMinuscula } from "@/components/elementos/textos";
import { IconoAlerta } from "@/components/iconos";
import { Boton, Cifra, Encabezado, FechaFila, Fila, Planilla } from "@/components/ui";
import { elementoDe } from "@/lib/datos";
import { fechaCorta, textoRelativo } from "@/lib/fechas";
import type { Elemento } from "@/lib/tipos";
import { cargarDatos } from "@/lib/datos";

export const metadata: Metadata = { title: "Escanear" };

// TODO(supabase): los últimos equipos que abrió este supervisor (tabla de accesos o historial del dispositivo).
const VISTOS_HACE_POCO = ["el-9", "el-1", "el-14"];

function FilaElemento({ elemento }: { elemento: Elemento }) {
  const { estado, control } = peorControl(elemento.id);
  return (
    <Fila
      href={`/s/elementos/${elemento.id}`}
      estado={estado}
      titulo={elemento.tipo}
      detalle={
        <>
          <span className="block">
            {nombreLocal(elemento.localId)}, {enMinuscula(elemento.ubicacion)}
          </span>
          <Cifra className="block text-base text-tinta">{elemento.codigo}</Cifra>
        </>
      }
      derecha={
        control?.vencimiento ? (
          <FechaFila
            fecha={fechaCorta(control.vencimiento)}
            relativo={estado === "al_dia" ? undefined : textoRelativo(control.vencimiento)}
            tono={estado === "vencido" ? "rojo" : "normal"}
          />
        ) : (
          <span className="text-sm text-cemento">Sin fecha</span>
        )
      }
    />
  );
}

export default async function Escanear({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { codigo } = await searchParams;
  await cargarDatos();
  const texto = typeof codigo === "string" ? codigo.trim() : "";
  const encontrado = texto ? buscarElemento(texto) : undefined;
  if (encontrado) redirect(`/s/elementos/${encontrado.id}`);

  const parecidos = texto ? codigosParecidos(texto) : [];
  const recientes = VISTOS_HACE_POCO.map(elementoDe).filter((e): e is Elemento => !!e);

  return (
    <>
      <Encabezado titulo="Escanear" />

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-x-8">
        <Escaner />

        <div>
          <section aria-labelledby="titulo-codigo" className="mb-7">
            <h2 id="titulo-codigo" className="rotulo mb-2 text-xl">
              Escribir el código
            </h2>
            <Form action="/s/escanear" className="flex gap-2">
              <label htmlFor="codigo" className="sr-only">
                Código del equipo
              </label>
              <input
                id="codigo"
                name="codigo"
                defaultValue={texto}
                placeholder="ESP1-MAT-01"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="search"
                aria-describedby="ayuda-codigo"
                aria-invalid={texto ? true : undefined}
                className="cifra min-h-12 min-w-0 flex-1 rounded-[var(--radius-boton)] border border-borde bg-papel px-3 text-xl uppercase placeholder:text-cemento/70"
              />
              <Boton type="submit" variante="secundario">
                Buscar
              </Boton>
            </Form>
            <p id="ayuda-codigo" className="mt-1.5 px-0.5 text-sm text-cemento">
              Es el que figura debajo del QR, en la etiqueta del equipo.
            </p>

            {texto && (
              <div role="alert" className="mt-3 flex gap-3 rounded-[var(--radius-boton)] border border-rojo/50 bg-rojo/5 p-3 text-sm">
                <IconoAlerta className="mt-0.5 shrink-0 text-rojo" tamano={20} />
                <p>
                  No hay ningún equipo con el código{" "}
                  <Cifra className="whitespace-nowrap text-base">{texto.toUpperCase()}</Cifra>. Revisá que
                  esté bien escrito, con letras y números como en la etiqueta.
                </p>
              </div>
            )}
          </section>

          {parecidos.length > 0 && (
            <Planilla titulo="¿Es alguno de estos?">
              {parecidos.map((e) => (
                <FilaElemento key={e.id} elemento={e} />
              ))}
            </Planilla>
          )}

          <Planilla titulo="Vistos hace poco">
            {recientes.map((e) => (
              <FilaElemento key={e.id} elemento={e} />
            ))}
          </Planilla>
        </div>
      </div>
    </>
  );
}
