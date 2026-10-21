// Primer ingreso (o contraseña provisoria del admin): hasta que la persona elige la suya,
// la base no le muestra datos y la app la trae siempre acá.

import type { Metadata } from "next";
import { cerrarSesion } from "@/app/login/acciones";
import { FormularioClave } from "@/components/cuenta/formulario-clave";
import { MarcaSCP } from "@/components/ui";
import { exigirSesion } from "@/lib/sesion";

export const metadata: Metadata = { title: "Elegí tu contraseña" };

export default async function ElegirClave() {
  const usuario = await exigirSesion();
  const primerNombre = usuario.nombre.split(" ")[0];

  return (
    <div className="min-h-dvh bg-papel">
      <div className="mx-auto flex min-h-dvh max-w-[480px] flex-col px-4 pb-8 pt-12 sm:px-8">
        <header>
          <MarcaSCP className="text-[56px]" />
        </header>
        <main className="mt-10">
          <h1 className="titulo text-[28px]">Hola {primerNombre}, elegí tu contraseña</h1>
          <p className="mt-2 text-cemento">
            Entraste con una contraseña provisoria. Elegí una tuya para seguir: es la que vas a usar de ahora en más.
          </p>
          <p className="mb-6 mt-1 text-sm text-cemento">
            Cuenta: <span className="font-medium text-tinta [overflow-wrap:anywhere]">{usuario.email}</span>
          </p>
          <FormularioClave />
          <form action={cerrarSesion} className="mt-2">
            <button
              type="submit"
              className="inline-flex min-h-12 items-center font-medium underline decoration-junta decoration-2 underline-offset-4 hover:decoration-tinta"
            >
              Salir sin cambiarla
            </button>
          </form>
        </main>
      </div>
    </div>
  );
}
