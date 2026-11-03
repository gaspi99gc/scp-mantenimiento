export const dynamic = "force-dynamic";

import Link from "next/link";
import { cerrarSesion } from "@/app/login/acciones";
import { MarcaSCP } from "@/components/ui";
import { exigirCliente } from "@/lib/sesion";

// La app del cliente: solo lectura de sus locales. Exige sesión de un usuario de cliente activo
// (el proxy solo redirige por comodidad; la base, además, le muestra únicamente lo suyo).
// Sin barra de navegación: son pocas pantallas y todas salen del inicio.
export default async function LayoutCliente({ children }: { children: React.ReactNode }) {
  const usuario = await exigirCliente();
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-[2px] bg-tinta px-4 py-3 font-semibold text-papel focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Ir al contenido
      </a>
      <header className="bg-tinta text-hierro">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3 px-4 py-2.5 lg:max-w-[960px] lg:px-0">
          <Link
            href="/c"
            className="flex min-h-12 items-center gap-3 rounded-[2px] focus-visible:outline-papel"
            aria-label="SCP Mantenimiento integral, ir al inicio"
          >
            <MarcaSCP clara className="text-[26px]" />
            <span className="text-[14px] leading-tight">
              Mantenimiento
              <br />
              integral
            </span>
          </Link>
          <div className="flex items-center gap-1 text-[15px]">
            <span className="mr-2 hidden font-semibold text-papel sm:block">{usuario.nombre}</span>
            <form action={cerrarSesion}>
              <button className="min-h-12 rounded-[2px] px-3 font-medium hover:text-papel focus-visible:outline-papel">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="px-4 pb-16 outline-none lg:px-12">
        <div className="mx-auto max-w-[640px] lg:max-w-[960px]">{children}</div>
      </main>
    </>
  );
}
