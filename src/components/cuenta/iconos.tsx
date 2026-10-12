// Iconos de la sección Más. Mismo trazo que src/components/iconos.tsx (24×24, 1,75, heredan el color).
import type { ReactNode } from "react";

type P = { tamano?: number; className?: string };

function Base({ tamano = 24, className, children }: P & { children: ReactNode }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Edificio con oficinas: clientes (empresas). */
export const IconoClientes = (p: P) => (
  <Base {...p}>
    <path d="M4 20.5V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v15.5" />
    <path d="M14 9.5h5a1 1 0 0 1 1 1v10" />
    <path d="M2.5 20.5h19" />
    <path d="M7.5 8h3M7.5 11.5h3M7.5 15h3M17 13.5v.01M17 16.5v.01" />
  </Base>
);

/** Dos personas: usuarios. */
export const IconoUsuarios = (p: P) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.25" />
    <path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" />
    <path d="M15.5 4.9a3.25 3.25 0 0 1 0 6.2M17.5 14.8c1.8.6 3 2.2 3.5 4.7" />
  </Base>
);

/** Tarjeta con agujero y renglones: el catálogo de controles. */
export const IconoCatalogo = (p: P) => (
  <Base {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1.5" />
    <circle cx="12" cy="6.5" r="1" />
    <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4" />
  </Base>
);

/** Camioneta: proveedores. */
export const IconoProveedores = (p: P) => (
  <Base {...p}>
    <path d="M2.5 6.5h11v10h-11z" />
    <path d="M13.5 9.5h4l3 3.5v3.5h-7" />
    <circle cx="6.5" cy="17.5" r="1.75" />
    <circle cx="17" cy="17.5" r="1.75" />
  </Base>
);

/** Muestras de color: el sistema de diseño. */
export const IconoMuestras = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <path d="M13.5 17h7M17 13.5v7" />
  </Base>
);

/** Puerta con flecha hacia afuera: cerrar sesión. */
export const IconoSalir = (p: P) => (
  <Base {...p}>
    <path d="M13.5 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7.5" />
    <path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5" />
  </Base>
);
