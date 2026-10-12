"use client";

// Navegación del supervisor: barra inferior en el celular, columna izquierda en la computadora.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoAgenda, IconoEscanear, IconoHoy, IconoLocales, IconoMas } from "./iconos";
import { cx } from "./ui";

const ITEMS = [
  { href: "/s", texto: "Hoy", Icono: IconoHoy, exacto: true },
  { href: "/s/agenda", texto: "Agenda", Icono: IconoAgenda },
  { href: "/s/escanear", texto: "Escanear", Icono: IconoEscanear, central: true },
  { href: "/s/locales", texto: "Locales", Icono: IconoLocales },
  { href: "/s/mas", texto: "Más", Icono: IconoMas },
];

function activo(path: string, href: string, exacto?: boolean) {
  return exacto ? path === href : path === href || path.startsWith(href + "/");
}

export function Navegacion({ nombre }: { nombre: string }) {
  const path = usePathname();

  return (
    <>
      {/* Celular */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-junta bg-papel pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-[640px] grid-cols-5">
          {ITEMS.map(({ href, texto, Icono, exacto, central }) => {
            const a = activo(path, href, exacto);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={a ? "page" : undefined}
                  className={cx(
                    "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium",
                    central ? "text-papel" : a ? "text-tinta" : "text-cemento",
                  )}
                >
                  {central ? (
                    <span className="flex size-12 items-center justify-center rounded-[10px] bg-tinta" aria-hidden>
                      <Icono />
                    </span>
                  ) : (
                    <>
                      <span className={cx("flex h-7 w-12 items-center justify-center rounded-full", a && "bg-yeso")}>
                        <Icono />
                      </span>
                      {texto}
                    </>
                  )}
                  {central && <span className="sr-only">{texto}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Computadora */}
      <nav
        aria-label="Principal"
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-junta bg-papel px-3 py-6 lg:flex"
      >
        <Link href="/s" className="mb-8 px-3">
          <span className="titulo block text-3xl [font-stretch:62%]">SCP</span>
          <span className="block text-sm text-cemento">Mantenimiento integral</span>
        </Link>
        <Link
          href="/s/escanear"
          className="mb-6 flex min-h-12 items-center gap-2.5 rounded-[var(--radius-boton)] bg-tinta px-3 font-semibold text-papel hover:bg-tinta/90"
        >
          <IconoEscanear tamano={22} />
          Escanear QR
        </Link>
        <ul className="space-y-1">
          {ITEMS.filter((i) => !i.central).map(({ href, texto, Icono, exacto }) => {
            const a = activo(path, href, exacto);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={a ? "page" : undefined}
                  className={cx(
                    "flex min-h-11 items-center gap-3 rounded-[var(--radius-boton)] px-3 font-medium",
                    a ? "bg-yeso text-tinta" : "text-cemento hover:text-tinta",
                  )}
                >
                  <Icono tamano={22} />
                  {texto}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto px-3 text-sm">
          <div className="font-semibold">{nombre}</div>
          <div className="text-cemento">Supervisor</div>
        </div>
      </nav>
    </>
  );
}
