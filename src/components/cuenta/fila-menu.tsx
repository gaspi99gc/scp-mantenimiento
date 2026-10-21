// Fila de menú con icono. Si la sección todavía no existe, se ve igual pero sin link y con "Próximamente".
// Con `accion` (una Server Action) es un botón que la envía, como "Cerrar sesión".
import Link from "next/link";
import type { ReactNode } from "react";
import { IconoSiguiente } from "@/components/iconos";
import { cx } from "@/components/ui";

export function FilaMenu({
  href,
  icono,
  titulo,
  detalle,
  proximamente,
  accion,
}: {
  href?: string;
  accion?: () => Promise<void>;
  icono: ReactNode;
  titulo: string;
  detalle?: string;
  proximamente?: boolean;
}) {
  const contenido = (
    <div className="flex min-h-16 items-center gap-3.5 px-4 py-3">
      <span className={cx("shrink-0", proximamente ? "text-cemento" : "text-tinta")}>{icono}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={cx("font-semibold leading-snug", proximamente && "text-cemento")}>{titulo}</span>
          {proximamente && (
            <span className="rounded-[var(--radius-chip)] border border-junta px-1.5 text-xs font-medium leading-5 text-cemento">
              Próximamente
            </span>
          )}
        </div>
        {detalle && <div className="mt-0.5 text-sm text-cemento">{detalle}</div>}
      </div>
      {!proximamente && !accion && <IconoSiguiente tamano={20} className="shrink-0 text-cemento" />}
    </div>
  );

  return (
    <li>
      {accion ? (
        <form action={accion}>
          <button type="submit" className="block w-full text-left transition-colors hover:bg-yeso/60 active:bg-yeso">
            {contenido}
          </button>
        </form>
      ) : href && !proximamente ? (
        <Link href={href} className="block transition-colors hover:bg-yeso/60 active:bg-yeso">
          {contenido}
        </Link>
      ) : (
        <div aria-disabled="true">{contenido}</div>
      )}
    </li>
  );
}
