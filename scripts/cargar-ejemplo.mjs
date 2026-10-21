// Carga en Supabase los datos de ejemplo (los que antes vivían en src/lib/datos.ts), con fechas relativas a hoy.
// Uso: npm run cargar-ejemplo
// Se puede correr varias veces: primero borra los datos de ejemplo anteriores (solo los suyos, por id fijo)
// y los vuelve a cargar con las fechas de hoy. No toca nada que hayas cargado vos.
// Solo para el proyecto de desarrollo: se niega a correr si el proyecto no es el de desarrollo.

import { createClient } from "@supabase/supabase-js";

const PROYECTO_DESARROLLO = "qotlyqischkjpohsmwbn";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!url.includes(PROYECTO_DESARROLLO)) {
  console.error(`Esto carga datos de ejemplo y solo corre contra el proyecto de desarrollo (${PROYECTO_DESARROLLO}).`);
  process.exit(1);
}
const db = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });

// ——— Fechas (misma regla que src/lib/fechas.ts) ———
const aFecha = (iso) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
};
const aISO = (f) => f.toISOString().slice(0, 10);
const H = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
const sumarDias = (iso, n) => {
  const f = aFecha(iso);
  f.setUTCDate(f.getUTCDate() + n);
  return aISO(f);
};
const sumarMeses = (iso, n) => {
  const f = aFecha(iso);
  const dia = f.getUTCDate();
  const destino = new Date(Date.UTC(f.getUTCFullYear(), f.getUTCMonth() + n, 1));
  const ultimo = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
  destino.setUTCDate(Math.min(dia, ultimo));
  return aISO(destino);
};
const d = (n) => sumarDias(H, n);
const m = (n) => sumarMeses(H, n);
const ultimaCampana = sumarMeses(d(21), -3);

