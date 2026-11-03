// Catálogo de controles: la regla de cada control (cada cuánto, desde cuándo, con cuánto aviso).
// Lo ve todo el staff; solo el admin lo edita.

import type { Metadata } from "next";
import Link from "next/link";
import { fichaCatalogo } from "@/components/cuenta/catalogo";
import { IconoSiguiente, IconoSumar } from "@/components/iconos";
import { BotonLink, CLASE_PLANILLA, cx, Encabezado, TituloPlanilla } from "@/components/ui";
import { exigirStaff } from "@/lib/sesion";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Catálogo de controles" };

export default async function Catalogo() {
  const usuario = await exigirStaff();
  const esAdmin = usuario.rol === "admin";
  const db = await clienteServidor();
  const [{ data: tipos }, { data: vinculos }, { data: equipos }] = await Promise.all([
    db.from("tipo_control").select("*").order("nombre"),
    db.from("tipo_control_equipo").select("tipo_control_id, tipo_equipo_id"),
    db.from("tipo_equipo").select("id, nombre"),
  ]);
  const nombreEquipo = new Map((equipos ?? []).map((e) => [e.id, e.nombre]));
  const fichas = (tipos ?? []).map((t) =>
    fichaCatalogo(
      t,
      (vinculos ?? [])
        .filter((v) => v.tipo_control_id === t.id)
        .map((v) => nombreEquipo.get(v.tipo_equipo_id) ?? "")
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "es")),
    ),
  );
  const activos = fichas.filter((f) => f.activo);
  const inactivos = fichas.filter((f) => !f.activo);

  const lista = (items: typeof fichas) => (
    <ul className={CLASE_PLANILLA}>
      {items.map((f) => {
        const contenido = (
          <div className="flex min-h-14 items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug">{f.nombre}</p>
              <p className="mt-0.5 text-sm text-cemento">{f.aplicaA}</p>
              <p className="mt-0.5 text-sm">
                {f.periodo}, {f.base}. Aviso {f.aviso === 1 ? "1 día" : `${f.aviso} días`} antes.
                {f.quien === "Un tercero" ? " Lo hace un tercero" : " Lo hace SCP"}
                {f.norma ? ` (${f.norma}).` : "."}
              </p>
            </div>
            {esAdmin && <IconoSiguiente tamano={20} className="shrink-0 text-cemento" />}
          </div>
        );
        return (
          <li key={f.id} className={cx(!f.activo && "text-cemento")}>
            {esAdmin ? (
              <Link
                href={`/s/mas/catalogo/${f.id}`}
                aria-label={`Editar ${f.nombre}`}
                className="block transition-colors hover:bg-yeso/60 active:bg-yeso"
              >
                {contenido}
              </Link>
            ) : (
              contenido
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <Encabezado
        volver={{ href: "/s/mas", texto: "Más" }}
        titulo="Catálogo de controles"
        bajada="Cada cuánto se hace cada control, desde cuándo se cuenta y con cuánto aviso."
        acciones={
          esAdmin && (
            <BotonLink href="/s/mas/catalogo/nuevo" variante="secundario" className="px-3">
              <IconoSumar tamano={20} />
              Agregar<span className="sr-only sm:not-sr-only sm:-ml-1"> control</span>
            </BotonLink>
          )
        }
      />

      <p className="mb-3 text-sm text-cemento">
        {activos.length} controles activos.{" "}
        {esAdmin ? "Tocá uno para editarlo." : "Solo el admin los puede editar."} Un cambio de período rige desde la
        próxima vez que se registra.
      </p>

      <section className="mb-8">{lista(activos)}</section>

      {inactivos.length > 0 && (
        <section className="mb-8" aria-labelledby="inactivos">
          <TituloPlanilla id="inactivos" titulo="Desactivados" />
          {lista(inactivos)}
        </section>
      )}
    </>
  );
}
