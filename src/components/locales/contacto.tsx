// Acciones de contacto de la ficha del local: llamar, WhatsApp y cómo llegar.
// Son enlaces comunes (tel:, wa.me, Google Maps): el celular abre la aplicación que corresponde.

import type { ReactNode } from "react";
import { IconoMapa, IconoTelefono, IconoWhatsapp } from "@/components/iconos";
import type { Local } from "@/lib/tipos";
import { enlacesContacto, primerNombre } from "./consultas";

function Accion({ href, icono, children, externo }: { href: string; icono: ReactNode; children: ReactNode; externo?: boolean }) {
  return (
    <li className="flex">
      <a
        href={href}
        {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex min-h-14 flex-1 flex-col items-center justify-start gap-1 rounded-[var(--radius-boton)] border border-tinta/25 bg-papel px-2 py-2.5 text-center text-sm font-semibold leading-tight text-tinta transition-colors hover:border-tinta/60 active:bg-yeso sm:min-h-12 sm:flex-none sm:flex-row sm:justify-center sm:gap-2 sm:px-4 sm:py-2 sm:text-base"
      >
        <span className="shrink-0">{icono}</span>
        {children}
      </a>
    </li>
  );
}

export function AccionesContacto({ local }: { local: Local }) {
  const enlaces = enlacesContacto(local);
  return (
    <ul className="mb-7 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap" aria-label="Contacto">
      <Accion href={enlaces.telefono} icono={<IconoTelefono tamano={20} />}>
        Llamar a {primerNombre(local.encargado.nombre)}
      </Accion>
      <Accion href={enlaces.whatsapp} icono={<IconoWhatsapp tamano={20} />} externo>
        WhatsApp
      </Accion>
      <Accion href={enlaces.mapa} icono={<IconoMapa tamano={20} />} externo>
        Cómo llegar
      </Accion>
    </ul>
  );
}
