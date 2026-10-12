export const dynamic = "force-dynamic";

import { Navegacion } from "@/components/navegacion";
import { supervisorActual } from "@/lib/datos";

export default function LayoutSupervisor({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navegacion nombre={supervisorActual.nombre} />
      <main className="mx-auto max-w-[640px] px-4 pb-40 lg:ml-60 lg:max-w-[880px] lg:px-10 lg:pb-16">{children}</main>
    </>
  );
}
