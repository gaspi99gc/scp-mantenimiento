// Textos del catálogo de controles, a partir de lo que guarda la base (tipo_control y a qué equipos se aplica).
import type { Database } from "@/lib/supabase/tipos-db";

type FilaTipoControl = Database["public"]["Tables"]["tipo_control"]["Row"];

const UNIDAD: Record<"dia" | "mes" | "anio", [string, string]> = {
  dia: ["día", "días"],
  mes: ["mes", "meses"],
  anio: ["año", "años"],
};

/** "Cada 12 meses", "Todos los meses", "Según el documento". */
export function textoPeriodoCatalogo(unidad: FilaTipoControl["periodo_unidad"], valor: number | null): string {
  if (unidad === "manual" || !valor) return "Según el documento";
  const [uno, varios] = UNIDAD[unidad];
  if (valor === 1) return unidad === "mes" ? "Todos los meses" : unidad === "anio" ? "Todos los años" : "Todos los días";
  return `Cada ${valor} ${valor === 1 ? uno : varios}`;
}

/** "Matafuegos ABC 5 kg, ABC 10 kg y CO₂" se arma con la lista de nombres de tipo de equipo. */
export function textoAplicaA(alLocal: boolean, equipos: string[]): string {
  if (alLocal) return "Todo el local";
  if (equipos.length === 0) return "Sin tipos de equipo";
  if (equipos.length === 1) return equipos[0];
  return `${equipos.slice(0, -1).join(", ")} y ${equipos.at(-1)}`;
}

export function fichaCatalogo(t: FilaTipoControl, equipos: string[]) {
  return {
    id: t.id,
    nombre: t.nombre,
    activo: t.activo,
    aplicaA: textoAplicaA(t.aplica_al_local, equipos),
    periodo: textoPeriodoCatalogo(t.periodo_unidad, t.periodo_valor),
    base:
      t.periodo_unidad === "manual"
        ? "la fecha la dice el documento"
        : t.base === "desde_ejecucion"
          ? "desde el día del trabajo"
          : "desde el vencimiento anterior",
    aviso: t.anticipacion_dias,
    quien: t.ejecutor === "scp" ? "SCP" : "Un tercero",
    norma: t.norma ?? undefined,
  };
}

export type FichaCatalogo = ReturnType<typeof fichaCatalogo>;
