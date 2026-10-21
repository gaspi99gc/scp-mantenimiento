// Datos de la app, leídos de Supabase con la sesión de quien navega (las reglas de la base filtran).
//
// Cómo se usa: cada página (o layout, o generateMetadata) llama primero a `await cargarDatos()`.
// Después, todas las funciones de abajo (localDe, controlesDeLocal, resumenLocal…) leen esa misma
// foto de los datos, sin volver a la base. La foto vive solo durante ese pedido (cache de React),
// así que dos personas nunca comparten datos.
//
// Con pocos cientos de controles alcanza con leer todo de una vez. Si algún día son miles,
// conviene pasar las consultas pesadas a filtros en la base.

import "server-only";
import { cache } from "react";
import { TIPO } from "./catalogo";
import { estadoDe } from "./fechas";
import { exigirStaff } from "./sesion";
import { clienteServidor } from "./supabase/servidor";
import type {
  Cliente, Control, Ejecucion, Elemento, EstadoControl, Local, Pedido, TipoControl, Unidad,
} from "./tipos";

export interface Foto {
  clientes: Cliente[];
  locales: Local[];
  tiposControl: TipoControl[];
  elementos: Elemento[];
  controles: Control[];
  ejecuciones: Ejecucion[];
  pedidos: Pedido[];
}

export { TIPO };

