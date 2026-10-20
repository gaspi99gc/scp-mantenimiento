// Entrada a la app. Queda fuera del layout del supervisor: no hay navegación hasta que la persona entra.
// TODO(supabase): si ya hay sesión válida (getClaims), redirigir a /s. El registro público está desactivado.

import type { Metadata } from "next";
import { FormularioLogin, type PasoLogin } from "@/components/cuenta/formulario-login";
import { TarjetaPared, TiraMeses } from "@/components/cuenta/tarjeta-pared";
import { MarcaSCP } from "@/components/ui";

export const metadata: Metadata = { title: "Entrar" };

const PASOS: PasoLogin[] = ["credenciales", "codigo", "recuperar", "recuperado"];

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  // ?paso=codigo muestra el segundo paso del admin; ?error=1, el error de credenciales (para revisar los estados).
  const { paso, error } = await searchParams;
  const pasoInicial = PASOS.find((p) => p === paso) ?? "credenciales";

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
          <FormularioLogin key={pasoInicial} pasoInicial={pasoInicial} errorInicial={error === "1"} />
          <p className="mt-8 border-t border-junta pt-4 text-sm text-cemento">
            El acceso es solo por invitación. Si no tenés usuario, pedíselo a tu supervisor.
          </p>
        </main>
      </div>

      <aside className="hidden items-center justify-center px-12 py-24 lg:flex">
        <TarjetaPared />
      </aside>
    </div>
  );
}
