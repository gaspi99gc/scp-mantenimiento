// Datos de ejemplo para diseñar las pantallas. Todo es ficticio.
// Las fechas se calculan relativas a hoy, así las pantallas siempre muestran un caso realista.
// Cuando exista Supabase, este archivo se reemplaza por consultas; las firmas de las funciones de abajo se mantienen.

import { estadoDe, hoy, sumarDias, sumarMeses } from "./fechas";
import type {
  Cliente, Control, Ejecucion, Elemento, EstadoControl, Informe, Local, Pedido, Supervisor, TipoControl, Visita,
} from "./tipos";

const H = hoy();
const d = (n: number) => sumarDias(H, n);
const m = (n: number) => sumarMeses(H, n);

export const supervisorActual: Supervisor = { id: "sup-1", nombre: "Matías Ferreyra", telefono: "+54 9 11 5555-0142" };
export const supervisores: Supervisor[] = [
  supervisorActual,
  { id: "sup-2", nombre: "Lorena Paz", telefono: "+54 9 11 5555-0187" },
];

export const clientes: Cliente[] = [
  { id: "cli-1", nombre: "Panadería La Espiga", razonSocial: "La Espiga S.R.L.", cuit: "30-71234567-8" },
  { id: "cli-2", nombre: "Bodegón Don Ernesto", razonSocial: "Ernesto Gastronomía S.A.", cuit: "30-70987654-3" },
  { id: "cli-3", nombre: "Óptica Visión Sur", razonSocial: "Visión Sur S.A.S.", cuit: "30-71555222-1" },
];

export const locales: Local[] = [
  {
    id: "loc-1", clienteId: "cli-1", nombre: "La Espiga Caballito", direccion: "Av. Rivadavia 5320", barrio: "Caballito",
    rubro: "gastronomico", horarioAcceso: "Lunes a sábado de 6 a 21 h", encargado: { nombre: "Sandra Gómez", telefono: "+54 9 11 4444-1201" },
    supervisorId: "sup-1",
  },
  {
    id: "loc-2", clienteId: "cli-1", nombre: "La Espiga Almagro", direccion: "Av. Corrientes 4185", barrio: "Almagro",
    rubro: "gastronomico", horarioAcceso: "Todos los días de 7 a 20 h", encargado: { nombre: "Ramiro Ibáñez", telefono: "+54 9 11 4444-3388" },
    supervisorId: "sup-1",
  },
  {
    id: "loc-3", clienteId: "cli-2", nombre: "Don Ernesto Palermo", direccion: "Gorriti 4870", barrio: "Palermo",
    rubro: "gastronomico", horarioAcceso: "Martes a domingo de 11 a 1 h. Cocina desde las 9 h",
    encargado: { nombre: "Ernesto Vidal", telefono: "+54 9 11 4444-7710" }, supervisorId: "sup-1",
  },
  {
    id: "loc-4", clienteId: "cli-3", nombre: "Visión Sur Shopping Caballito", direccion: "Ferrari 250, local 214", barrio: "Caballito",
    rubro: "retail", horarioAcceso: "Trabajos solo de 8 a 10 h, antes de que abra el shopping",
    requisitosAcceso: "Permiso de trabajo con 48 h de anticipación y nómina con ART",
    encargado: { nombre: "Paula Herrera", telefono: "+54 9 11 4444-2045" }, supervisorId: "sup-1",
  },
  {
    id: "loc-5", clienteId: "cli-3", nombre: "Visión Sur Belgrano", direccion: "Av. Cabildo 2140", barrio: "Belgrano",
    rubro: "retail", horarioAcceso: "Lunes a sábado de 10 a 20 h", encargado: { nombre: "Tomás Rey", telefono: "+54 9 11 4444-9932" },
    supervisorId: "sup-2",
  },
];