// "2026-10-20T11:12:00+00:00" → "2026-10-20T08:12:00-03:00": las pantallas leen fecha y hora en horario argentino.
const formatoArgentina = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  hourCycle: "h23",
});
function enArgentina(ts: string): string {
  const p = Object.fromEntries(formatoArgentina.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}-03:00`;
}

async function leer(): Promise<Foto> {
  // Los layouts no se vuelven a correr al navegar dentro de la app: cada lectura vuelve a verificar.
  await exigirStaff();
  const db = await clienteServidor();
  const [cli, loc, te, tc, eq, un, co, re, pe] = await Promise.all([
    db.from("cliente").select("id, nombre, razon_social, cuit"),
    db.from("local").select("*"),
    db.from("tipo_equipo").select("id, nombre"),
    db.from("tipo_control").select("*"),
    db.from("equipo").select("id, local_id, tipo_equipo_id, codigo, ubicacion, detalle, qr_token, estado"),
    db.from("unidad").select("equipo_id, serie, fabricacion, instalada_desde, retirada_en"),
    db.from("control").select("id, local_id, equipo_id, tipo_control_id, vencimiento, ultima_fecha, ultimo_ejecutor").eq("estado", "activo"),
    db.from("registro").select("id, control_id, fecha, resultado, origen, ejecutor, oblea, nota, vencimiento_anterior, vencimiento_nuevo"),
    db.from("pedido").select("id, local_id, titulo, detalle, urgencia, estado, canal, creado_en, sla_vence_en"),
  ]);
  const error = [cli, loc, te, tc, eq, un, co, re, pe].find((r) => r.error)?.error;
  if (error) throw new Error(`No se pudieron leer los datos: ${error.message}`);

  const nombreTipoEquipo = new Map(te.data!.map((t) => [t.id, t.nombre]));
  const unidades = un.data!;

  return {
    clientes: cli.data!.map((c) => ({ id: c.id, nombre: c.nombre, razonSocial: c.razon_social, cuit: c.cuit })),
    locales: loc.data!.map((l) => ({
      id: l.id,
      clienteId: l.cliente_id,
      nombre: l.nombre,
      direccion: l.direccion,
      barrio: l.barrio,
      rubro: l.rubro,
      horarioAcceso: l.horario_acceso,
      observaciones: l.observaciones ?? undefined,
      encargado: { nombre: l.encargado_nombre, telefono: l.encargado_telefono },
      supervisorId: l.supervisor_id ?? "",
    })),
    tiposControl: tc.data!.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      periodoValor: t.periodo_valor ?? 0,
      periodoUnidad: t.periodo_unidad,
      base: t.base,
      anticipacionDias: t.anticipacion_dias,
      evidencia: t.evidencia,
      ejecutor: t.ejecutor === "scp" ? "SCP" : "tercero",
      norma: t.norma ?? undefined,
      verbo: t.verbo,
      hecho: t.texto_hecho,
      dependeDeUnidad: t.depende_de_unidad,
    })),
    elementos: eq.data!.map((e) => {
      const propias = unidades.filter((u) => u.equipo_id === e.id);
      const actual = propias.find((u) => !u.retirada_en);
      const aUnidad = (u: (typeof propias)[number]): Unidad => ({
        serie: u.serie, fabricacion: u.fabricacion, instaladaDesde: u.instalada_desde,
      });
      return {
        id: e.id,
        localId: e.local_id,
        tipo: [nombreTipoEquipo.get(e.tipo_equipo_id), e.detalle].filter(Boolean).join(" "),
        codigo: e.codigo,
        ubicacion: e.ubicacion,
        qrToken: e.qr_token,
        estado: e.estado,
        unidad: actual && aUnidad(actual),
        unidadesAnteriores: propias
          .filter((u) => u.retirada_en)
          .sort((a, b) => (a.retirada_en! < b.retirada_en! ? 1 : -1))
          .map((u) => ({ ...aUnidad(u), retiradaEn: u.retirada_en! })),
      };
    }),
    controles: co.data!.map((c) => ({
      id: c.id,
      localId: c.local_id,
      elementoId: c.equipo_id ?? undefined,
      tipoControlId: c.tipo_control_id,
      vencimiento: c.vencimiento ?? undefined,
      ultimaEjecucion: c.ultima_fecha ?? undefined,
      ultimoEjecutor: c.ultimo_ejecutor ?? undefined,
    })),
    ejecuciones: re.data!.map((r) => ({
      id: r.id,
      controlId: r.control_id,
      fecha: r.fecha,
      resultado: r.resultado,
      vencimientoAnterior: r.vencimiento_anterior ?? undefined,
      vencimientoNuevo: r.vencimiento_nuevo ?? undefined,
      origen: r.origen,
      oblea: r.oblea ?? undefined,
      ejecutor: r.ejecutor,
      nota: r.nota ?? undefined,
    })),
    pedidos: pe.data!.map((p) => ({
      id: p.id,
      localId: p.local_id,
      titulo: p.titulo,
      detalle: p.detalle,
      urgencia: p.urgencia,
      estado: p.estado,
      canal: p.canal,
      creado: enArgentina(p.creado_en),
      slaVence: enArgentina(p.sla_vence_en),
    })),
  };
}

// Un casillero por pedido: lo comparten la página, su layout y su generateMetadata.
const casillero = cache((): { foto?: Foto } => ({}));

/** Lee los datos de la base (una sola vez por pedido). Llamarla al principio de cada página. */
export async function cargarDatos(): Promise<Foto> {
  const c = casillero();
  c.foto ??= await leer();
  return c.foto;
}

/** La foto de este pedido. Falla a propósito si la página se olvidó de llamar a cargarDatos(). */
export function datos(): Foto {
  const foto = casillero().foto;
  if (!foto) throw new Error("Falta llamar a `await cargarDatos()` al principio de la página.");
  return foto;
}

// ——— Consultas ———

export const tipoDe = (control: Control): TipoControl => datos().tiposControl.find((t) => t.id === control.tipoControlId)!;
export const localDe = (id: string) => datos().locales.find((l) => l.id === id);
export const clienteDe = (id: string) => datos().clientes.find((c) => c.id === id);
export const elementoDe = (id: string) => datos().elementos.find((e) => e.id === id);

export const elementosDeLocal = (localId: string) => datos().elementos.filter((e) => e.localId === localId);
export const controlesDeLocal = (localId: string) => datos().controles.filter((c) => c.localId === localId);
export const controlesDeElemento = (elementoId: string) => datos().controles.filter((c) => c.elementoId === elementoId);
export const ejecucionesDeControl = (controlId: string) =>
  datos().ejecuciones.filter((e) => e.controlId === controlId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
export const pedidosDeLocal = (localId: string) => datos().pedidos.filter((p) => p.localId === localId);

export const estadoControl = (c: Control): EstadoControl => estadoDe(c, tipoDe(c));

/** Nombre para mostrar: "Recarga, matafuego ABC 5 kg (salón, junto a la caja)" se arma en la pantalla con estas piezas. */
export function describirControl(c: Control) {
  const tipo = tipoDe(c);
  const elemento = c.elementoId ? elementoDe(c.elementoId) : undefined;
  return { tipo, elemento, que: tipo.nombre, sobre: elemento ? elemento.tipo : "Local", donde: elemento?.ubicacion };
}

/** Peor estado primero: vencido, sin datos, vence pronto, al día. */
export const ORDEN_ESTADO: Record<EstadoControl, number> = { vencido: 0, sin_datos: 1, pronto: 2, al_dia: 3, suspendido: 4 };

export function resumenLocal(localId: string) {
  const cs = controlesDeLocal(localId);
  const estados = cs.map(estadoControl);
  const cuenta = (e: EstadoControl) => estados.filter((x) => x === e).length;
  const peor = estados.reduce<EstadoControl>((p, e) => (ORDEN_ESTADO[e] < ORDEN_ESTADO[p] ? e : p), "al_dia");
  return {
    total: cs.length,
    vencidos: cuenta("vencido"),
    pronto: cuenta("pronto"),
    alDia: cuenta("al_dia"),
    sinDatos: cuenta("sin_datos"),
    peor,
  };
}

/**
 * Con la prueba hidráulica del cilindro vencida no conviene registrar una recarga:
 * hay que reemplazar la unidad o registrar primero la prueba. Es un aviso en pantalla.
 */
export function bloqueoDe(c: Control): { texto: string; permiteReemplazo: boolean } | undefined {
  if (c.tipoControlId !== TIPO.recarga || !c.elementoId) return undefined;
  const ph = datos().controles.find((x) => x.elementoId === c.elementoId && x.tipoControlId === TIPO.pruebaHidraulica);
  if (!ph?.vencimiento || estadoControl(ph) !== "vencido") return undefined;
  const [a, mm, dd] = ph.vencimiento.split("-");
  return {
    texto: `La prueba hidráulica de este cilindro venció el ${dd}/${mm}/${a}. No se puede registrar la recarga: reemplazá la unidad o registrá primero la prueba hidráulica.`,
    permiteReemplazo: true,
  };
}
