// Tipos del dominio. Reflejan el modelo de docs/propuesta-final.md §3.
// Las fechas sin hora van como texto ISO "AAAA-MM-DD".

export type FechaISO = string;

export type EstadoControl = "vencido" | "pronto" | "al_dia" | "sin_datos" | "suspendido";
export type UnidadPeriodo = "dia" | "mes" | "anio" | "manual";
export type BaseRecalculo = "desde_ejecucion" | "desde_vencimiento";
export type Rubro = "gastronomico" | "retail" | "farmacia" | "oficina" | "otro";

export interface Supervisor {
  id: string;
  nombre: string;
  telefono: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  razonSocial: string;
  cuit: string;
}

export interface Local {
  id: string;
  clienteId: string;
  nombre: string;
  direccion: string;
  barrio: string;
  rubro: Rubro;
  horarioAcceso: string;
  observaciones?: string;
  encargado: { nombre: string; telefono: string };
  supervisorId: string;
}

export interface Unidad {
  serie: string;
  fabricacion: FechaISO;
  instaladaDesde: FechaISO;
}

export interface Elemento {
  id: string;
  localId: string;
  tipo: string; // "Matafuego ABC 5 kg", "Tanque de agua"...
  codigo: string; // "ESP-MAT-01"
  ubicacion: string; // "Cocina, junto a la puerta trasera"
  qrToken: string;
  estado: "activo" | "en_servicio_externo" | "baja";
  unidad?: Unidad;
  unidadesAnteriores?: (Unidad & { retiradaEn: FechaISO })[];
}

export interface TipoControl {
  id: string;
  nombre: string; // "Recarga"
  periodoValor: number;
  periodoUnidad: UnidadPeriodo;
  base: BaseRecalculo;
  anticipacionDias: number;
  evidencia: string[]; // lo que hay que cargar para poder cerrar
  ejecutor: "SCP" | "tercero";
  norma?: string;
  verbo: string; // texto del botón: "Registrar recarga"
  hecho: string; // texto de confirmación: "Recarga registrada"
  satisfaceA?: string[]; // tipos que quedan cumplidos al hacer este (la prueba hidráulica cumple la recarga)
  dependeDeUnidad?: boolean; // se recalcula al cambiar la unidad física (prueba hidráulica, vida útil)
}

export interface Control {
  id: string;
  localId: string;
  elementoId?: string; // sin elemento = control del local (plagas, habilitación)
  tipoControlId: string;
  vencimiento?: FechaISO; // el vencimiento ABIERTO; undefined = sin datos
  ultimaEjecucion?: FechaISO;
  ultimoEjecutor?: string;
}

export type ResultadoEjecucion = "ok" | "reemplazo" | "observado" | "no_apto" | "no_realizado";

export interface Ejecucion {
  id: string;
  controlId: string;
  fecha: FechaISO;
  resultado: ResultadoEjecucion;
  vencimientoAnterior?: FechaISO;
  vencimientoNuevo?: FechaISO;
  origen: "relevamiento" | "calculado" | "certificado" | "ajuste_manual";
  oblea?: string;
  ejecutor: string;
  nota?: string;
}

export interface Pedido {
  id: string;
  localId: string;
  titulo: string;
  detalle: string;
  urgencia: "emergencia" | "urgente" | "normal";
  estado: "nuevo" | "aceptado" | "programado" | "resuelto";
  creado: string; // ISO con hora
  slaVence: string; // ISO con hora
  canal: "portal" | "whatsapp" | "telefono";
}