export const tiposControl: TipoControl[] = [
  {
    id: "tc-recarga", nombre: "Recarga", periodoValor: 12, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 10,
    evidencia: ["Foto de la tarjeta", "Número de oblea"], ejecutor: "tercero", norma: "IRAM 3517-2",
    verbo: "Registrar recarga", hecho: "Recarga registrada",
  },
  {
    id: "tc-ph", nombre: "Prueba hidráulica", periodoValor: 5, periodoUnidad: "anio", base: "desde_ejecucion", anticipacionDias: 60,
    evidencia: ["Certificado"], ejecutor: "tercero", norma: "IRAM 3517-2",
    verbo: "Registrar prueba hidráulica", hecho: "Prueba hidráulica registrada",
  },
  {
    id: "tc-vida", nombre: "Vida útil", periodoValor: 20, periodoUnidad: "anio", base: "desde_ejecucion", anticipacionDias: 90,
    evidencia: [], ejecutor: "SCP", norma: "IRAM 3517-2", verbo: "Registrar reemplazo", hecho: "Reemplazo registrado",
  },
  {
    id: "tc-tanque", nombre: "Limpieza y análisis", periodoValor: 6, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 20,
    evidencia: ["Certificado", "Análisis bacteriológico"], ejecutor: "tercero", norma: "Ley 3751 CABA",
    verbo: "Registrar limpieza", hecho: "Limpieza registrada",
  },
  {
    id: "tc-campana", nombre: "Limpieza de campana", periodoValor: 3, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 10,
    evidencia: ["Foto antes", "Foto después"], ejecutor: "SCP", verbo: "Registrar limpieza", hecho: "Limpieza registrada",
  },
  {
    id: "tc-grasera", nombre: "Limpieza de grasera", periodoValor: 3, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 10,
    evidencia: ["Foto antes", "Foto después"], ejecutor: "SCP", verbo: "Registrar limpieza", hecho: "Limpieza registrada",
  },
  {
    id: "tc-tablero", nombre: "Control de tablero", periodoValor: 6, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 15,
    evidencia: ["Checklist", "Foto del tablero"], ejecutor: "SCP", verbo: "Registrar control", hecho: "Control registrado",
  },
  {
    id: "tc-pat", nombre: "Medición de puesta a tierra", periodoValor: 12, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 30,
    evidencia: ["Protocolo firmado"], ejecutor: "tercero", norma: "Res. SRT 900/15",
    verbo: "Registrar medición", hecho: "Medición registrada",
  },
  {
    id: "tc-luces", nombre: "Prueba de autonomía", periodoValor: 3, periodoUnidad: "mes", base: "desde_ejecucion", anticipacionDias: 7,
    evidencia: ["Checklist"], ejecutor: "SCP", verbo: "Registrar prueba", hecho: "Prueba registrada",
  },
  {
    id: "tc-plagas", nombre: "Control de plagas", periodoValor: 1, periodoUnidad: "mes", base: "desde_vencimiento", anticipacionDias: 5,
    evidencia: ["Certificado"], ejecutor: "tercero", verbo: "Registrar control", hecho: "Control registrado",
  },
  {
    id: "tc-aire", nombre: "Service de aire", periodoValor: 12, periodoUnidad: "mes", base: "desde_vencimiento", anticipacionDias: 20,
    evidencia: ["Checklist", "Foto de filtros"], ejecutor: "SCP", verbo: "Registrar service", hecho: "Service registrado",
  },
];

