// Textos y cuentas de las pantallas de visitas. Sin datos: se puede importar desde componentes cliente.

import { fechaLarga, sumarDias } from "@/lib/fechas";
import type { FechaISO } from "@/lib/tipos";

/** Cómo se nombra cada control en el mensaje al encargado, en singular y en plural. */
const FRASES: Record<string, { uno: string; varios: (n: number) => string }> = {
  "tc-recarga": { uno: "la recarga del matafuego", varios: (n) => `la recarga de ${n} matafuegos` },
  "tc-ph": { uno: "la prueba hidráulica del matafuego", varios: (n) => `la prueba hidráulica de ${n} matafuegos` },
  "tc-vida": { uno: "el cambio del matafuego que cumple su vida útil", varios: (n) => `el cambio de ${n} matafuegos que cumplen su vida útil` },
  "tc-tanque": { uno: "la limpieza del tanque de agua", varios: (n) => `la limpieza de ${n} tanques de agua` },
  "tc-campana": { uno: "la limpieza de la campana", varios: (n) => `la limpieza de ${n} campanas` },
  "tc-grasera": { uno: "la limpieza de la grasera", varios: (n) => `la limpieza de ${n} graseras` },
  "tc-tablero": { uno: "el control del tablero", varios: (n) => `el control de ${n} tableros` },
  "tc-pat": { uno: "la medición de puesta a tierra", varios: () => "la medición de puesta a tierra" },
  "tc-luces": { uno: "la prueba de las luces de emergencia", varios: () => "la prueba de las luces de emergencia" },
  "tc-plagas": { uno: "el control de plagas", varios: () => "el control de plagas" },
  "tc-aire": { uno: "el service del aire acondicionado", varios: (n) => `el service de ${n} equipos de aire acondicionado` },
};

/** "A", "A y B", "A, B y C" */
export function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

/** Junta los controles por tipo: "la recarga de 3 matafuegos y el control de plagas". */
export function queVamosAHacer(controles: { tipoControlId: string; nombreTipo: string }[]): string {
  const orden: string[] = [];
  const cuenta = new Map<string, { n: number; nombre: string }>();
  for (const c of controles) {
    const previo = cuenta.get(c.tipoControlId);
    if (previo) previo.n++;
    else {
      orden.push(c.tipoControlId);
      cuenta.set(c.tipoControlId, { n: 1, nombre: c.nombreTipo });
    }
  }
  return enumerar(
    orden.map((id) => {
      const { n, nombre } = cuenta.get(id)!;
      const frase = FRASES[id];
      if (!frase) return `${nombre.charAt(0).toLowerCase()}${nombre.slice(1)}`;
      return n === 1 ? frase.uno : frase.varios(n);
    }),
  );
}

/** El mensaje exacto que le llega al encargado del local. */
export function mensajeAlEncargado({
  encargado,
  fecha,
  franja,
  controles,
  local,
  supervisor,
}: {
  encargado: string;
  fecha: FechaISO;
  franja: string;
  controles: { tipoControlId: string; nombreTipo: string }[];
  local: string;
  supervisor: string;
}): string {
  const nombre = encargado.split(" ")[0];
  const firma = supervisor.split(" ")[0];
  return `Hola ${nombre}, el ${fechaLarga(fecha)} de ${franja} vamos a hacer ${queVamosAHacer(controles)} en ${local}. Cualquier cosa respondé este mensaje. ${firma}, SCP.`;
}

/** Link de WhatsApp con el texto ya escrito. */
export function linkWhatsapp(telefono: string, texto: string): string {
  return `https://wa.me/${telefono.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;
}

// ——— Horas ———

const ZONA = "America/Argentina/Buenos_Aires";

/** Hora actual en Buenos Aires: "9:12", "16:05". */
export function horaActual(ahora: number = Date.now()): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: ZONA, hour: "numeric", minute: "2-digit", hourCycle: "h23" })
    .format(new Date(ahora))
    .replace(/^0(\d)/, "$1");
}

/** "desde las 9:12", "desde la 1:05" */
export function desdeLaHora(hora: string): string {
  return hora.startsWith("1:") ? `desde la ${hora}` : `desde las ${hora}`;
}

/** Hora de inicio de una franja "8 a 10 h" o "13:30 a 15 h", como "08:00" / "13:30". */
export function inicioDeFranja(franja: string): string {
  const m = franja.match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!m) return "08:00";
  return `${m[1].padStart(2, "0")}:${m[2] ?? "00"}`;
}

/** Momento (ms) en que empieza la visita, en horario de Argentina (UTC−3, sin horario de verano). */
export function inicioDeVisita(fecha: FechaISO, franja: string): number {
  return Date.parse(`${fecha}T${inicioDeFranja(franja)}:00-03:00`);
}

/** Horas que quedan entre ahora y el inicio de la visita. */
export function horasDeAnticipacion(fecha: FechaISO, franja: string, ahora: number): number {
  return (inicioDeVisita(fecha, franja) - ahora) / 3_600_000;
}

/** Primer día, desde `desde`, que deja `horas` de anticipación para esa franja. */
export function primerDiaConAnticipacion(desde: FechaISO, franja: string, horas: number, ahora: number): FechaISO {
  let f = desde;
  for (let i = 0; i < 30 && horasDeAnticipacion(f, franja, ahora) < horas; i++) f = sumarDias(f, 1);
  return f;
}

/** "08:00" → "8", "13:30" → "13:30" (para armar "8 a 10 h"). */
export function horaCorta(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  return m === "00" ? String(Number(h)) : `${Number(h)}:${m}`;
}
