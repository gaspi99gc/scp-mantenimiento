"use client";

// Lector de QR con la cámara del celular: getUserMedia + BarcodeDetector.
// El permiso se pide recién al tocar "Activar cámara". Al leer una etiqueta de SCP
// (https://scp.com.ar/e/<token>) navega a /e/<token>, que lleva a la ficha del equipo.

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconoAlerta } from "@/components/iconos";
import { Boton, cx } from "@/components/ui";

type Estado =
  | "revisando"
  | "listo"
  | "pidiendo"
  | "activa"
  | "leido"
  | "sin_soporte"
  | "inseguro"
  | "sin_permiso"
  | "sin_camara"
  | "ocupada"
  | "error";

// BarcodeDetector todavía no está en los tipos del DOM de TypeScript.
interface CodigoDetectado {
  rawValue: string;
}
interface Detector {
  detect(fuente: HTMLVideoElement): Promise<CodigoDetectado[]>;
}
interface ConstructorDetector {
  new (opciones?: { formats: string[] }): Detector;
  getSupportedFormats?: () => Promise<string[]>;
}

const constructorDetector = () =>
  (window as unknown as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector;

/** Lo que trae el QR de la etiqueta → el token: "https://scp.com.ar/e/q7f3k2" → "q7f3k2". */
function tokenDelQR(texto: string): string | undefined {
  try {
    return new URL(texto.trim()).pathname.match(/^\/e\/([A-Za-z0-9_-]+)\/?$/)?.[1];
  } catch {
    return undefined;
  }
}

const PROBLEMAS: Partial<Record<Estado, { titulo: string; texto: string; reintentar?: boolean }>> = {
  sin_soporte: {
    titulo: "Este navegador no lee códigos QR",
    texto:
      "Abrí la cámara del teléfono y apuntá a la etiqueta: te va a ofrecer abrir el equipo. También podés escribir el código de la etiqueta.",
  },
  inseguro: {
    titulo: "La cámara necesita una conexión segura",
    texto: "Entrá a la app con https para usar la cámara. Mientras tanto, escribí el código de la etiqueta.",
  },
  sin_permiso: {
    titulo: "No hay permiso para usar la cámara",
    texto: "Habilitalo en los permisos del sitio (el candado al lado de la dirección) y tocá Reintentar.",
    reintentar: true,
  },
  sin_camara: {
    titulo: "No encontramos una cámara",
    texto: "Este dispositivo no tiene cámara o está desconectada. Escribí el código de la etiqueta.",
  },
  ocupada: {
    titulo: "La cámara está en uso",
    texto: "Otra app la está usando. Cerrala y tocá Reintentar.",
    reintentar: true,
  },
  error: {
    titulo: "No se pudo abrir la cámara",
    texto: "Tocá Reintentar. Si sigue pasando, escribí el código de la etiqueta.",
    reintentar: true,
  },
};

export function Escaner() {
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const temporizador = useRef<number | null>(null);
  const [estado, setEstado] = useState<Estado>("revisando");
  const [ajeno, setAjeno] = useState(false);

  const apagar = useCallback(() => {
    if (temporizador.current) window.clearTimeout(temporizador.current);
    temporizador.current = null;
    flujo.current?.getTracks().forEach((t) => t.stop());
    flujo.current = null;
    if (video.current) video.current.srcObject = null;
  }, []);

  // El soporte se revisa en el navegador (en el servidor no hay cámara). No se pide permiso todavía.
  useEffect(() => {
    if (!window.isSecureContext) setEstado("inseguro");
    else if (!navigator.mediaDevices?.getUserMedia || !constructorDetector()) setEstado("sin_soporte");
    else setEstado("listo");
    return apagar;
  }, [apagar]);

  // "Ese QR no es de SCP" se borra solo.
  useEffect(() => {
    if (!ajeno) return;
    const t = window.setTimeout(() => setAjeno(false), 2500);
    return () => window.clearTimeout(t);
  }, [ajeno]);

  function buscar(detector: Detector) {
    const ciclo = async () => {
      const v = video.current;
      if (!v || !flujo.current) return;
      if (v.readyState >= 2) {
        try {
          for (const c of await detector.detect(v)) {
            const token = tokenDelQR(c.rawValue);
            if (token) {
              navigator.vibrate?.(40);
              setEstado("leido");
              apagar();
              router.push(`/e/${encodeURIComponent(token)}`);
              return;
            }
            setAjeno(true);
          }
        } catch {
          // Un cuadro que no se pudo analizar: se sigue con el próximo.
        }
      }
      temporizador.current = window.setTimeout(ciclo, 180);
    };
    void ciclo();
  }

  async function activar() {
    const Detector = constructorDetector();
    if (!Detector || !navigator.mediaDevices?.getUserMedia) return setEstado("sin_soporte");
    setEstado("pidiendo");
    try {
      const formatos = await Detector.getSupportedFormats?.();
      if (formatos && !formatos.includes("qr_code")) return setEstado("sin_soporte");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      flujo.current = stream;
      if (!video.current) throw new Error("Sin visor");
      video.current.srcObject = stream;
      await video.current.play();
      setEstado("activa");
      buscar(new Detector({ formats: ["qr_code"] }));
    } catch (e) {
      apagar();
      const nombre = e instanceof DOMException ? e.name : "";
      if (nombre === "NotAllowedError" || nombre === "SecurityError") setEstado("sin_permiso");
      else if (nombre === "NotFoundError" || nombre === "OverconstrainedError") setEstado("sin_camara");
      else if (nombre === "NotReadableError" || nombre === "AbortError") setEstado("ocupada");
      else setEstado("error");
    }
  }

  function detener() {
    apagar();
    setEstado("listo");
  }

  const problema = PROBLEMAS[estado];
  const conMarco = !problema;

  return (
    <section
      aria-label="Lector de QR"
      className={cx(
        "relative mb-6 flex flex-col overflow-hidden rounded-[var(--radius-planilla)] bg-tinta text-papel lg:mb-7",
        // Con un problema el visor se achica, así el campo para escribir el código queda a la vista.
        problema ? "py-5" : "h-[58dvh] max-h-[620px] min-h-[360px] lg:h-[min(70dvh,600px)]",
      )}
    >
      <video
        ref={video}
        muted
        playsInline
        aria-hidden
        className={cx("absolute inset-0 size-full object-cover", estado !== "activa" && "invisible")}
      />

      {conMarco ? (
        <div className="relative flex flex-1 items-center justify-center" aria-hidden>
          <Marco encendido={estado === "activa" || estado === "leido"} />
        </div>
      ) : (
        problema && (
          <div className="relative px-5" role="alert">
            <IconoAlerta tamano={28} />
            <h2 className="mt-3 text-lg font-[650] leading-tight">{problema.titulo}</h2>
            <p className="mt-1.5 max-w-[46ch] text-papel/85">{problema.texto}</p>
            {problema.reintentar && (
              <div className="mt-5">
                <Boton variante="secundario" className="focus-visible:outline-papel" onClick={activar}>
                  Reintentar
                </Boton>
              </div>
            )}
          </div>
        )
      )}

      {conMarco && (
        <div className="relative bg-tinta/85 px-4 py-3" aria-live="polite">
          {estado === "leido" ? (
            <p className="flex min-h-12 items-center text-lg font-semibold">Código leído. Abriendo el equipo…</p>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug">
                  {ajeno ? "Ese QR no es de un equipo de SCP" : "Apuntá al QR pegado en el equipo"}
                </p>
                {estado !== "activa" && (
                  <p className="text-sm text-papel/80">
                    {estado === "pidiendo" ? "Esperando el permiso de la cámara." : "Te va a pedir permiso para usar la cámara."}
                  </p>
                )}
              </div>
              {estado === "activa" ? (
                // Botón de contorno claro: sobre el visor oscuro, las variantes de Boton no se leen.
                <button
                  onClick={detener}
                  className="inline-flex min-h-12 items-center justify-center rounded-[var(--radius-boton)] border border-papel/50 px-4 font-semibold text-papel transition-colors hover:bg-papel/10 active:bg-papel/15 focus-visible:outline-papel"
                >
                  Apagar cámara
                </button>
              ) : (
                <Boton
                  variante="secundario"
                  className="focus-visible:outline-papel"
                  onClick={activar}
                  disabled={estado !== "listo"}
                >
                  Activar cámara
                </Boton>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** El marco del QR: cuatro esquinas. Apagado se ve tenue. */
function Marco({ encendido }: { encendido: boolean }) {
  const esquina = cx("absolute size-10 border-papel", encendido ? "opacity-100" : "opacity-45");
  return (
    <div className="relative size-[min(60vw,232px)]">
      <span className={cx(esquina, "left-0 top-0 rounded-tl-[10px] border-l-4 border-t-4")} />
      <span className={cx(esquina, "right-0 top-0 rounded-tr-[10px] border-r-4 border-t-4")} />
      <span className={cx(esquina, "bottom-0 left-0 rounded-bl-[10px] border-b-4 border-l-4")} />
      <span className={cx(esquina, "bottom-0 right-0 rounded-br-[10px] border-b-4 border-r-4")} />
    </div>
  );
}