// ——— Ids fijos (así los links de prueba no cambian) ———
const id = (prefijo, n) => `${prefijo}0000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const CLI = (n) => id(1, n);
const LOC = (n) => id(2, n);
const EQ = (n) => id(3, n);
const PED = (n) => id(4, n);
const TE = (n) => `00000000-0000-4000-8000-00000000e00${n}`;
const TC = {
  recarga: "00000000-0000-4000-8000-00000000c001",
  ph: "00000000-0000-4000-8000-00000000c002",
  vida: "00000000-0000-4000-8000-00000000c003",
  tanque: "00000000-0000-4000-8000-00000000c004",
  campana: "00000000-0000-4000-8000-00000000c005",
  grasera: "00000000-0000-4000-8000-00000000c006",
  tablero: "00000000-0000-4000-8000-00000000c007",
  pat: "00000000-0000-4000-8000-00000000c008",
  luces: "00000000-0000-4000-8000-00000000c009",
  plagas: "00000000-0000-4000-8000-00000000c010",
  aire: "00000000-0000-4000-8000-00000000c011",
};

const clientes = [
  { id: CLI(1), nombre: "Panadería La Espiga", razon_social: "La Espiga S.R.L.", cuit: "30-71234567-8" },
  { id: CLI(2), nombre: "Bodegón Don Ernesto", razon_social: "Ernesto Gastronomía S.A.", cuit: "30-70987654-3" },
  { id: CLI(3), nombre: "Óptica Visión Sur", razon_social: "Visión Sur S.A.S.", cuit: "30-71555222-1" },
];

const locales = [
  { id: LOC(1), cliente_id: CLI(1), nombre: "La Espiga Caballito", direccion: "Av. Rivadavia 5320", barrio: "Caballito", rubro: "gastronomico",
    horario_acceso: "Lunes a sábado de 6 a 21 h", encargado_nombre: "Sandra Gómez", encargado_telefono: "+54 9 11 4444-1201" },
  { id: LOC(2), cliente_id: CLI(1), nombre: "La Espiga Almagro", direccion: "Av. Corrientes 4185", barrio: "Almagro", rubro: "gastronomico",
    horario_acceso: "Todos los días de 7 a 20 h", encargado_nombre: "Ramiro Ibáñez", encargado_telefono: "+54 9 11 4444-3388" },
  { id: LOC(3), cliente_id: CLI(2), nombre: "Don Ernesto Palermo", direccion: "Gorriti 4870", barrio: "Palermo", rubro: "gastronomico",
    horario_acceso: "Martes a domingo de 11 a 1 h. Cocina desde las 9 h", encargado_nombre: "Ernesto Vidal", encargado_telefono: "+54 9 11 4444-7710" },
  { id: LOC(4), cliente_id: CLI(3), nombre: "Visión Sur Shopping Caballito", direccion: "Ferrari 250, local 214", barrio: "Caballito", rubro: "retail",
    horario_acceso: "Trabajos solo de 8 a 10 h, antes de que abra el shopping",
    requisitos_acceso: "Permiso de trabajo con 48 h de anticipación y nómina con ART",
    encargado_nombre: "Paula Herrera", encargado_telefono: "+54 9 11 4444-2045" },
  { id: LOC(5), cliente_id: CLI(3), nombre: "Visión Sur Belgrano", direccion: "Av. Cabildo 2140", barrio: "Belgrano", rubro: "retail",
    horario_acceso: "Lunes a sábado de 10 a 20 h", encargado_nombre: "Tomás Rey", encargado_telefono: "+54 9 11 4444-9932" },
];

// [n, local, tipo de equipo, código, ubicación, detalle, qr, estado, unidad actual, unidades anteriores]
const equipos = [
  [1, 1, 1, "ESP1-MAT-01", "Salón, junto a la caja", null, "q7f3k2", "activo",
    { serie: "C-448120", fabricacion: "2019-03-10", desde: m(-11) },
    [{ serie: "C-301877", fabricacion: "2015-08-02", desde: "2021-02-15", hasta: m(-11) }]],
  [2, 1, 1, "ESP1-MAT-02", "Cuadra, junto al horno", null, "p2m9x1", "activo", { serie: "C-512093", fabricacion: "2021-06-21", desde: m(-12) }],
  [3, 1, 3, "ESP1-MAT-03", "Tablero principal", null, "z8w4r6", "activo", { serie: "K-220419", fabricacion: "2018-11-05", desde: m(-12) }],
  [4, 1, 4, "ESP1-TAN-01", "Terraza", "1.000 l", "t5n1v8", "activo"],
  [5, 1, 5, "ESP1-CAM-01", "Cuadra", "de cuadra", "c3b7y2", "activo"],
  [6, 1, 7, "ESP1-TAB-01", "Pasillo de servicio", null, "e6h2j9", "activo"],
  [7, 2, 1, "ESP2-MAT-01", "Salón", null, "a1s5d3", "activo", { serie: "C-600217", fabricacion: "2022-01-14", desde: m(-4) }],
  [8, 2, 6, "ESP2-GRA-01", "Patio", null, "g4f8h0", "activo"],
  [9, 3, 2, "DEP-MAT-01", "Cocina, junto a la puerta trasera", null, "m2k6l4", "en_servicio_externo",
    { serie: "C-389001", fabricacion: "2008-04-30", desde: "2020-05-11" }],
  [10, 3, 1, "DEP-MAT-02", "Salón, escalera", null, "n7b3v5", "activo", { serie: "C-577342", fabricacion: "2020-09-18", desde: m(-10) }],
  [11, 3, 5, "DEP-CAM-01", "Cocina", "de cocina", "w9e1r7", "activo"],
  [12, 3, 8, "DEP-LUZ-01", "Salón y salidas", "(6)", "u3i8o2", "activo"],
  [13, 3, 4, "DEP-TAN-01", "Azotea", "2.000 l", "y6t2r4", "activo"],
  [14, 4, 1, "VSC-MAT-01", "Detrás del mostrador", null, "b8n4m1", "activo", { serie: "C-610455", fabricacion: "2023-02-08", desde: m(-3) }],
  [15, 4, 9, "VSC-AIR-01", "Salón", "4.500 fg", "k1l9p3", "activo"],
  [16, 4, 7, "VSC-TAB-01", "Depósito", null, "x5c7v2", "activo"],
  [17, 5, 1, "VSB-MAT-01", "Entrada", null, "r4t6y8", "activo", { serie: "C-598830", fabricacion: "2021-10-27", desde: m(-6) }],
];

// Fechas de los controles: [equipo o null, local, tipo, vencimiento, última fecha, último ejecutor]
const fechas = [
  [1, 1, "recarga", d(6), sumarMeses(d(6), -12), "Recargas Norte"],
  [1, 1, "ph", "2029-03-10", "2024-03-10", "Recargas Norte"],
  [1, 1, "vida", "2039-03-10", "2019-03-10", null],
  [2, 1, "recarga", d(6), sumarMeses(d(6), -12), "Recargas Norte"],
  [2, 1, "ph", d(40), sumarMeses(d(40), -60), "Recargas Norte"],
  [2, 1, "vida", "2041-06-21", "2021-06-21", null],
  [3, 1, "recarga", d(6), sumarMeses(d(6), -12), "Recargas Norte"],
  [4, 1, "tanque", d(51), sumarMeses(d(51), -6), "Aguas Claras S.A."],
  [5, 1, "campana", d(21), ultimaCampana, "SCP"],
  [6, 1, "tablero", d(97), sumarMeses(d(97), -6), "SCP"],
  [null, 1, "plagas", d(3), sumarMeses(d(3), -1), "Fumigadora Sur"],
  [null, 1, "pat", d(140), sumarMeses(d(140), -12), "Ing. Carla Domínguez"],
  [7, 2, "recarga", d(244), sumarMeses(d(244), -12), "Recargas Norte"],
  [8, 2, "grasera", d(-4), sumarMeses(d(-4), -3), "SCP"],
  [null, 2, "plagas", d(12), sumarMeses(d(12), -1), "Fumigadora Sur"],
  [9, 3, "recarga", d(-2), sumarMeses(d(-2), -12), "Recargas Norte"],
  [9, 3, "ph", d(-2), sumarMeses(d(-2), -60), "Recargas Norte"],
  [9, 3, "vida", "2028-04-30", "2008-04-30", null],
  [10, 3, "recarga", d(58), sumarMeses(d(58), -12), "Recargas Norte"],
  [11, 3, "campana", d(-9), sumarMeses(d(-9), -3), "SCP"],
  [12, 3, "luces", d(5), sumarMeses(d(5), -3), "SCP"],
  [null, 3, "plagas", d(1), sumarMeses(d(1), -1), "Fumigadora Sur"],
  [14, 4, "recarga", d(275), sumarMeses(d(275), -12), "Recargas Norte"],
  [15, 4, "aire", d(9), sumarMeses(d(9), -12), "SCP"],
  [16, 4, "tablero", d(33), sumarMeses(d(33), -6), "SCP"],
  [17, 5, "recarga", d(183), sumarMeses(d(183), -12), "Recargas Norte"],
];

// Historial: [equipo o null, local, tipo, registro]
const registros = [
  [5, 1, "campana", { fecha: ultimaCampana, resultado: "ok", vencimiento_anterior: sumarDias(ultimaCampana, 2), vencimiento_nuevo: d(21), origen: "calculado", ejecutor: "SCP" }],
  [1, 1, "recarga", { fecha: sumarMeses(d(6), -12), resultado: "reemplazo", vencimiento_anterior: sumarMeses(d(6), -12), vencimiento_nuevo: d(6), origen: "certificado", oblea: "0045821", ejecutor: "Recargas Norte", nota: "Se reemplazó la unidad C-301877 por C-448120." }],
  [1, 1, "recarga", { fecha: sumarMeses(d(6), -24), resultado: "ok", vencimiento_anterior: sumarMeses(d(6), -24), vencimiento_nuevo: sumarMeses(d(6), -12), origen: "calculado", oblea: "0031177", ejecutor: "Recargas Norte" }],
  [1, 1, "ph", { fecha: "2024-03-10", resultado: "ok", vencimiento_nuevo: "2029-03-10", origen: "certificado", ejecutor: "Recargas Norte" }],
];

const pedidos = [
  { id: PED(1), local_id: LOC(3), titulo: "Pérdida de agua bajo la bacha de la cocina", detalle: "Gotea desde anoche, pusimos un balde.",
    urgencia: "urgente", estado: "nuevo", canal: "portal", creado_en: `${H}T08:12:00-03:00`, sla_vence_en: `${d(1)}T08:12:00-03:00` },
  { id: PED(2), local_id: LOC(4), titulo: "Tubo del cartel de la vidriera apagado", detalle: "Es el de la izquierda.",
    urgencia: "normal", estado: "aceptado", canal: "whatsapp", creado_en: `${d(-1)}T17:40:00-03:00`, sla_vence_en: `${d(2)}T17:40:00-03:00` },
];

async function hacer(paso, promesa) {
  const { error } = await promesa;
  if (error) {
    console.error(`Falló "${paso}": ${error.message}`);
    process.exit(1);
  }
}

// ——— Borrar lo de ejemplo anterior (en orden, por las claves foráneas) ———
const idsLocales = locales.map((l) => l.id);
await hacer("borrar registros", db.from("registro").delete().in("local_id", idsLocales));
await hacer("borrar pedidos", db.from("pedido").delete().in("local_id", idsLocales));
await hacer("borrar controles", db.from("control").delete().in("local_id", idsLocales));
await hacer("borrar unidades", db.from("unidad").delete().in("equipo_id", equipos.map(([n]) => EQ(n))));
await hacer("borrar equipos", db.from("equipo").delete().in("local_id", idsLocales));
await hacer("borrar locales", db.from("local").delete().in("id", idsLocales));
await hacer("borrar clientes", db.from("cliente").delete().in("id", clientes.map((c) => c.id)));

// ——— Cargar ———
await hacer("clientes", db.from("cliente").insert(clientes));
await hacer("locales", db.from("local").insert(locales)); // crea los controles de cada local
await hacer(
  "equipos",
  db.from("equipo").insert(
    equipos.map(([n, loc, te, codigo, ubicacion, detalle, qr, estado]) => ({
      id: EQ(n), local_id: LOC(loc), tipo_equipo_id: TE(te), codigo, ubicacion, detalle, qr_token: qr, estado,
    })),
  ),
); // crea los controles de cada equipo

const unidades = equipos.flatMap(([n, , , , , , , , actual, anteriores = []]) => [
  ...anteriores.map((u) => ({ equipo_id: EQ(n), serie: u.serie, fabricacion: u.fabricacion, instalada_desde: u.desde, retirada_en: u.hasta })),
  ...(actual ? [{ equipo_id: EQ(n), serie: actual.serie, fabricacion: actual.fabricacion, instalada_desde: actual.desde }] : []),
]);
await hacer("unidades", db.from("unidad").insert(unidades));

const { data: controles, error } = await db
  .from("control")
  .select("id, equipo_id, local_id, tipo_control_id")
  .in("local_id", idsLocales);
if (error) throw error;
const controlDe = (eq, loc, tipo) =>
  controles.find(
    (c) => c.tipo_control_id === TC[tipo] && c.local_id === LOC(loc) && (eq ? c.equipo_id === EQ(eq) : c.equipo_id === null),
  );

// La vida útil sale de la fabricación del cilindro instalado (20 años) aunque no esté en la lista.
for (const [n, loc, , , , , , , actual] of equipos) {
  if (actual && !fechas.some(([eq, , tipo]) => eq === n && tipo === "vida")) {
    fechas.push([n, loc, "vida", sumarMeses(actual.fabricacion, 240), actual.fabricacion, null]);
  }
}

for (const [eq, loc, tipo, vencimiento, ultima, ejecutor] of fechas) {
  const c = controlDe(eq, loc, tipo);
  if (!c) throw new Error(`No se creó el control ${tipo} del equipo ${eq} / local ${loc}`);
  await hacer(`fecha ${tipo}`, db.from("control").update({ vencimiento, ultima_fecha: ultima, ultimo_ejecutor: ejecutor }).eq("id", c.id));
}

await hacer(
  "historial",
  db.from("registro").insert(
    registros.map(([eq, loc, tipo, r]) => ({ ...r, control_id: controlDe(eq, loc, tipo).id, local_id: LOC(loc) })),
  ),
);
await hacer("pedidos", db.from("pedido").insert(pedidos));

const sinDatos = controles.length - fechas.length;
console.log(
  `Listo: ${clientes.length} clientes, ${locales.length} locales, ${equipos.length} equipos, ${controles.length} controles ` +
    `(${sinDatos} sin fecha), ${registros.length} registros y ${pedidos.length} pedidos. Fechas relativas a hoy (${H}).`,
);
