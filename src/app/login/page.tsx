// Entrada a la app. Queda fuera del layout del supervisor: no hay navegación hasta que la persona entra.
// Si ya hay sesión, va directo a la app.

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
  const { siguiente, cambio } = await searchParams;
  const usuario = await usuarioActual();
  if (usuario?.activo) redirect(destinoSeguro(siguiente, usuario.rol));

  const host = ((await headers()).get("host") ?? "").replace(/:\d+$/, "");
  const ingresoRapido =
    process.env.NODE_ENV === "development" &&
    !!process.env.DEV_ADMIN_EMAIL &&
    !!process.env.DEV_ADMIN_PASSWORD &&
    ["localhost", "127.0.0.1", "[::1]"].includes(host);

  return (
    <div className="min-h-dvh bg-papel lg:grid lg:grid-cols-[minmax(480px,5fr)_7fr] lg:bg-yeso">
      {/* En el celular entra todo en una pantalla, sin scroll; en las pantallas bajas se esconde la tira de meses. */}
      <div className="flex min-h-dvh flex-col bg-papel px-4 pb-6 pt-6 sm:px-12 lg:border-r lg:border-junta lg:px-16 lg:pb-12 lg:pt-14">
        <header>
          <p>
            <MarcaSCP className="text-[56px] lg:text-[104px]" />
          </p>
          <p className="rotulo mt-2 text-[20px] lg:mt-3 lg:text-[22px]">Mantenimiento integral</p>
          <TiraMeses className="mt-3 lg:hidden [@media(max-height:620px)]:hidden" />
        </header>

        <main className="mt-6 w-full max-w-[400px] lg:my-auto lg:py-12">
          {cambio === "1" && (
            <p role="status" className="mb-6 rounded-[var(--radius-planilla)] border-2 border-verde bg-papel p-3 text-sm font-medium">
              Cambiaste tu contraseña. Entrá de nuevo con la nueva.
            </p>
          )}
          <FormularioLogin
            siguiente={typeof siguiente === "string" ? siguiente : undefined}
            ingresoRapido={ingresoRapido}
          />
        </main>
      </div>

      <aside className="hidden items-center justify-center px-12 py-24 lg:flex">
        <TarjetaPared />
      </aside>
    </div>
  );
}
