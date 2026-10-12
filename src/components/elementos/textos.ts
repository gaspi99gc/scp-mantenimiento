// Textos de la pantalla de elementos que usan tanto el servidor como el cliente.
import type { Ejecucion, ResultadoEjecucion } from "@/lib/tipos";

/** Mismas palabras que el formulario de registro (RegistrarEjecucion). */
export const TEXTO_RESULTADO: Record<ResultadoEjecucion, string> = {
  ok: "Hecho",
  reemplazo: "Se cambió la unidad",
  observado: "Hecho, con observaciones",
  no_apto: "No apto",
  no_realizado: "No se pudo hacer",
};

/** De dónde salió el vencimiento que dejó la ejecución. El calculado no se aclara. */
export const TEXTO_ORIGEN: Record<Ejecucion["origen"], string | undefined> = {
  certificado: "según certificado",
  relevamiento: "según el relevamiento",
  ajuste_manual: "ajustado a mano",
  calculado: undefined,
};

/** "Salón, junto a la caja" → "salón, junto a la caja", para usar en medio de una frase. */
export const enMinuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
