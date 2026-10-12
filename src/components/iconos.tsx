// Iconos de trazo, 24×24, heredan el color del texto. Dibujados a mano para no depender de una librería.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { tamano?: number };

function Base({ tamano = 24, children, ...rest }: P & { children: React.ReactNode }) {
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
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconoHoy = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <rect x="7.5" y="12.5" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" />
  </Base>
);

export const IconoAgenda = (p: P) => (
  <Base {...p}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle cx="4.5" cy="6" r="1.25" />
    <circle cx="4.5" cy="12" r="1.25" />
    <circle cx="4.5" cy="18" r="1.25" />
  </Base>
);

export const IconoEscanear = (p: P) => (
  <Base {...p}>
    <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
    <rect x="8" y="8" width="3" height="3" />
    <rect x="13" y="8" width="3" height="3" />
    <rect x="8" y="13" width="3" height="3" />
    <path d="M13 13h3v3" />
  </Base>
);

export const IconoLocales = (p: P) => (
  <Base {...p}>
    <path d="M4 10v10h16V10" />
    <path d="M3 10l1.5-5h15L21 10c0 1.4-1.1 2.5-2.5 2.5S16 11.4 16 10c0 1.4-1.1 2.5-2.5 2.5h-3C9.1 12.5 8 11.4 8 10c0 1.4-1.1 2.5-2.5 2.5S3 11.4 3 10z" />
    <path d="M10 20v-4.5h4V20" />
  </Base>
);

export const IconoMas = (p: P) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Base>
);

export const IconoAtras = (p: P) => (
  <Base {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Base>
);

export const IconoSiguiente = (p: P) => (
  <Base {...p}>
    <path d="M9 5l7 7-7 7" />
  </Base>
);

export const IconoCerrar = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

export const IconoCamara = (p: P) => (
  <Base {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
    <circle cx="12" cy="13" r="3.5" />
  </Base>
);

export const IconoCheck = (p: P) => (
  <Base {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Base>
);

export const IconoTelefono = (p: P) => (
  <Base {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a10 10 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2z" />
  </Base>
);

export const IconoMapa = (p: P) => (
  <Base {...p}>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.25" />
  </Base>
);

export const IconoSumar = (p: P) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
);

export const IconoAlerta = (p: P) => (
  <Base {...p}>
    <path d="M12 4l9 16H3z" />
    <path d="M12 10v4.5M12 17.5v.01" />
  </Base>
);

export const IconoDocumento = (p: P) => (
  <Base {...p}>
    <path d="M7 3.5h7l4.5 4.5v12a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z" />
    <path d="M14 3.5V8h4.5M9.5 12.5h5M9.5 16h5" />
  </Base>
);

export const IconoLlave = (p: P) => (
  <Base {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2" />
  </Base>
);

export const IconoReloj = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);

export const IconoWhatsapp = (p: P) => (
  <Base {...p}>
    <path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 8.6 18.6z" />
    <path d="M9.2 8.6c.3-.6.9-.6 1.2 0l.6 1.4c.1.3 0 .6-.2.8l-.5.5a5.5 5.5 0 0 0 2.4 2.4l.5-.5c.2-.2.5-.3.8-.2l1.4.6c.6.3.6.9 0 1.2-1.6 1-5.2-.8-6.2-3.3-.4-1.1-.4-2.2 0-2.9z" />
  </Base>
);

export const IconoHerramienta = (p: P) => (
  <Base {...p}>
    <path d="M14.5 5.5a4 4 0 0 0 4.9 4.9l-9.1 9.1a2 2 0 0 1-2.8-2.8z" />
    <path d="M14.5 5.5L17 3l4 4-2.5 2.5" />
  </Base>
);

export const IconoBuscar = (p: P) => (
  <Base {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5 5" />
  </Base>
);
