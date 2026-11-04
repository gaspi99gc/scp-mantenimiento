// Clientes: la lista de empresas, con cuántos locales tienen y cuántos usuarios ven la app del cliente.
// Cada una lleva a su ficha, donde están sus locales y (para el admin) sus usuarios.

import type { Metadata } from "next";
import Link from "next/link";
import { IconoSiguiente } from "@/components/iconos";
import { CLASE_PLANILLA, Encabezado, Vacio, BotonLink } from "@/components/ui";
import { cargarDatos } from "@/lib/datos";
import { clienteServidor } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Clientes" };

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export default async function Clientes() {
  const { clientes, locales } = await cargarDatos();
  const db = await clienteServidor();
  const { data: membresias } = await db.from("membresia").select("perfil_id, cliente_id");
  const usuariosDe = (clienteId: string) =>
    new Set((membresias ?? []).filter((m) => m.cliente_id === clienteId).map((m) => m.perfil_id)).size;
  const lista = [...clientes].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  return (
    <>
      <Encabezado
        volver={{ href: "/s/mas", texto: "Más" }}
        titulo="Clientes"
        bajada="Tocá un cliente para ver sus locales y los usuarios que entran a su app."
      />
      {lista.length === 0 ? (
        <Vacio accion={<BotonLink href="/s/locales/nuevo">Agregar un local</BotonLink>}>
          Todavía no hay clientes. Se cargan al agregar su primer local.
        </Vacio>
      ) : (
        <ul className={`${CLASE_PLANILLA} mb-8`}>
          {lista.map((c) => {
            const nLocales = locales.filter((l) => l.clienteId === c.id).length;
            const nUsuarios = usuariosDe(c.id);
            return (
              <li key={c.id}>
                <Link href={`/s/clientes/${c.id}`} className="block transition-colors hover:bg-yeso/60 active:bg-yeso">
                  <div className="flex min-h-14 items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{c.nombre}</p>
                      <p className="mt-0.5 text-sm text-cemento">
                        {plural(nLocales, "local", "locales")}.{" "}
                        {nUsuarios === 0 ? "Sin usuarios en la app del cliente." : `${plural(nUsuarios, "usuario", "usuarios")} en la app del cliente.`}
                      </p>
                    </div>
                    <IconoSiguiente tamano={20} className="shrink-0 text-cemento" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
