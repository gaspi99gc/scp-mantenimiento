"use client";

// Pad de firma con el dedo. Usa pointer events (dedo, lápiz o mouse) y guarda los trazos
// normalizados para redibujarlos si cambia el tamaño (por ejemplo, al girar el celular).

import { useCallback, useEffect, useRef } from "react";
import { cx } from "@/components/ui";

type Punto = { x: number; y: number };

export function PadFirma({
  trazos,
  alCambiar,
  etiqueta,
}: {
  /** Trazos de la firma (coordenadas de 0 a 1). Los guarda la pantalla para no perderlos. */
  trazos: Punto[][];
  alCambiar: (trazos: Punto[][]) => void;
  etiqueta: string;
}) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const actual = useRef<Punto[] | null>(null);
  const todos = useRef<Punto[][]>(trazos);

  const pincel = useCallback(() => {
    const c = lienzo.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return null;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // El color sale de la clase text-tinta del canvas: así no hay colores sueltos.
    ctx.strokeStyle = getComputedStyle(c).color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return { c, ctx, ancho: c.clientWidth, alto: c.clientHeight };
  }, []);

  const redibujar = useCallback(() => {
    const p = pincel();
    if (!p) return;
    const { ctx, ancho, alto } = p;
    ctx.clearRect(0, 0, ancho, alto);
    for (const t of todos.current) {
      if (t.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(t[0].x * ancho, t[0].y * alto);
      if (t.length === 1) ctx.lineTo(t[0].x * ancho + 0.1, t[0].y * alto + 0.1);
      for (const q of t.slice(1)) ctx.lineTo(q.x * ancho, q.y * alto);
      ctx.stroke();
    }
  }, [pincel]);

  // Ajusta la resolución del canvas a su tamaño real y a la densidad de la pantalla.
  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const ajustar = () => {
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      redibujar();
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(c);
    return () => ro.disconnect();
  }, [redibujar]);

  // Si la pantalla borra la firma desde afuera, se redibuja.
  useEffect(() => {
    todos.current = trazos;
    redibujar();
  }, [trazos, redibujar]);

  function punto(e: React.PointerEvent<HTMLCanvasElement>): Punto {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function empezar(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    actual.current = [punto(e)];
    todos.current = [...todos.current, actual.current];
    redibujar();
  }

  function mover(e: React.PointerEvent<HTMLCanvasElement>) {
    const t = actual.current;
    const p = pincel();
    if (!t || !p) return;
    const q = punto(e);
    const previo = t[t.length - 1];
    t.push(q);
    p.ctx.beginPath();
    p.ctx.moveTo(previo.x * p.ancho, previo.y * p.alto);
    p.ctx.lineTo(q.x * p.ancho, q.y * p.alto);
    p.ctx.stroke();
  }

  function terminar() {
    if (!actual.current) return;
    actual.current = null;
    alCambiar([...todos.current]);
  }

  const vacia = trazos.length === 0;

  return (
    <div className="relative h-44 overflow-hidden rounded-[var(--radius-boton)] border border-junta bg-papel">
      {/* Renglón de la firma */}
      <span aria-hidden className="pointer-events-none absolute inset-x-5 bottom-10 border-b border-junta" />
      <span
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-x-5 bottom-3 text-sm text-cemento transition-opacity",
          !vacia && "opacity-0",
        )}
      >
        Firmá acá con el dedo
      </span>
      <canvas
        ref={lienzo}
        role="img"
        aria-label={vacia ? `${etiqueta}: sin firmar` : `${etiqueta}: firmado`}
        className="absolute inset-0 size-full cursor-crosshair touch-none text-tinta"
        onPointerDown={empezar}
        onPointerMove={mover}
        onPointerUp={terminar}
        onPointerCancel={terminar}
      />
    </div>
  );
}
