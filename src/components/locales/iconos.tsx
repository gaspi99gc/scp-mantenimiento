// Iconos que solo usan las pantallas de locales. Mismo trazo que src/components/iconos.tsx.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { tamano?: number };

export const IconoBuscar = ({ tamano = 24, ...rest }: P) => (
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
    {...rest}
  >
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </svg>
);
