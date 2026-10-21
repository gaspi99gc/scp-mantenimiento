"use client";

// Navegación del supervisor: barra inferior en el celular, columna izquierda en la computadora.
// Las dos son un rótulo grabado: fondo tinta y letras claras, como las chapas de un tablero.
// Se lee al sol y no compite con los colores de estado, que viven en el papel.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoAgenda, IconoEscanear, IconoLocales, IconoMas } from "./iconos";
import { cx, MarcaSCP } from "./ui";

const ITEMS = [
  { href: "/s/agenda", texto: "Agenda", Icono: IconoAgenda },
  { href: "/s/escanear", texto: "Escanear", Icono: IconoEscanear, central: true },
  { href: "/s/locales", texto: "Locales", Icono: IconoLocales },
  { href: "/s/mas", texto: "Más", Icono: IconoMas },
];

function activo(path: string, href: string) {
  return path === href || path.startsWith(href + "/");
}

export function Navegacion({ nombre }: { nombre: string }) {
  const path = usePathname();

  return (
    <>
      {/* Celular */}
      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 z-30 bg-tinta pb-[env(safe-area-inset-bottom)] text-hierro lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-[640px] grid-cols-4">
          {ITEMS.map(({ href, texto, Icono, central }) => {
            const a = activo(path, href);
            return (
              <li key={href} className="flex">
                <Link
                  href={href}
                  aria-current={a ? "page" : undefined}
                  className={cx(
                    "relative flex flex-1 flex-col items-center justify-center gap-1 text-[13px] font-medium leading-none focus-visible:outline-papel focus-visible:-outline-offset-4",
                    a ? "text-papel" : "hover:text-papel",
                  )}
                >
                  {central ? (
                    <>
                      <span
                        className={cx(
                          "flex h-12 w-14 items-center justify-center rounded-[2px] bg-papel text-tinta",
                          a && "outline-2 outline-offset-2 outline-papel",
                        )}
                        aria-hidden
                      >
                        <Icono tamano={26} />
                      </span>
                      <span className="sr-only">{texto}</span>
                    </>
                  ) : (
                    <>
                      {a && <span aria-hidden className="absolute inset-x-3 top-0 h-[3px] bg-papel" />}
                      <Icono />
                      {texto}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Computadora */}
      <nav
        aria-label="Principal"
        className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-tinta px-4 pb-6 pt-7 text-hierro lg:flex"
      >
        <Link
          href="/s/agenda"
          className="mb-9 flex items-center gap-3 rounded-[2px] px-2 focus-visible:outline-papel"
          aria-label="SCP Mantenimiento integral, ir a la Agenda"
        >
          <MarcaSCP clara className="text-[30px]" />
          <span className="text-[14px] leading-tight">
            Mantenimiento
            <br />
            integral
          </span>
        </Link>
        <Link
          href="/s/escanear"
          aria-current={activo(path, "/s/escanear") ? "page" : undefined}
          className="mb-7 flex min-h-12 items-center gap-2.5 rounded-[2px] bg-papel px-3 font-semibold text-tinta hover:bg-white focus-visible:outline-papel"
        >
          <IconoEscanear tamano={22} />
          Escanear QR
        </Link>
        <ul className="space-y-0.5">
          {ITEMS.filter((i) => !i.central).map(({ href, texto, Icono }) => {
            const a = activo(path, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={a ? "page" : undefined}
                  className={cx(
                    "relative flex min-h-12 items-center gap-3 rounded-[2px] px-3 text-[17px] font-medium focus-visible:outline-papel",
                    a ? "bg-white/[0.09] text-papel" : "hover:bg-white/[0.05] hover:text-papel",
                  )}
                >
                  {a && <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] bg-papel" />}
                  <Icono tamano={22} />
                  {texto}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto border-t border-white/15 px-2 pt-4 text-sm">
          <div className="font-semibold text-papel">{nombre}</div>
          <div>Supervisor</div>
        </div>
      </nav>
    </>
  );
}
