export const dynamic = "force-dynamic";

import { Navegacion } from "@/components/navegacion";
import { supervisorActual } from "@/lib/datos";

// En la computadora el contenido se centra en el espacio que deja la columna, con márgenes iguales a los dos lados.
export default function LayoutSupervisor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-[2px] bg-tinta px-4 py-3 font-semibold text-papel focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Ir al contenido
      </a>
      <Navegacion nombre={supervisorActual.nombre} />
      <main id="contenido" tabIndex={-1} className="px-4 pb-40 outline-none lg:ml-60 lg:px-12 lg:pb-16">
        <div className="mx-auto max-w-[640px] lg:max-w-[960px]">{children}</div>
      </main>
    </>
  );
}
