// Textos del catálogo de controles, armados a partir de los tipos de control de datos.ts.
import { textoPeriodo } from "@/lib/fechas";
import type { TipoControl } from "@/lib/tipos";

/**
 * A qué se aplica cada tipo. TipoControl todavía no lo trae (en la propuesta es `aplica_a` + tipo de elemento),
 * así que por ahora vive acá.
 */
const APLICA_A: Record<string, string> = {
  "tc-recarga": "Matafuegos",
  "tc-ph": "Matafuegos, por cilindro",
  "tc-vida": "Matafuegos, por cilindro",
  "tc-tanque": "Tanques de agua",
  "tc-campana": "Campanas de cocina",
  "tc-grasera": "Graseras",
  "tc-tablero": "Tableros eléctricos",
  "tc-pat": "Instalación eléctrica del local",
  "tc-luces": "Luces de emergencia",
  "tc-plagas": "Todo el local",
  "tc-aire": "Equipos de aire acondicionado",
};

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function fichaCatalogo(t: TipoControl) {
  const evidencia = t.evidencia.map((e, i) => (i === 0 ? e : e.charAt(0).toLowerCase() + e.slice(1)));
  return {
    id: t.id,
    nombre: t.nombre,
    aplicaA: APLICA_A[t.id],
    periodo: mayuscula(textoPeriodo(t)),
    base:
      t.periodoUnidad === "manual"
        ? "la fecha la dice el documento"
        : t.base === "desde_ejecucion"
          ? "desde el día del trabajo"
          : "desde el vencimiento anterior",
    aviso: t.anticipacionDias,
    quien: t.ejecutor === "SCP" ? "SCP" : "Tercero",
    norma: t.norma,
    evidencia:
      evidencia.length === 0
        ? undefined
        : evidencia.length === 1
          ? evidencia[0]
          : `${evidencia.slice(0, -1).join(", ")} y ${evidencia[evidencia.length - 1]}`,
  };
}

export type FichaCatalogo = ReturnType<typeof fichaCatalogo>;
