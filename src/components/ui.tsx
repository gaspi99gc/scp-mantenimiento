// Piezas de interfaz compartidas. Ver docs/propuesta-visual.md antes de agregar variantes.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { EstadoControl } from "@/lib/tipos";
import { IconoAtras } from "./iconos";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ——— Estados ———
// Los colores de seguridad se usan como en un cartel: el color de fondo con su color de contraste encima
// (blanco sobre rojo y verde, negro sobre amarillo). Nunca como texto suelto, salvo el rojo de "venció".

export const ESTADO: Record<
  EstadoControl,
  { nombre: string; cinta: string; banda: string; textoBanda: string; marca: string }
> = {
  vencido: { nombre: "Vencido", cinta: "bg-rojo", banda: "bg-rojo", textoBanda: "text-papel", marca: "bg-rojo text-papel" },
  pronto: {
    nombre: "Vence pronto",
    cinta: "bg-amarillo",
    banda: "bg-amarillo",
    textoBanda: "text-tinta",
    marca: "bg-amarillo text-tinta",
  },
  al_dia: { nombre: "Al día", cinta: "bg-verde", banda: "bg-verde", textoBanda: "text-papel", marca: "bg-verde text-papel" },
  sin_datos: {
    nombre: "Sin datos",
    cinta: "rayado",
    banda: "rayado-suave bg-papel",
    textoBanda: "text-tinta",
    marca: "border border-dashed border-tinta bg-papel text-tinta",
  },
  suspendido: {
    nombre: "Suspendido",
    cinta: "bg-junta",
    banda: "bg-junta",
    textoBanda: "text-tinta",
    marca: "bg-junta text-tinta",
  },
};

/** Canto de estado: la franja de 6 px pegada al borde izquierdo de una fila, de punta a punta. */
export function Cinta({ estado, className }: { estado: EstadoControl; className?: string }) {
  return <span aria-hidden className={cx("block w-1.5 shrink-0 self-stretch", ESTADO[estado].cinta, className)} />;
}

/** Rótulo de estado, como un cartel de seguridad: el nombre del estado sobre su color. */
export function MarcaEstado({ estado, className }: { estado: EstadoControl; className?: string }) {
  return (
    <span
      className={cx(
        "rotulo inline-flex h-6 items-center whitespace-nowrap rounded-[var(--radius-chip)] px-1.5 text-[14px]",
        ESTADO[estado].marca,
        className,
      )}
    >
      {ESTADO[estado].nombre}
    </span>
  );
}

// ——— Texto ———

/** Fechas y cifras en Barlow Condensed. */
export function Cifra({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("cifra", className)}>{children}</span>;
}

/** Código del equipo como en la chapa de identificación que lleva pegada. */
export function Chapa({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span translate="no" className={cx("chapa", className)}>
      {children}
    </span>
  );
}

/** La marca: "SCP" grabado en una chapa. */
export function MarcaSCP({ clara, className }: { clara?: boolean; className?: string }) {
  return (
    <span
      translate="no"
      className={cx(
        "inline-flex items-center rounded-[2px] px-[0.22em] pb-[0.06em] pt-[0.12em] font-cond font-bold leading-none tracking-[0.02em]",
        clara ? "bg-papel text-tinta" : "bg-tinta text-papel",
        className,
      )}
    >
      SCP
    </span>
  );
}

// ——— Botones ———

type Variante = "primario" | "secundario" | "peligro" | "fantasma" | "sobreOscuro";

// Deshabilitado: queda como un casillero sin completar (borde de trazos), no como un botón gris borroso.
const SIN_COMPLETAR = "disabled:border disabled:border-dashed disabled:border-cemento disabled:bg-transparent disabled:text-cemento";

const VARIANTES: Record<Variante, string> = {
  primario: cx("bg-tinta text-papel hover:bg-[#2b2f34] active:bg-black", SIN_COMPLETAR),
  secundario: cx("border border-tinta bg-papel text-tinta hover:bg-yeso/70 active:bg-yeso", SIN_COMPLETAR),
  peligro: cx("border border-rojo bg-papel text-rojo hover:bg-rojo/[0.06] active:bg-rojo/10", SIN_COMPLETAR),
  fantasma: "text-tinta hover:bg-tinta/[0.06] active:bg-tinta/10 disabled:text-cemento",
  // Para usar sobre una franja `bg-tinta`: botón claro y foco claro
  sobreOscuro: "bg-papel text-tinta hover:bg-white active:bg-yeso focus-visible:outline-papel disabled:opacity-60",
};

/** Clases de botón, para enlaces externos (tel:, wa.me) que no pueden ser <Link>. */
export const claseBoton = (variante: Variante = "primario", ancho?: boolean) =>
  cx(BASE_BOTON, VARIANTES[variante], ancho && "w-full");

const BASE_BOTON =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-boton)] px-4 text-base font-semibold " +
  "transition-[background-color,border-color,color] select-none disabled:pointer-events-none";

export function Boton({
  variante = "primario",
  ancho,
  className,
  ...rest
}: ComponentProps<"button"> & { variante?: Variante; ancho?: boolean }) {
  return <button className={cx(BASE_BOTON, VARIANTES[variante], ancho && "w-full", className)} {...rest} />;
}

export function BotonLink({
  variante = "primario",
  ancho,
  className,
  ...rest
}: ComponentProps<typeof Link> & { variante?: Variante; ancho?: boolean }) {
  return <Link className={cx(BASE_BOTON, VARIANTES[variante], ancho && "w-full", className)} {...rest} />;
}

