// El estado de un documento con los mismos colores de seguridad que los controles (src/components/ui.tsx):
// vigente en verde, por vencer en amarillo, vencido en rojo. Lo que falta también va en rojo, con el
// borde en lugar del relleno, para distinguirlo de lo vencido; lo que no aplica, en gris.

import { cx } from "@/components/ui";
import type { EstadoDocumento } from "@/lib/documentos";
import type { EstadoControl } from "@/lib/tipos";

export const ESTADO_DOCUMENTO: Record<EstadoDocumento, { nombre: string; marca: string; cinta: EstadoControl }> = {
  vigente: { nombre: "Vigente", marca: "bg-verde text-papel", cinta: "al_dia" },
  por_vencer: { nombre: "Por vencer", marca: "bg-amarillo text-tinta", cinta: "pronto" },
  vencido: { nombre: "Vencido", marca: "bg-rojo text-papel", cinta: "vencido" },
  faltante: { nombre: "Falta", marca: "border border-rojo bg-papel text-rojo", cinta: "vencido" },
  no_aplica: { nombre: "No aplica", marca: "bg-junta text-tinta", cinta: "suspendido" },
  a_definir: { nombre: "A definir", marca: "border border-dashed border-tinta bg-papel text-tinta", cinta: "sin_datos" },
};

export function MarcaDocumento({ estado, className }: { estado: EstadoDocumento; className?: string }) {
  return (
    <span
      className={cx(
        "rotulo inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-[var(--radius-chip)] px-1.5 text-[14px]",
        ESTADO_DOCUMENTO[estado].marca,
        className,
      )}
    >
      {ESTADO_DOCUMENTO[estado].nombre}
    </span>
  );
}