export const elementos: Elemento[] = [
  // La Espiga Caballito
  {
    id: "el-1", localId: "loc-1", tipo: "Matafuego ABC 5 kg", codigo: "ESP1-MAT-01", ubicacion: "Salón, junto a la caja",
    qrToken: "q7f3k2", estado: "activo",
    unidad: { serie: "C-448120", fabricacion: "2019-03-10", instaladaDesde: m(-11) },
    unidadesAnteriores: [{ serie: "C-301877", fabricacion: "2015-08-02", instaladaDesde: "2021-02-15", retiradaEn: m(-11) }],
  },
  {
    id: "el-2", localId: "loc-1", tipo: "Matafuego ABC 5 kg", codigo: "ESP1-MAT-02", ubicacion: "Cuadra, junto al horno",
    qrToken: "p2m9x1", estado: "activo", unidad: { serie: "C-512093", fabricacion: "2021-06-21", instaladaDesde: m(-12) },
  },
  {
    id: "el-3", localId: "loc-1", tipo: "Matafuego CO₂ 3,5 kg", codigo: "ESP1-MAT-03", ubicacion: "Tablero principal",
    qrToken: "z8w4r6", estado: "activo", unidad: { serie: "K-220419", fabricacion: "2018-11-05", instaladaDesde: m(-12) },
  },
  { id: "el-4", localId: "loc-1", tipo: "Tanque de agua 1.000 l", codigo: "ESP1-TAN-01", ubicacion: "Terraza", qrToken: "t5n1v8", estado: "activo" },
  { id: "el-5", localId: "loc-1", tipo: "Campana de cuadra", codigo: "ESP1-CAM-01", ubicacion: "Cuadra", qrToken: "c3b7y2", estado: "activo" },
  { id: "el-6", localId: "loc-1", tipo: "Tablero eléctrico", codigo: "ESP1-TAB-01", ubicacion: "Pasillo de servicio", qrToken: "e6h2j9", estado: "activo" },
  // La Espiga Almagro
  {
    id: "el-7", localId: "loc-2", tipo: "Matafuego ABC 5 kg", codigo: "ESP2-MAT-01", ubicacion: "Salón",
    qrToken: "a1s5d3", estado: "activo", unidad: { serie: "C-600217", fabricacion: "2022-01-14", instaladaDesde: m(-4) },
  },
  { id: "el-8", localId: "loc-2", tipo: "Grasera", codigo: "ESP2-GRA-01", ubicacion: "Patio", qrToken: "g4f8h0", estado: "activo" },
  // Don Ernesto Palermo
  {
    id: "el-9", localId: "loc-3", tipo: "Matafuego ABC 10 kg", codigo: "DEP-MAT-01", ubicacion: "Cocina, junto a la puerta trasera",
    qrToken: "m2k6l4", estado: "en_servicio_externo", unidad: { serie: "C-389001", fabricacion: "2008-04-30", instaladaDesde: "2020-05-11" },
  },
  {
    id: "el-10", localId: "loc-3", tipo: "Matafuego ABC 5 kg", codigo: "DEP-MAT-02", ubicacion: "Salón, escalera",
    qrToken: "n7b3v5", estado: "activo", unidad: { serie: "C-577342", fabricacion: "2020-09-18", instaladaDesde: m(-10) },
  },
  { id: "el-11", localId: "loc-3", tipo: "Campana de cocina", codigo: "DEP-CAM-01", ubicacion: "Cocina", qrToken: "w9e1r7", estado: "activo" },
  { id: "el-12", localId: "loc-3", tipo: "Luces de emergencia (6)", codigo: "DEP-LUZ-01", ubicacion: "Salón y salidas", qrToken: "u3i8o2", estado: "activo" },
  { id: "el-13", localId: "loc-3", tipo: "Tanque de agua 2.000 l", codigo: "DEP-TAN-01", ubicacion: "Azotea", qrToken: "y6t2r4", estado: "activo" },
  // Visión Sur Shopping
  {
    id: "el-14", localId: "loc-4", tipo: "Matafuego ABC 5 kg", codigo: "VSC-MAT-01", ubicacion: "Detrás del mostrador",
    qrToken: "b8n4m1", estado: "activo", unidad: { serie: "C-610455", fabricacion: "2023-02-08", instaladaDesde: m(-3) },
  },
  { id: "el-15", localId: "loc-4", tipo: "Equipo de aire 4.500 fg", codigo: "VSC-AIR-01", ubicacion: "Salón", qrToken: "k1l9p3", estado: "activo" },
  { id: "el-16", localId: "loc-4", tipo: "Tablero eléctrico", codigo: "VSC-TAB-01", ubicacion: "Depósito", qrToken: "x5c7v2", estado: "activo" },
  // Visión Sur Belgrano
  {
    id: "el-17", localId: "loc-5", tipo: "Matafuego ABC 5 kg", codigo: "VSB-MAT-01", ubicacion: "Entrada",
    qrToken: "r4t6y8", estado: "activo", unidad: { serie: "C-598830", fabricacion: "2021-10-27", instaladaDesde: m(-6) },
  },
];