/** Chip de filtro. `activo` lo marca como elegido. */
export function Chip({
  activo,
  className,
  ...rest
}: ComponentProps<"button"> & { activo?: boolean }) {
  return (
    <button
      aria-pressed={activo}
      className={cx(
        "inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-[var(--radius-chip)] border px-3 text-[15px] font-medium transition-colors",
        activo ? "border-tinta bg-tinta text-papel" : "border-tinta/30 bg-papel text-tinta hover:border-tinta",
        className,
      )}
      {...rest}
    />
  );
}

// ——— Estructura de pantalla ———

export function Encabezado({
  titulo,
  bajada,
  volver,
  acciones,
  children,
}: {
  titulo: ReactNode;
  bajada?: ReactNode;
  volver?: { href: string; texto: string };
  acciones?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="pt-4 pb-6 lg:pt-10 lg:pb-8">
      {volver && (
        <Link
          href={volver.href}
          className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-boton)] pl-1 pr-2 text-[15px] font-medium text-cemento hover:text-tinta"
        >
          <IconoAtras tamano={18} />
          {volver.texto}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="titulo text-[30px] text-balance lg:text-[40px]">{titulo}</h1>
          {bajada && <div className="mt-2 text-[17px] leading-snug text-cemento">{bajada}</div>}
        </div>
        {acciones && <div className="flex shrink-0 gap-2">{acciones}</div>}
      </div>
      {children}
    </header>
  );
}

/** Título de bloque: el rótulo de la planilla, con un dato a la derecha si hace falta. */
export function TituloPlanilla({
  id,
  titulo,
  aparte,
  como: Como = "h2",
}: {
  id?: string;
  titulo?: ReactNode;
  aparte?: ReactNode;
  como?: "h2" | "h3";
}) {
  return (
    <div className="mb-2 flex items-end justify-between gap-3">
      {titulo && (
        <Como id={id} className="rotulo text-xl">
          {titulo}
        </Como>
      )}
      {aparte && <div className="shrink-0 pb-0.5 text-sm text-cemento">{aparte}</div>}
    </div>
  );
}

/** La hoja de la planilla: papel, renglones finos y el filete grueso arriba, como un formulario impreso. */
export const CLASE_PLANILLA =
  "overflow-hidden rounded-[var(--radius-planilla)] border border-junta border-t-tinta border-t-2 bg-papel divide-y divide-junta";

/** Bloque de filas: la "planilla". */
export function Planilla({
  titulo,
  aparte,
  children,
  className,
}: {
  titulo?: ReactNode;
  aparte?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx("mb-8", className)}>
      {(titulo || aparte) && <TituloPlanilla titulo={titulo} aparte={aparte} />}
      <ul className={CLASE_PLANILLA}>{children}</ul>
    </section>
  );
}

/**
 * Fila de planilla: canto de estado pegado al borde izquierdo, qué y dónde en el medio, fecha a la derecha.
 * Si tiene `href` es navegable.
 */
export function Fila({
  href,
  estado,
  titulo,
  detalle,
  derecha,
  debajo,
}: {
  href?: string;
  estado?: EstadoControl;
  titulo: ReactNode;
  detalle?: ReactNode;
  derecha?: ReactNode;
  debajo?: ReactNode;
}) {
  const contenido = (
    <div className="flex min-h-14 items-stretch">
      {estado && <Cinta estado={estado} />}
      <div className={cx("flex min-w-0 flex-1 items-start gap-3 py-3 pr-4", estado ? "pl-3.5" : "pl-4")}>
        <div className="min-w-0 flex-1">
          <div className="font-semibold leading-snug">{titulo}</div>
          {detalle && <div className="mt-0.5 text-[15px] leading-snug text-cemento">{detalle}</div>}
          {debajo && <div className="mt-2">{debajo}</div>}
        </div>
        {derecha && <div className="flex shrink-0 flex-col items-end text-right">{derecha}</div>}
      </div>
    </div>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="block transition-colors hover:bg-yeso/45 active:bg-yeso">
          {contenido}
        </Link>
      ) : (
        contenido
      )}
    </li>
  );
}

/** Fecha a la derecha de una fila: la cifra grande y, abajo, el texto relativo. */
export function FechaFila({ fecha, relativo, tono }: { fecha: string; relativo?: string; tono?: "rojo" | "normal" }) {
  return (
    <>
      <Cifra className="text-[26px] leading-none">{fecha}</Cifra>
      {relativo && (
        <span
          className={cx(
            "mt-1 whitespace-nowrap text-[13px] font-medium leading-tight",
            tono === "rojo" ? "font-semibold text-rojo" : "text-cemento",
          )}
        >
          {relativo}
        </span>
      )}
    </>
  );
}

/** Estado vacío: un renglón en blanco del formulario, que invita a hacer algo. */
export function Vacio({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-planilla)] border border-dashed border-cemento/60 bg-papel/50 px-4 py-5 text-cemento">
      <p className="max-w-prose">{children}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );
}

/**
 * Barra de acción principal. En el celular queda fija abajo, arriba de la navegación;
 * en la computadora queda en el flujo, al final del contenido.
 */
export function BarraAccion({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 border-t-2 border-tinta bg-papel px-4 py-3 lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0">
      <div className="mx-auto flex max-w-[640px] gap-2 lg:mx-0 lg:max-w-none">{children}</div>
    </div>
  );
}

/** Dato con rótulo, para fichas: "Horario de acceso" / "Lunes a sábado de 6 a 21 h". */
export function Dato({ rotulo, children, icono }: { rotulo: string; children: ReactNode; icono?: ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      {icono && <span className="mt-0.5 text-cemento">{icono}</span>}
      <div className="min-w-0">
        <div className="text-sm text-cemento">{rotulo}</div>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
