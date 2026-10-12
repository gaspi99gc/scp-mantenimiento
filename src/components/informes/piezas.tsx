"use client";

// Piezas chicas del informe: placeholder de foto, código QR de verificación, interruptor y aviso.

import { create } from "qrcode";
import { useEffect, type ReactNode } from "react";
import { IconoAlerta, IconoCamara, IconoCheck, IconoCerrar } from "@/components/iconos";
import { cx } from "@/components/ui";

/** Ojo tachado: foto oculta para el cliente. Mismo trazo que los iconos compartidos. */
export function IconoOculta({ tamano = 24, className }: { tamano?: number; className?: string }) {
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
      <path d="M3 12s3.3-6 9-6c1.6 0 3 .5 4.2 1.2M21 12s-3.3 6-9 6c-1.6 0-3-.5-4.2-1.2" />
      <path d="M9.9 14.1a3 3 0 0 1 4.2-4.2" />
      <path d="M4 20L20 4" />
    </svg>
  );
}

/**
 * Lugar de una foto. Todavía no hay imágenes: un bloque rayado con la cámara y el número de foto.
 * TODO(supabase): mostrar la foto con una URL firmada de corta duración del bucket `adjuntos`.
 */
export function FotoPlaceholder({
  numero,
  oculta,
  className,
}: {
  numero: number;
  oculta?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cx(
        "rayado-suave relative aspect-[4/3] overflow-hidden rounded-[6px] border border-junta bg-papel",
        className,
      )}
    >
      <span className="absolute inset-0 m-auto flex size-10 items-center justify-center rounded-full border border-junta bg-papel text-cemento">
        <IconoCamara tamano={20} />
      </span>
      <span className="cifra absolute left-1.5 top-1.5 rounded-[3px] bg-papel px-1.5 text-sm leading-5 text-cemento">
        {numero}
      </span>
      {oculta && (
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-tinta px-2 py-1 text-xs font-medium text-papel">
          <IconoOculta tamano={14} />
          Oculta
        </span>
      )}
    </div>
  );
}

/** Texto que no corta códigos como "C-700112" o "SCP-2026-000118" al final de la línea. */
export function SinCortes({ texto }: { texto: string }) {
  const partes = texto.split(/([A-Z]{1,4}(?:-[0-9A-Z]+)+)/g);
  return (
    <>
      {partes.map((p, i) =>
        i % 2 ? (
          <span key={i} className="whitespace-nowrap">
            {p}
          </span>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** QR dibujado con el color del texto (sin colores sueltos). */
export function CodigoQR({ texto, tamano = 88, className }: { texto: string; tamano?: number; className?: string }) {
  const { modules } = create(texto, { errorCorrectionLevel: "M" });
  const n = modules.size;
  let d = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) if (modules.get(y, x)) d += `M${x} ${y}h1v1h-1z`;
  }
  return (
    <svg
      viewBox={`-1 -1 ${n + 2} ${n + 2}`}
      width={tamano}
      height={tamano}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label={`Código QR para verificar el informe en ${texto}`}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

/** Interruptor accesible (role="switch"). El estado se dice también con texto. */
export function Interruptor({
  activo,
  alCambiar,
  texto,
  ayuda,
}: {
  activo: boolean;
  alCambiar: (v: boolean) => void;
  texto: ReactNode;
  ayuda?: ReactNode;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => alCambiar(!activo)}
      className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[var(--radius-boton)] text-left"
    >
      <span className="min-w-0">
        <span className="block font-medium">{texto}</span>
        {ayuda && <span className="block text-sm text-cemento">{ayuda}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full border transition-colors",
          activo ? "border-tinta bg-tinta" : "border-cemento/60 bg-papel",
        )}
      >
        <span
          className={cx(
            "absolute top-[3px] size-5 rounded-full transition-transform",
            activo ? "translate-x-[23px] bg-papel" : "translate-x-[3px] bg-cemento",
          )}
        />
      </span>
    </button>
  );
}

/**
 * Aviso de confirmación ("Informe publicado…"). Queda abajo, arriba de la barra de acción en el celular.
 * Se va solo a los 6 segundos o con la cruz.
 */
export interface AvisoTexto {
  texto: string;
  /** "ok" confirma algo que se hizo (con el tilde verde); "info" solo avisa. */
  tono?: "ok" | "info";
}

export function Aviso({ aviso, alCerrar }: { aviso: AvisoTexto | null; alCerrar: () => void }) {
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(alCerrar, 6000);
    return () => clearTimeout(t);
  }, [aviso, alCerrar]);

  return (
    <div aria-live="polite" role="status">
      {aviso && (
        <div className="animate-subir fixed inset-x-4 bottom-[calc(64px+84px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-[608px] items-start gap-3 rounded-[var(--radius-boton)] bg-tinta py-3 pl-3 pr-1.5 text-papel lg:inset-x-auto lg:bottom-6 lg:left-[calc(240px+40px)] lg:mx-0 lg:w-[520px]">
          {aviso.tono === "info" ? (
            <IconoAlerta tamano={22} className="mt-px shrink-0" />
          ) : (
            <span className="mt-px flex size-6 shrink-0 items-center justify-center rounded-full bg-verde">
              <IconoCheck tamano={16} />
            </span>
          )}
          <p className="min-w-0 flex-1 py-px font-medium">{aviso.texto}</p>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar aviso"
            className="-my-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-md text-papel/80 hover:text-papel focus-visible:outline-papel"
          >
            <IconoCerrar tamano={18} />
          </button>
        </div>
      )}
    </div>
  );
}