export const controles: Control[] = [
  // La Espiga Caballito: el caso del enunciado, matafuegos que vencen en pocos días
  { id: "co-1", localId: "loc-1", elementoId: "el-1", tipoControlId: "tc-recarga", vencimiento: d(6), ultimaEjecucion: sumarMeses(d(6), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-2", localId: "loc-1", elementoId: "el-1", tipoControlId: "tc-ph", vencimiento: "2029-03-10", ultimaEjecucion: "2024-03-10", ultimoEjecutor: "Recargas Norte" },
  { id: "co-3", localId: "loc-1", elementoId: "el-1", tipoControlId: "tc-vida", vencimiento: "2039-03-10", ultimaEjecucion: "2019-03-10" },
  { id: "co-4", localId: "loc-1", elementoId: "el-2", tipoControlId: "tc-recarga", vencimiento: d(6), ultimaEjecucion: sumarMeses(d(6), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-5", localId: "loc-1", elementoId: "el-2", tipoControlId: "tc-ph", vencimiento: d(40), ultimaEjecucion: sumarMeses(d(40), -60), ultimoEjecutor: "Recargas Norte" },
  { id: "co-6", localId: "loc-1", elementoId: "el-2", tipoControlId: "tc-vida", vencimiento: "2041-06-21", ultimaEjecucion: "2021-06-21" },
  { id: "co-7", localId: "loc-1", elementoId: "el-3", tipoControlId: "tc-recarga", vencimiento: d(6), ultimaEjecucion: sumarMeses(d(6), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-8", localId: "loc-1", elementoId: "el-3", tipoControlId: "tc-ph", ultimoEjecutor: undefined },
  { id: "co-9", localId: "loc-1", elementoId: "el-4", tipoControlId: "tc-tanque", vencimiento: d(51), ultimaEjecucion: sumarMeses(d(51), -6), ultimoEjecutor: "Aguas Claras S.A." },
  { id: "co-10", localId: "loc-1", elementoId: "el-5", tipoControlId: "tc-campana", vencimiento: d(21), ultimaEjecucion: sumarMeses(d(21), -3), ultimoEjecutor: "SCP" },
  { id: "co-11", localId: "loc-1", elementoId: "el-6", tipoControlId: "tc-tablero", vencimiento: d(97), ultimaEjecucion: sumarMeses(d(97), -6), ultimoEjecutor: "SCP" },
  { id: "co-12", localId: "loc-1", tipoControlId: "tc-plagas", vencimiento: d(3), ultimaEjecucion: sumarMeses(d(3), -1), ultimoEjecutor: "Fumigadora Sur" },
  { id: "co-13", localId: "loc-1", tipoControlId: "tc-pat", vencimiento: d(140), ultimaEjecucion: sumarMeses(d(140), -12), ultimoEjecutor: "Ing. Carla Domínguez" },
  // La Espiga Almagro
  { id: "co-14", localId: "loc-2", elementoId: "el-7", tipoControlId: "tc-recarga", vencimiento: d(244), ultimaEjecucion: sumarMeses(d(244), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-15", localId: "loc-2", elementoId: "el-8", tipoControlId: "tc-grasera", vencimiento: d(-4), ultimaEjecucion: sumarMeses(d(-4), -3), ultimoEjecutor: "SCP" },
  { id: "co-16", localId: "loc-2", tipoControlId: "tc-plagas", vencimiento: d(12), ultimaEjecucion: sumarMeses(d(12), -1), ultimoEjecutor: "Fumigadora Sur" },
  // Don Ernesto Palermo
  { id: "co-17", localId: "loc-3", elementoId: "el-9", tipoControlId: "tc-recarga", vencimiento: d(-2), ultimaEjecucion: sumarMeses(d(-2), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-18", localId: "loc-3", elementoId: "el-9", tipoControlId: "tc-ph", vencimiento: d(-2), ultimaEjecucion: sumarMeses(d(-2), -60), ultimoEjecutor: "Recargas Norte" },
  { id: "co-19", localId: "loc-3", elementoId: "el-9", tipoControlId: "tc-vida", vencimiento: "2028-04-30", ultimaEjecucion: "2008-04-30" },
  { id: "co-20", localId: "loc-3", elementoId: "el-10", tipoControlId: "tc-recarga", vencimiento: d(58), ultimaEjecucion: sumarMeses(d(58), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-21", localId: "loc-3", elementoId: "el-11", tipoControlId: "tc-campana", vencimiento: d(-9), ultimaEjecucion: sumarMeses(d(-9), -3), ultimoEjecutor: "SCP" },
  { id: "co-22", localId: "loc-3", elementoId: "el-12", tipoControlId: "tc-luces", vencimiento: d(5), ultimaEjecucion: sumarMeses(d(5), -3), ultimoEjecutor: "SCP" },
  { id: "co-23", localId: "loc-3", elementoId: "el-13", tipoControlId: "tc-tanque" },
  { id: "co-24", localId: "loc-3", tipoControlId: "tc-plagas", vencimiento: d(1), ultimaEjecucion: sumarMeses(d(1), -1), ultimoEjecutor: "Fumigadora Sur" },
  // Visión Sur Shopping
  { id: "co-25", localId: "loc-4", elementoId: "el-14", tipoControlId: "tc-recarga", vencimiento: d(275), ultimaEjecucion: sumarMeses(d(275), -12), ultimoEjecutor: "Recargas Norte" },
  { id: "co-26", localId: "loc-4", elementoId: "el-15", tipoControlId: "tc-aire", vencimiento: d(9), ultimaEjecucion: sumarMeses(d(9), -12), ultimoEjecutor: "SCP" },
  { id: "co-27", localId: "loc-4", elementoId: "el-16", tipoControlId: "tc-tablero", vencimiento: d(33), ultimaEjecucion: sumarMeses(d(33), -6), ultimoEjecutor: "SCP" },
  // Visión Sur Belgrano
  { id: "co-28", localId: "loc-5", elementoId: "el-17", tipoControlId: "tc-recarga", vencimiento: d(183), ultimaEjecucion: sumarMeses(d(183), -12), ultimoEjecutor: "Recargas Norte" },
];

export const visitas: Visita[] = [
  {
    id: "vi-1", localId: "loc-3", fecha: H, franja: "9 a 11 h", tipo: "preventiva", estado: "en_curso",
    controlIds: ["co-17", "co-18", "co-21", "co-22", "co-24"], supervisorId: "sup-1",
    nota: "El matafuego de cocina está en el taller; dejamos el sustituto C-700112.",
  },
  {
    id: "vi-2", localId: "loc-1", fecha: d(2), franja: "8 a 10 h", tipo: "preventiva", estado: "programada",
    controlIds: ["co-1", "co-4", "co-7", "co-12"], supervisorId: "sup-1",
  },
  {
    id: "vi-3", localId: "loc-4", fecha: d(4), franja: "8 a 10 h", tipo: "preventiva", estado: "programada",
    controlIds: ["co-26"], supervisorId: "sup-1", nota: "Permiso de trabajo pedido al shopping.",
  },
  {
    id: "vi-4", localId: "loc-1", fecha: d(-88), franja: "8 a 10 h", tipo: "preventiva", estado: "cerrada",
    controlIds: ["co-10"], supervisorId: "sup-1",
  },
  {
    id: "vi-5", localId: "loc-2", fecha: d(-6), franja: "15 a 17 h", tipo: "correctiva", estado: "fallida",
    controlIds: ["co-15"], supervisorId: "sup-1", nota: "Local cerrado por inventario. Foto de la persiana tomada a las 15:20.",
  },
];

export const ejecuciones: Ejecucion[] = [
  { id: "ej-1", controlId: "co-10", visitaId: "vi-4", fecha: d(-69), resultado: "ok", vencimientoAnterior: d(-67), vencimientoNuevo: d(21), origen: "calculado", ejecutor: "SCP" },
  { id: "ej-2", controlId: "co-1", fecha: sumarMeses(d(6), -12), resultado: "reemplazo", vencimientoAnterior: sumarMeses(d(6), -12), vencimientoNuevo: d(6), origen: "certificado", oblea: "0045821", ejecutor: "Recargas Norte", nota: "Se reemplazó la unidad C-301877 por C-448120." },
  { id: "ej-3", controlId: "co-1", fecha: sumarMeses(d(6), -24), resultado: "ok", vencimientoAnterior: sumarMeses(d(6), -24), vencimientoNuevo: sumarMeses(d(6), -12), origen: "calculado", oblea: "0031177", ejecutor: "Recargas Norte" },
  { id: "ej-4", controlId: "co-2", fecha: "2024-03-10", resultado: "ok", vencimientoNuevo: "2029-03-10", origen: "certificado", ejecutor: "Recargas Norte" },
];

export const informes: Informe[] = [
  {
    id: "inf-1", numero: "SCP-2026-000118", visitaId: "vi-4", localId: "loc-1", fecha: d(-88), estado: "publicado",
    resumen: "Limpieza completa de la campana de la cuadra y del primer tramo de conducto. Se cambiaron los filtros metálicos.",
    trabajos: ["Limpieza de campana y filtros", "Cambio de 3 filtros metálicos", "Ajuste de la tapa de inspección del conducto"],
    recomendaciones: ["El motor del extractor hace ruido en los rulemanes. Conviene cambiarlos en los próximos 2 meses."],
    fotos: [
      { id: "f1", epigrafe: "Campana antes de la limpieza", etapa: "antes", visibleCliente: true },
      { id: "f2", epigrafe: "Campana después de la limpieza", etapa: "despues", visibleCliente: true },
      { id: "f3", epigrafe: "Filtros nuevos colocados", etapa: "despues", visibleCliente: true },
    ],
    firma: { nombre: "Sandra Gómez", dni: "28.441.903" },
    subsanaciones: [
      {
        id: "sub-1", fecha: d(-86), motivo: "Dato mal cargado",
        texto: "Se cambiaron 3 filtros metálicos, no 2 como decía el resumen original.", autor: "Matías Ferreyra",
      },
    ],
  },
  {
    id: "inf-2", numero: "SCP-2026-000131", visitaId: "vi-1", localId: "loc-3", fecha: H, estado: "borrador",
    resumen: "",
    trabajos: [],
    recomendaciones: [],
    fotos: [],
    subsanaciones: [],
  },
];

export const pedidos: Pedido[] = [
  {
    id: "pe-1", localId: "loc-3", titulo: "Pérdida de agua bajo la bacha de la cocina", detalle: "Gotea desde anoche, pusimos un balde.",
    urgencia: "urgente", estado: "nuevo", creado: `${H}T08:12:00-03:00`, slaVence: `${d(1)}T08:12:00-03:00`, canal: "portal",
  },
  {
    id: "pe-2", localId: "loc-4", titulo: "Tubo del cartel de la vidriera apagado", detalle: "Es el de la izquierda.",
    urgencia: "normal", estado: "aceptado", creado: `${d(-1)}T17:40:00-03:00`, slaVence: `${d(2)}T17:40:00-03:00`, canal: "whatsapp",
  },
];

// ——— Consultas (mismas firmas que tendrán con Supabase) ———

export const tipoDe = (control: Control): TipoControl => tiposControl.find((t) => t.id === control.tipoControlId)!;
export const localDe = (id: string) => locales.find((l) => l.id === id);
export const clienteDe = (id: string) => clientes.find((c) => c.id === id);
export const elementoDe = (id: string) => elementos.find((e) => e.id === id);
export const visitaDe = (id: string) => visitas.find((v) => v.id === id);
export const informeDe = (id: string) => informes.find((i) => i.id === id);

export const elementosDeLocal = (localId: string) => elementos.filter((e) => e.localId === localId);
export const controlesDeLocal = (localId: string) => controles.filter((c) => c.localId === localId);
export const controlesDeElemento = (elementoId: string) => controles.filter((c) => c.elementoId === elementoId);
export const ejecucionesDeControl = (controlId: string) =>
  ejecuciones.filter((e) => e.controlId === controlId).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
export const visitasDeLocal = (localId: string) => visitas.filter((v) => v.localId === localId);
export const informesDeLocal = (localId: string) => informes.filter((i) => i.localId === localId);
export const pedidosDeLocal = (localId: string) => pedidos.filter((p) => p.localId === localId);

/** La visita abierta (programada o en curso) que incluye este control, si hay. */
export const visitaProgramadaDe = (controlId: string) =>
  visitas.find((v) => (v.estado === "programada" || v.estado === "en_curso") && v.controlIds.includes(controlId));

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
 * Regla cruzada (§3.3 de la propuesta): con la prueba hidráulica del cilindro vencida
 * no se puede registrar una recarga; hay que reemplazar la unidad o hacer primero la prueba.
 */
export function bloqueoDe(c: Control): { texto: string; permiteReemplazo: boolean } | undefined {
  if (c.tipoControlId !== "tc-recarga" || !c.elementoId) return undefined;
  const ph = controles.find((x) => x.elementoId === c.elementoId && x.tipoControlId === "tc-ph");
  if (!ph?.vencimiento || estadoControl(ph) !== "vencido") return undefined;
  const [a, mm, dd] = ph.vencimiento.split("-");
  return {
    texto: `La prueba hidráulica de este cilindro venció el ${dd}/${mm}/${a}. No se puede registrar la recarga: reemplazá la unidad o registrá primero la prueba hidráulica.`,
    permiteReemplazo: true,
  };
}
