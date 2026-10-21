// Entrada a la app. Queda fuera del layout del supervisor: no hay navegación hasta que la persona entra.
// Si ya hay sesión, va directo a la app (o a elegir contraseña si todavía no la eligió).

import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FormularioLogin } from "@/components/cuenta/formulario-login";
import { TarjetaPared, TiraMeses } from "@/components/cuenta/tarjeta-pared";
import { MarcaSCP } from "@/components/ui";
import { destinoSeguro, usuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const { siguiente } = await searchParams;
  const usuario = await usuarioActual();
  if (usuario?.activo) redirect(usuario.debeCambiarClave ? "/cuenta/clave" : destinoSeguro(siguiente));

  const host = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  const ingresoRapido =
    process.env.NODE_ENV === "development" &&
    !!process.env.DEV_ADMIN_EMAIL &&
    !!process.env.DEV_ADMIN_PASSWORD &&
    ["localhost", "127.0.0.1", "[::1]"].includes(host);

  return (
    <div className="min-h-dvh bg-papel lg:grid lg:grid-cols-[minmax(480px,5fr)_7fr] lg:bg-yeso">
      <div className="flex min-h-dvh flex-col bg-papel px-4 pb-8 pt-12 sm:px-12 lg:border-r lg:border-junta lg:px-16 lg:pb-12 lg:pt-14">
        <header>
          <p>
            <MarcaSCP className="text-[80px] lg:text-[104px]" />
          </p>
          <p className="rotulo mt-3 text-[22px]">Mantenimiento integral</p>
          <TiraMeses className="mt-5 lg:hidden" />
        </header>

        <main className="mt-12 w-full max-w-[400px] lg:my-auto lg:py-12">
          <FormularioLogin
            siguiente={typeof siguiente === "string" ? siguiente : undefined}
            ingresoRapido={ingresoRapido}
          />
          <p className="mt-8 border-t border-junta pt-4 text-sm text-cemento">
            El acceso es solo por invitación. Si no tenés usuario, pedíselo al admin de SCP.
          </p>
        </main>
      </div>

      <aside className="hidden items-center justify-center px-12 py-24 lg:flex">
        <TarjetaPared />
      </aside>
    </div>
  );
}
