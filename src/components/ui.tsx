// Piezas de interfaz compartidas. Ver docs/diseno.md antes de agregar variantes.
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { EstadoControl } from "@/lib/tipos";
import { IconoAtras } from "./iconos";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ——— Estados ———

export const ESTADO: Record<EstadoControl, { nombre: string; cinta: string; banda: string; textoBanda: string }> = {
  vencido: { nombre: "Vencido", cinta: "bg-rojo", banda: "bg-rojo", textoBanda: "text-papel" },
  pronto: { nombre: "Vence pronto", cinta: "bg-amarillo", banda: "bg-amarillo", textoBanda: "text-tinta" },
  al_dia: { nombre: "Al día", cinta: "bg-verde", banda: "bg-verde", textoBanda: "text-papel" },
  sin_datos: { nombre: "Sin datos", cinta: "rayado", banda: "rayado-suave bg-papel", textoBanda: "text-tinta" },
  suspendido: { nombre: "Suspendido", cinta: "bg-junta", banda: "bg-junta", textoBanda: "text-tinta" },
};

/** Cinta vertical de 4 px que marca el estado al borde de una fila. */
export function Cinta({ estado, className }: { estado: EstadoControl; className?: string }) {
  return <span aria-hidden className={cx("block w-1 self-stretch rounded-full", ESTADO[estado].cinta, className)} />;
}

/** Marca chica de estado con texto (el estado nunca va solo con color). */
export function MarcaEstado({ estado, className }: { estado: EstadoControl; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-sm font-medium", className)}>
      <span aria-hidden className={cx("inline-block size-2.5 rounded-[3px]", ESTADO[estado].cinta)} />
      {ESTADO[estado].nombre}
    </span>
  );
}

// ——— Texto ———

/** Fechas y cifras en Archivo condensada. */
export function Cifra({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("cifra", className)}>{children}</span>;
}

// ——— Botones ———

type Variante = "primario" | "secundario" | "peligro" | "fantasma" | "sobreOscuro";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-tinta text-papel hover:bg-tinta/90 active:bg-tinta/80",
  secundario: "bg-papel text-tinta border border-tinta/25 hover:border-tinta/60 active:bg-yeso",
  peligro: "bg-papel text-rojo border border-rojo/40 hover:border-rojo active:bg-rojo/5",
  fantasma: "text-tinta hover:bg-tinta/5 active:bg-tinta/10",
  // Para usar sobre una franja `bg-tinta`: botón claro y foco claro
  sobreOscuro: "bg-papel text-tinta hover:bg-papel/90 active:bg-papel/80 focus-visible:outline-papel",
};

/** Clases de botón, para enlaces externos (tel:, wa.me) que no pueden ser <Link>. */
export const claseBoton = (variante: Variante = "primario", ancho?: boolean) =>
  cx(BASE_BOTON, VARIANTES[variante], ancho && "w-full");

const BASE_BOTON =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-boton)] px-4 text-base font-semibold " +
  "transition-colors disabled:pointer-events-none disabled:opacity-45";

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
        "inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-[var(--radius-chip)] border px-3 text-sm font-medium transition-colors",
        activo ? "border-tinta bg-tinta text-papel" : "border-junta bg-papel text-tinta hover:border-tinta/50",
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
    <header className="pt-4 pb-5 lg:pt-8">
      {volver && (
        <Link
          href={volver.href}
          className="-ml-1.5 mb-2 inline-flex min-h-10 items-center gap-1 rounded-md pr-2 text-sm font-medium text-cemento hover:text-tinta"
        >
          <IconoAtras tamano={18} />
          {volver.texto}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="titulo text-2xl lg:text-3xl text-balance">{titulo}</h1>
          {bajada && <div className="mt-1.5 text-cemento">{bajada}</div>}
        </div>
        {acciones && <div className="flex shrink-0 gap-2">{acciones}</div>}
      </div>
      {children}
    </header>
  );
}

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
    <section className={cx("mb-7", className)}>
      {(titulo || aparte) && (
        <div className="mb-2 flex items-end justify-between gap-3 px-0.5">
          {titulo && <h2 className="text-lg font-[650] leading-tight">{titulo}</h2>}
          {aparte && <div className="shrink-0 text-sm text-cemento">{aparte}</div>}
        </div>
      )}
      <ul className="overflow-hidden rounded-[var(--radius-planilla)] border border-junta bg-papel divide-y divide-junta">
        {children}
      </ul>
    </section>
  );
}

/**
 * Fila de planilla: cinta de estado a la izquierda, qué y dónde en el medio, fecha a la derecha.
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
    <div className="flex min-h-14 items-stretch gap-3 px-3 py-3">
      {estado ? <Cinta estado={estado} /> : <span className="w-1" aria-hidden />}
      <div className="min-w-0 flex-1">
        <div className="font-semibold leading-snug">{titulo}</div>
        {detalle && <div className="mt-0.5 text-sm text-cemento">{detalle}</div>}
        {debajo && <div className="mt-2">{debajo}</div>}
      </div>
      {derecha && <div className="flex shrink-0 flex-col items-end justify-center text-right">{derecha}</div>}
    </div>
  );
  return (
    <li>
      {href ? (
        <Link href={href} className="block transition-colors hover:bg-yeso/60 active:bg-yeso">
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
      <Cifra className="text-xl leading-none">{fecha}</Cifra>
      {relativo && (
        <span className={cx("mt-1 text-xs font-medium", tono === "rojo" ? "text-rojo" : "text-cemento")}>{relativo}</span>
      )}
    </>
  );
}

/** Estado vacío: invita a hacer algo. */
export function Vacio({ children, accion }: { children: ReactNode; accion?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-planilla)] border border-dashed border-junta px-4 py-6 text-cemento">
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
    <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 border-t border-junta bg-papel/95 px-4 py-3 backdrop-blur lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
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
