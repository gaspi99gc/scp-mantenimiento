# SCP Mantenimiento: propuesta final consolidada

> Versión 1.0 · 12/10/2026 · Auditoría y síntesis de 5 propuestas independientes (`docs/propuestas-agentes/agente-1..5.md`).
> Es una propuesta de producto y arquitectura, todavía sin código. La etapa siguiente es el diseño de la base de datos (§11).

---

## Parte A. Auditoría de las 5 propuestas

### A.1 Cómo se hizo

Cinco agentes recibieron el mismo brief y trabajaron sin ver lo que hacían los otros. Leí las cinco enteras y para cada decisión me hice dos preguntas: qué decidieron y si esa decisión se sostiene con 1 o 2 desarrolladores, presupuesto chico y un supervisor cargando datos desde el celular en un sótano.

**Aclaración honesta:** los cinco agentes son el mismo modelo, así que cuando coinciden la señal es buena pero no del todo independiente. Por eso verifiqué cada consenso contra los requisitos y no solo conté votos.

### A.2 Lo que propusieron todos (consenso 5/5)

| Tema | Decisión común | Mi veredicto |
|---|---|---|
| Arquitectura | Un solo monolito **Django + PostgreSQL + HTMX**, sin SPA ni microservicios | ✅ Se mantiene. Es lo más barato de construir y mantener con un equipo chico |
| Elemento | Representa el **puesto** (la ubicación fija), no la unidad física | ✅ Se mantiene y lo refino con una entidad `Unidad` (§A.4) |
| Controles | Un elemento puede tener **varios controles**: recarga, prueba hidráulica, vida útil | ✅ Se mantiene |
| Recálculo | Configurable por tipo de control: **desde la ejecución** o **desde el vencimiento anterior** | ✅ Se mantiene |
| Estado | El semáforo **se calcula al consultar** contra la fecha de hoy; no se guarda | ✅ Se mantiene. Si falla un job, el estado no queda viejo |
| Informes | Lo publicado **no se edita**: las correcciones salen como versión nueva, con hash y firma | ✅ Se mantiene. El informe puede terminar en manos de un inspector o una aseguradora |
| Valor para el cliente | **Carpeta de inspección** en PDF y **resumen mensual** del abono | ✅ Se mantiene. Es lo que justifica pagar el abono |
| Fotos y PDF | Cloudflare R2 con URLs firmadas, compresión en el celular, WeasyPrint | ✅ Se mantiene |
| Tareas en segundo plano | Cola sobre Postgres, sin Redis | ✅ Se mantiene |
| Seguridad | Un único filtro `visible_para(usuario)` y tests de acceso cruzado entre clientes | ✅ Se mantiene |
| Ejemplo de los 6 meses | Las cinco notaron que la recarga del matafuego suele ser **anual** (IRAM 3517-2) | ✅ Es la pregunta n.º 1 para el dueño |

### A.3 Dónde difieren y qué decidí

| Tema | Opciones | Decisión | Por qué |
|---|---|---|---|
| **Cómo se guarda el vencimiento** | (a) `Control` con fecha cacheada más ejecuciones (agentes 3 y 4); (b) **cadena de `Vencimiento`**, una fila por cada fecha, con un índice que garantiza uno solo abierto (agentes 2 y 5); (c) vencimiento editable más historial de renovaciones (agente 1) | **(b), con ejecuciones inmutables** | Cada fecha tiene su propia fila, y eso simplifica tres cosas: los avisos sin duplicados (la clave es el vencimiento), la métrica "cumplido a tiempo" (comparar dos fechas) y el bloqueo de doble carga (lo impide el índice) |
| **"Programado"** | Estado guardado en el vencimiento (agentes 2 y 5) | **Se deriva** de que haya una visita abierta que lo incluya | Si la visita se cancela, el estado no queda colgado |
| **Fecha del certificado** | Una tercera base de recálculo (agente 2) o una regla de prioridad (los demás) | **Regla de prioridad**: certificado > ajuste manual con motivo > cálculo | La fecha del certificado no es una forma de contar: reemplaza el resultado |
| **La prueba hidráulica también cumple la recarga** | Solo el agente 5 lo trae (`satisface_a`) | ✅ Se incorpora | Es como funciona en la práctica y evita cargar dos veces |
| **Prueba hidráulica vencida bloquea la recarga** | Solo el agente 3 | ✅ Se incorpora como validación | Evita registrar una recarga ilegal |
| **QR en el elemento** | Desde el MVP (agentes 1 y 4) o recién en fase 3 (agente 5) | **MVP** | Cuesta poco (un PDF de etiquetas) y ataca el riesgo n.º 1, que el supervisor no cargue datos |
| **Página pública del QR sin login** | Fase 2 (agente 3) | **Fase 3, opcional por local y con datos mínimos** | Sin login, cualquiera podría ver el estado de seguridad de un local |
| **Resumen para el supervisor** | Diario (4 agentes) o semanal (agente 5) | **Diario, en días hábiles** | Con anticipaciones de 5 a 10 días, un resumen semanal llega tarde |
| **Pedidos del cliente** | En el MVP (agentes 1 y 3) o en fase 2 (agentes 2, 4 y 5) | **Pedido básico en el MVP**; SLA y escalamiento en fase 2 | Sin un canal de pedidos, el cliente sigue por WhatsApp y el portal no se usa |
| **WhatsApp** | Cloud API en fase 2 o 3, o links `wa.me` sin costo (agente 3) | **Links `wa.me` en el MVP**, Cloud API en fase 3 | Costo cero y llega por el canal que el cliente ya usa |
| **Hosting** | PaaS (Render o Railway) o VPS con Docker | **PaaS para el MVP**; VPS cuando haya alguien que lo opere | Sin servidor que administrar hasta que el volumen lo justifique |

### A.4 Huecos que ninguna cubrió bien (aportes del auditor)

1. **Obras y trabajos de varios días.** El negocio incluye obras, pintura, durlock e impermeabilizaciones, y las cinco propuestas se centran en los vencimientos. Una obra dura varios días y tiene avance, fotos por etapa y garantía. → Agrego la entidad **`Obra`**. Al cerrarla, la **garantía y la revisión posterior se crean como controles con vencimiento**; por ejemplo, revisión anual de la membrana antes de la temporada de lluvias.
2. **Mantenimiento estacional.** Desagües y canaletas antes de las lluvias, aires acondicionados antes del verano, calefacción antes del invierno. → Se resuelve con la base `DESDE_VENCIMIENTO` y una fecha ancla anual. No hace falta una entidad nueva, pero va precargado en el catálogo.
3. **Unidad física.** Los agentes 1 y 3 guardan el cilindro como un campo del elemento, y así se pierde el historial de cilindros. El agente 4 lo guarda en la ejecución, y así cuesta consultar la prueba hidráulica del cilindro que está instalado. → Agrego la entidad **`Unidad`** (n.º de serie, fecha de fabricación, última prueba hidráulica, desde/hasta). Los controles que dependen del cilindro (prueba hidráulica, vida útil) se recalculan solos cuando se cambia la unidad.
4. **Rentabilidad del abono.** En el "todo incluido", el riesgo de SCP es un local que cuesta más de lo que paga. Ninguna propuesta junta ese dato desde el principio. → En el MVP se registran **horas y materiales por visita** (opcional y rápido de cargar). El reporte de rentabilidad por local llega en fase 3, pero los datos se acumulan desde el día 1.
5. **Concurrencia.** Si dos personas registran el mismo control al mismo tiempo, solo el índice único no alcanza para dar un buen mensaje de error. → La fila del control se bloquea (`SELECT … FOR UPDATE`) dentro de la transacción del recálculo, y además está el índice único como respaldo.
6. **Ejecución muy anticipada con base desde la ejecución.** El cliente pierde días de vigencia (el agente 5 lo menciona). → El sistema avisa antes de confirmar: "Se adelanta 25 días; ¿contar desde el vencimiento anterior?".

### A.5 Calificación de cada propuesta

| Agente | Lo mejor | Lo más débil | Qué tomé |
|---|---|---|---|
| 1 | Flujo de alta del cliente bien pensado; cuentas de costo y almacenamiento | Vencimiento editable con historial aparte; interpreta los "6 meses" como control visual sin base | Onboarding, visita fallida, aviso de emergencia en pedidos |
| 2 | Recálculo más preciso, con el ejemplo resuelto con números; OT con estado `ESPERANDO_TERCERO` | Toma la fecha del certificado como base de cálculo | Cadena de vencimientos, carga de pedidos de WhatsApp, métricas de éxito |
| 3 | La mejor visión de negocio ("¿estoy al día?" y "¿qué hicieron por mí?"); regla de la prueba hidráulica; proveedores con habilitación | QR público demasiado pronto; VPS con Docker para un equipo sin operaciones | Regla de prueba hidráulica, proveedores, "ya que vas", links `wa.me` |
| 4 | La más operativa: requisitos de acceso a shoppings, visita fallida, anulación con recálculo | Vencimiento cacheado en el control (hay que mantenerlo sincronizado) | Requisitos de acceso, anulación, evidencia por tipo, criterio de éxito del piloto |
| 5 | `satisface_a`, evidencia obligatoria para cerrar, cadena de obligaciones | QR recién en fase 3; resumen al supervisor solo semanal | `satisface_a`, evidencia obligatoria, plantillas por rubro |

---

## Parte B. Propuesta final

## 1. Resumen y supuestos

**Qué es:** una sola aplicación web, instalable en el celular (PWA), con dos caras:

- **Backoffice de SCP**, para que el supervisor cargue desde el local con el celular en la mano.
- **Portal del cliente**, para consultar y hacer pedidos.

**La idea central:** el comercio no compra mantenimiento; compra **estar en regla y sin sorpresas**. El portal tiene que contestar en 10 segundos dos preguntas: *"¿estoy al día?"* y *"¿qué hizo SCP por mí este mes?"*. La segunda es la que sostiene el abono.

**El mecanismo:** cada visita se carga una sola vez y produce dos cosas:

1. **El informe** que ve el cliente (web y PDF, inmutable).
2. **El recálculo automático de los vencimientos** de lo que se trabajó.

**Supuestos (a validar con el dueño):**

| # | Supuesto |
|---|---|
| S1 | Hay un solo prestador, SCP. No es un SaaS para otras empresas, pero sí maneja muchos clientes y locales (incluidas cadenas con sucursales) |
| S2 | Año 1: hasta 100 clientes, 400 locales, 5.000 elementos y 1 a 5 supervisores. Con un solo Postgres sobra |
| S3 | En el MVP cargan los supervisores. El rol de técnico queda previsto para la fase 3 |
| S4 | Algunos controles los hace un **tercero habilitado** (recargadora, tanques, plagas, matriculado de puesta a tierra o gas). SCP coordina y adjunta el certificado, que es la verdad legal |
| S5 | La facturación del abono (ARCA) queda afuera. El abono se guarda como dato del contrato |
| S6 | Zona inicial: CABA y AMBA. La normativa cambia según la jurisdicción, así que **ninguna periodicidad va fija en el código** |
| S7 | Los vencimientos son fechas sin hora, en horario de Buenos Aires. Un vencimiento del 20/11 vale todo ese día |
| S8 | Las emergencias (gas, riesgo eléctrico, inundación) van **primero por teléfono de guardia**. La app no reemplaza esa llamada |

## 2. Roles y permisos

| Rol | Alcance | Ve | Puede |
|---|---|---|---|
| **Admin SCP** | Todo | Todo, incluidas auditoría, costos y rentabilidad | Catálogos, periodicidades, clientes, abonos, usuarios, anulaciones, reasignar carteras |
| **Supervisor** | Su cartera (lectura del resto) | Todo lo de sus locales, con notas internas | Elementos, controles, visitas, obras, informes (los publica), pedidos y hallazgos |
| **Técnico** *(fase 3)* | Sus visitas asignadas | Lo necesario para trabajar | Cargar ejecuciones y fotos; **no publica** |
| **Cliente admin** | Todos los locales de su empresa | Solo lo publicado y visible para el cliente | Crear pedidos, invitar o quitar encargados, pedir presupuesto |
| **Encargado de local** | Sus locales | Lo mismo, limitado a sus locales | Crear pedidos, firmar conformidad, confirmar o reabrir |

**Reglas de seguridad (no negociables):**

- Una `Membresia(usuario, cliente, rol, locales[] | todos)` define el alcance de cada usuario. Un usuario puede tener membresías en varios clientes (por ejemplo, franquicias).
- **Toda** consulta del portal pasa por un único filtro `visible_para(usuario)`. Nunca se busca un registro solo por el ID de la URL. Cada endpoint tiene su test automático de que el cliente A no ve los datos del cliente B (IDOR).
- Notas, adjuntos, montos y hallazgos tienen visibilidad `INTERNA` o `CLIENTE`. El cliente nunca ve borradores, notas internas ni costos.
- Los archivos se guardan en un bucket privado y se sirven con una URL firmada de 10 minutos, después de chequear el permiso.
- Nada se borra: se **anula con motivo**, y queda auditado quién, qué, cuándo, el valor anterior y el nuevo.
- Acceso: **link mágico** para los clientes (los encargados rotan y no recuerdan contraseñas), de un solo uso y válido por 15 minutos. Contraseña para SCP y **doble factor** para los admins. Límite de intentos de login.

## 3. Modelo de dominio

```
Cliente 1─N Local 1─N Elemento(puesto) 1─N Unidad (cilindro / equipo físico)
  │           │            │
  │           │            └─1─N Control N─1 TipoControl ──N─N satisface_a
  │           ├─1─N Control  (controles del local: plagas, habilitación, seguro)
  │           │                   └─1─N Vencimiento (cadena; 1 solo ABIERTO)
  │           │                                └─0..1 Ejecucion (inmutable) N─1 Visita
  │           ├─1─N Visita 1─N Trabajo        └─0..1 Proveedor
  │           │       └─1─N Informe (versionado) ─N Adjunto
  │           ├─1─N Obra 1─N Visita ; Obra ─(al cerrar)→ Control de garantía
  │           ├─1─N Pedido ─0..1→ Visita | Obra
  │           ├─1─N Hallazgo ─0..1→ Pedido / Obra (presupuesto)
  │           └─1─1 Abono (vigente)
  └─1─N Membresia N─1 Usuario
```

### 3.1 Catálogos (los administra SCP)

- **TipoElemento:** matafuego ABC 5 kg, matafuego CO₂, tanque de reserva, campana y conducto, tablero, luz de emergencia, termotanque, split, membrana… Cada tipo tiene un `atributos_schema` en JSON (capacidad, agente, potencia…) y una marca `usa_unidad` (si lleva n.º de serie que puede cambiar).
- **TipoControl** (la regla de vencimiento):
  - `aplica_a`: elemento o local.
  - `periodo_valor` + `periodo_unidad` (días, meses, años o `MANUAL`, cuando la fecha la dice el documento).
  - `base`: `DESDE_EJECUCION` (por defecto) o `DESDE_VENCIMIENTO` (calendario fijo, estacionales).
  - `anticipacion_dias`.
  - `evidencia_requerida`: foto de oblea o tarjeta, certificado PDF, n.º de precinto, protocolo firmado.
  - `requiere_proveedor_habilitado`, `ejecutor_habitual` (SCP o tercero).
  - `depende_de_unidad`: la prueba hidráulica y la vida útil siguen al cilindro.
  - `satisface_a`: tipos que quedan cumplidos al hacer este (la prueba hidráulica cumple la recarga).
  - `visible_cliente`, `referencia_normativa`, `checklist`.
- **PlantillaRubro:** el rubro "Gastronómico" crea de una vez matafuegos, tanque, campana, grasera, tablero, disyuntores, luces de emergencia, plagas y gas.
- **Proveedor:** razón social, CUIT, rubro, matrícula o habilitación con **su propio vencimiento**. El sistema avisa si se carga una ejecución con un proveedor de habilitación vencida.

### 3.2 Entidades operativas

- **Cliente:** razón social, CUIT (único), nombre de fantasía, contactos, estado.
- **Local:** cliente, nombre o sucursal, dirección, localidad, **jurisdicción**, zona (para armar recorridos), rubro, horario de acceso, **requisitos de acceso** (en shoppings: permiso de trabajo con X horas, nómina con ART/AP, horario nocturno), quién tiene las llaves, supervisor asignado, estado (`ACTIVO`, `CERRADO_TEMPORAL`, `BAJA`).
- **Abono:** local, vigencia, monto, rubros incluidos, exclusiones, visitas preventivas por mes, SLA por urgencia, guardia 24 h (sí o no).
- **Elemento** (el **puesto**): local, tipo, código (`PAL-MAT-03`), ubicación ("Cocina, junto a la puerta trasera"), atributos, `qr_token`, estado (`ACTIVO`, `EN_SERVICIO_EXTERNO`, `BAJA`).
- **Unidad** (el objeto físico): elemento, n.º de serie o cilindro, fecha de fabricación, fecha de la última prueba hidráulica, `instalada_desde`, `retirada_en`. Solo para los tipos con `usa_unidad`.
- **Control:** el plan de un elemento o de un local para un tipo de control, con `periodo_override` y `anticipacion_override` opcionales (con motivo), y `suspendido` con motivo.
- **Vencimiento:** control, `fecha` (DATE), estado (`ABIERTO`, `CUMPLIDO`, `ANULADO`), origen (`RELEVAMIENTO`, `CALCULADO`, `CERTIFICADO`, `AJUSTE_MANUAL`), motivo, la ejecución que lo creó y la que lo cumplió. **Un solo vencimiento abierto por control**, garantizado por la base. **La cadena de vencimientos es el historial.**
- **Visita:** local, tipo (`PREVENTIVA`, `CORRECTIVA`, `EMERGENCIA`, `RELEVAMIENTO`, `OBRA`), estado (`PROGRAMADA`, `EN_CURSO`, `CERRADA`, `FALLIDA`, `CANCELADA`), fecha programada, check-in y check-out, supervisor, horas, firma de conformidad (nombre, DNI, imagen), motivo si fue fallida, notas internas. Los **vencimientos planificados** se vinculan a la visita, y de ese vínculo sale el estado "programado".
- **Ejecucion** (inmutable): control, el vencimiento que cierra, visita, **fecha real de ejecución** (la de la tarjeta, no la de carga), resultado (`OK`, `OBSERVADO`, `REEMPLAZO`, `NO_APTO`, `NO_REALIZADO`), ejecutor (SCP o proveedor), n.º de oblea o certificado, fecha de vencimiento del certificado, `vencimiento_calculado`, `vencimiento_asignado`, motivo de ajuste, unidad, y anulación con motivo.
- **Trabajo:** lo que se hizo en una visita fuera de los controles ("cambié 3 tubos LED"): rubro, descripción, materiales, `fuera_de_abono`, pedido de origen.
- **Obra:** local, título, alcance, rubro (pintura, durlock, impermeabilización, construcción), estado (`PRESUPUESTADA`, `APROBADA`, `EN_CURSO`, `FINALIZADA`), avance %, dentro del abono o con presupuesto, `garantia_meses`. Tiene varias visitas. Al finalizar crea los **controles de garantía o revisión** correspondientes.
- **Hallazgo:** algo detectado y no resuelto ("membrana fisurada en el sector norte"), con severidad, recomendación, foto, visibilidad y estado (`ABIERTO`, `PRESUPUESTADO`, `RESUELTO`, `DESCARTADO`). De acá salen los correctivos y los presupuestos.
- **Pedido:** local, autor, canal (`PORTAL`, `WHATSAPP`, `TELEFONO`, `EMAIL`), rubro, urgencia (`EMERGENCIA`, `URGENTE`, `NORMAL`), estado (`NUEVO`, `ACEPTADO`, `PROGRAMADO`, `ESPERANDO_TERCERO`, `RESUELTO`, `CERRADO`, `RECHAZADO`), `sla_vence_at`, si entra en el abono, visita u obra vinculada.
- **Informe:** visita u obra, número correlativo (`SCP-2026-000123`), versión, estado (`BORRADOR`, `PUBLICADO`, `REEMPLAZADO`), resumen, recomendaciones, PDF, **hash SHA-256**, QR de verificación, quién lo publicó y cuándo.
- **Adjunto:** clave en el storage, hash, tipo de archivo, fecha de captura, etapa (`ANTES`, `DESPUES`, `CERTIFICADO`, `HALLAZGO`), visibilidad para el cliente.
- **Notificacion** (outbox): evento, destinatario, canal, plantilla, **clave de idempotencia única**, estado e intentos.
- **Auditoria:** quién, qué, cuándo, valor anterior, valor nuevo.

### 3.3 Periodicidad y recálculo (el corazón del sistema)

El recálculo vive en **un único servicio de dominio**, con tests unitarios, que corre **en una sola transacción** al confirmar una ejecución:

```
registrar_ejecucion(control, fecha_ejecucion, resultado, datos):
  1. Bloquear la fila del control (SELECT … FOR UPDATE).
  2. v = vencimiento ABIERTO del control (si no hay: es la carga inicial).
  3. Validaciones:
     - Falta la evidencia que pide el tipo → no se puede confirmar.
     - Recarga con la prueba hidráulica de la unidad vencida → bloqueo; se sugiere REEMPLAZO.
     - Proveedor con la habilitación vencida → advertencia.
  4. Si resultado ∈ {NO_APTO, NO_REALIZADO} → v queda ABIERTO, se crea un Hallazgo. Fin.
  5. periodo = control.periodo_override ?? tipo.periodo
     base    = fecha_ejecucion                si tipo.base = DESDE_EJECUCION
             = v.fecha                        si tipo.base = DESDE_VENCIMIENTO
               (si v.fecha + periodo queda en el pasado → se usa fecha_ejecucion)
     calculado = sumar_periodo(base, periodo)   // tope a fin de mes: 31/08 + 6 m = 28/02
  6. asignado, origen = prioridad:
       fecha del certificado  → CERTIFICADO
       ajuste del supervisor  → AJUSTE_MANUAL (motivo obligatorio)
       si no                  → calculado, CALCULADO
  7. v.estado = CUMPLIDO; se crea Vencimiento(ABIERTO, fecha = asignado).
  8. Para cada tipo en satisface_a del mismo elemento → se repiten los pasos 5 a 7.
  9. Si hubo REEMPLAZO de unidad → se recalculan los controles con depende_de_unidad
     a partir de los datos de la unidad nueva.
```

**Ejemplo del enunciado.** El matafuego vence el **20/11/2026**, tiene 10 días de anticipación y una periodicidad de 6 meses. SCP lo cambia el **13/11**:

| Base | Nuevo vencimiento |
|---|---|
| `DESDE_EJECUCION` (recomendada para matafuegos: coincide con la tarjeta que mira el inspector) | **13/05/2027** |
| `DESDE_VENCIMIENTO` (rutinas de calendario fijo) | 20/05/2027 |

Si la tarjeta de la recargadora dice otra fecha, **vale la tarjeta**, y la diferencia queda registrada.

**Estado de cada control** (se calcula al consultar; no se guarda):

| Estado | Condición |
|---|---|
| `SIN_DATOS` | Control activo sin vencimiento abierto (falta relevamiento). **Cuenta como rojo** |
| `SUSPENDIDO` | Local cerrado o control suspendido |
| `VENCIDO` | Hoy > fecha |
| `POR_VENCER` | Hoy ≥ fecha − anticipación |
| `AL_DIA` | En cualquier otro caso |
| + marca `PROGRAMADO` | Hay una visita abierta que lo incluye |

**Otras reglas:**

- **Anular** una ejecución reabre el vencimiento anterior y anula el que había generado. Todo queda auditado.
- **Cambiar la periodicidad** de un tipo no reescribe la historia: se aplica en la próxima renovación. Para los vencimientos abiertos hay una acción "Recalcular abiertos" con vista previa.
- **Ejecución muy anticipada con base desde la ejecución:** el sistema avisa cuántos días de vigencia pierde el cliente antes de confirmar.
- **Carga tardía:** cuenta la fecha real de ejecución, no la fecha en que se cargó.

### 3.4 Catálogo inicial sugerido (validar con el dueño y por jurisdicción)

| Control | Período | Base | Aviso | Evidencia | Ejecuta |
|---|---|---|---|---|---|
| Matafuego: recarga *(o control, [P1])* | 12 m (¿6 m?) | ejecución | 10 d | Foto de la tarjeta y n.º de oblea | Recargadora |
| Matafuego: prueba hidráulica (por cilindro) | 5 a | ejecución | 60 d | Certificado | Recargadora |
| Matafuego: vida útil | 20 a desde fabricación | — | 90 d | — | — |
| Tanque de agua: limpieza y análisis bacteriológico | 6 m | ejecución | 20 d | Certificado y análisis | Empresa habilitada |
| Control de plagas | 1 m (gastronómico) | vencimiento | 5 d | Certificado | Empresa habilitada |
| Campana y conductos | 3 m | ejecución | 10 d | Fotos de antes y después | SCP |
| Grasera / cámara séptica | 3 m | ejecución | 10 d | Fotos | SCP |
| Puesta a tierra (Res. SRT 900/15) | 12 m | ejecución | 30 d | Protocolo firmado | Matriculado |
| Tablero, borneras y disyuntores | 6 m | ejecución | 15 d | Checklist y fotos | SCP |
| Luces de emergencia: autonomía | 3 m | ejecución | 7 d | Checklist | SCP |
| Gas: hermeticidad | 12 m | ejecución | 30 d | Informe de matriculado | Gasista matriculado |
| Filtros de aire acondicionado | 3 m | ejecución | 7 d | Fotos | SCP |
| **Estacional:** desagües y canaletas antes de las lluvias | 12 m (ancla en marzo) | vencimiento | 20 d | Fotos | SCP |
| **Estacional:** aires antes del verano | 12 m (ancla en octubre) | vencimiento | 20 d | Checklist | SCP |
| **Garantía:** revisión de membrana después de la obra | 12 m durante la garantía | vencimiento | 30 d | Fotos | SCP |
| Habilitación, conservación contra incendio, póliza, ascensor | `MANUAL` | — | 60 d | PDF | Cliente o tercero |

## 4. Pantallas del supervisor (pensadas para el celular)

| # | Pantalla | Qué muestra | Acciones |
|---|---|---|---|
| 1 | **Hoy / Semana** (inicio) | Vencidos arriba en rojo, por vencer sin programar, visitas de hoy y mañana, pedidos ordenados por el SLA que les queda, informes sin publicar | Armar visita, iniciar visita, llamar al encargado, abrir en Maps |
| 2 | **Agenda de vencimientos** | Filtros por cliente, local, zona, rubro, tipo, fecha y estado | **"Armar visita"**: junta lo del local y propone **"ya que vas"** (lo que vence en los próximos 30 días); posponer con motivo; exportar a Excel |
| 3 | **Calendario de visitas** | Visitas y obras de la semana | Reprogramar (avisa al cliente); alerta si falta pedir permiso de acceso |
| 4 | **Cartera / matriz de cumplimiento** | Grilla de locales contra controles, con semáforo | Filtrar y entrar al local |
| 5 | **Ficha de cliente** | Abono, SLA, contactos, locales con semáforo, usuarios | Editar e invitar usuarios |
| 6 | **Ficha de local** | Datos, accesos, abono y pestañas: Controles · Elementos · Historial · Informes · Pedidos · Obras · Hallazgos · Notas internas | Todo lo del local |
| 7 | **Ficha de elemento** | Unidad actual, controles, historial con la foto de cada tarjeta, unidades anteriores | Reemplazar unidad, dar de baja, imprimir QR |
| 8 | **Modo visita** (la pantalla central) | Check-in → lista de lo planificado con botones grandes → por cada ítem: resultado, foto con la cámara, n.º de tarjeta, **nuevo vencimiento propuesto** (ajustable con motivo) → trabajos libres → horas y materiales → firma del encargado → borrador del informe | Escanear QR, agregar ítems, **marcar visita fallida** con foto y motivo. Borrador automático en el celular y subida de fotos con reintento si no hay señal |
| 9 | **Revisión del informe** | Vista previa tal como la verá el cliente | Ocultar fotos (personas, cajas), editar el resumen, agregar recomendaciones, **Publicar** |
| 10 | **Bandeja de pedidos** | Por estado, con colores según el SLA | Clasificar (dentro o fuera del abono), vincular a una visita u obra, responder, **cargar pedidos que llegaron por WhatsApp o teléfono** |
| 11 | **Obras** | Obras en curso con su avance | Crear, cargar avance y fotos por etapa, finalizar (crea los controles de garantía) |
| 12 | **Hallazgos** | Abiertos por severidad | Convertir en correctivo o presupuesto |
| 13 | **Alta y relevamiento** | Plantilla por rubro, **importación desde Excel** con validación por fila y vista previa | Generar las etiquetas QR en PDF |
| 14 | **Catálogos, proveedores, usuarios, auditoría** (admin) | Mayormente con el Django Admin | — |
| 15 | **Reportes** (admin) | Cumplimiento a término, SLA, carga por supervisor, trabajos fuera de abono, *(fase 3)* rentabilidad por local | Exportar |

## 5. Pantallas del cliente

| # | Pantalla | Qué muestra |
|---|---|---|
| 1 | **Inicio** | Semáforo grande ("38 de 40 controles al día" / "2 en gestión"), próximas visitas ("Matafuegos: vence el 20/11, visita programada el 13/11"), últimos informes, pedidos abiertos. En cadenas, una tabla de sucursales con el % de cumplimiento |
| 2 | **Mi local** | Controles con su estado, última ejecución, próximo vencimiento, **certificado vigente para descargar**; inventario (solo lectura) |
| 3 | **Calendario** | Vencimientos y visitas, para coordinar el acceso (por ejemplo, con el shopping) |
| 4 | **Informes** | Filtros por local, rubro y fecha. Galería de antes y después, trabajos, nuevos vencimientos, firma y PDF |
| 5 | **Obras** | Avance, fotos por etapa, garantía vigente |
| 6 | **Pedidos** | Alta en 3 pasos (rubro, urgencia, foto y descripción), seguimiento en una línea de tiempo, confirmar o reabrir. Siempre visible: **"Ante olor a gas o riesgo eléctrico, llamá primero a la guardia de SCP o a emergencias"** |
| 7 | **Carpeta de inspección** | Botón **"Descargar carpeta"**: un PDF con índice, estado y certificado vigente de cada control, para el inspector municipal, bomberos, la ART, la aseguradora o la auditoría del shopping o la franquicia |
| 8 | **Recomendaciones** | Hallazgos abiertos visibles para el cliente, con el botón "Quiero presupuesto" |
| 9 | **Resumen mensual** | Visitas, controles renovados, pedidos resueltos y tiempo de respuesta del mes. **Es el valor del abono a la vista** |
| 10 | **Mi cuenta** | Usuarios de la empresa (cliente admin) y preferencias de aviso |

## 6. Flujos clave

### F1. Vencimiento → aviso → visita → registro → nuevo vencimiento

1. **06:00, job diario.** El matafuego que vence el 20/11, con 10 días de anticipación, entra en ventana el **10/11**. Aparece en "Hoy / Semana" y en el resumen de las 07:00 del supervisor.
2. El supervisor toca **"Armar visita"** para el 13/11. El sistema propone sumar la campana, que vence el 02/12 ("ya que vas"). Si el local está en un shopping, recuerda pedir el permiso.
3. El encargado recibe: *"Visita el 13/11 de 8 a 10: recarga de 4 matafuegos y limpieza de campana. Se dejan matafuegos sustitutos."* En el portal, los vencimientos figuran como **programados**.
4. En el local: check-in → escanea el QR de cada matafuego → "Reemplazado por unidad recargada" → foto de la tarjeta y n.º de oblea. Si el equipo va al taller, el puesto queda `EN_SERVICIO_EXTERNO` con la unidad sustituta registrada.
5. El sistema muestra **"Nuevo vencimiento: 13/05/2027"** (o la fecha de la tarjeta). El supervisor confirma y se crea el vencimiento nuevo.
6. Firma el encargado, se cargan horas y materiales, se cierra la visita y se arma el **borrador del informe**.
7. El supervisor revisa y **publica**. Se genera el PDF con su hash, le llega un email al cliente y su semáforo vuelve a verde.
8. **Si no se hizo a tiempo:** con 3 días de margen y sin visita programada, se avisa al admin de SCP. Al pasar la fecha queda `VENCIDO`, con aviso diario al supervisor y al admin. El cliente lo ve como **"Vencido – en gestión"** *[P3]*.
9. **Visita fallida** (local cerrado, sin acceso): se registra con foto, hora y motivo, y se avisa al cliente. Respalda a SCP si después el control vence por causa del cliente.

### F2. Pedido o reclamo del cliente

1. El encargado lo carga ("Pérdida bajo la bacha", con foto y urgencia). Si es emergencia, **antes de enviar** la app le muestra el teléfono de guardia.
2. Se calcula el SLA según el abono (sugerido: emergencia 4 h, urgente 24 h, normal 72 h hábiles) y se avisa al supervisor al instante.
3. El supervisor lo clasifica: **dentro del abono** (se acepta y se programa), **fuera del abono** (pasa a presupuesto, fase 3) o **rechazado** con motivo.
4. Se vincula a una visita existente o a una nueva, o a una obra. Si depende de un tercero, queda `ESPERANDO_TERCERO` con el motivo visible.
5. Se resuelve con fotos e informe. El pedido pasa a `RESUELTO`.
6. El cliente confirma o reabre. Si no contesta en 7 días, se cierra solo. El cumplimiento se mide contra el SLA del contrato.

### F3. Informe

1. Nace como borrador al cerrar la visita (o al cerrar una etapa de una obra), armado solo con lo cargado: controles y nuevos vencimientos, trabajos, hallazgos, fotos y firma.
2. El supervisor ajusta los epígrafes, oculta fotos y agrega recomendaciones.
3. Al **publicar**: número correlativo, PDF generado en segundo plano con las mismas plantillas HTML, hash y QR de verificación. Desde ese momento es **inmutable**.
4. Una corrección emite la **versión 2** con motivo, y la anterior queda visible como "reemplazada".

### F4. Alta de un cliente nuevo (el flujo crítico)

1. Visita de **relevamiento**: se aplica la plantilla del rubro, se inventarían los elementos, se **fotografía cada tarjeta o certificado** y se pegan los QR.
2. Las fechas de las tarjetas se cargan como vencimientos de origen `RELEVAMIENTO`. Lo que no tiene dato queda `SIN_DATOS`, que **cuenta como rojo**.
3. Alternativa: importación desde la plantilla Excel, con validación y vista previa.
4. Se invita a los usuarios del cliente. La primera vez que entra ya tiene datos, y se le entrega la **primera carpeta de inspección** como bienvenida.

### F5. Obra (pintura, durlock, impermeabilización, construcción)

1. Surge de un pedido o un hallazgo: presupuesto (fase 3; en el MVP, fuera del sistema) → aprobada.
2. Varias visitas con avance % y fotos por etapa. El cliente ve el progreso.
3. Al finalizar: informe de obra y **controles de garantía o revisión** (por ejemplo, revisión anual de la membrana durante 5 años). La obra pasa a estar dentro del mismo motor de vencimientos.

## 7. Alertas y notificaciones

| Evento | A quién | Cuándo | Canal MVP → después |
|---|---|---|---|
| Resumen: por vencer, vencidos, sin programar, pedidos | Supervisor | 07:00, días hábiles | Email + tablero |
| Por vencer sin visita a 3 días del vencimiento | Supervisor y admin SCP | Diario hasta que se programe | Email |
| Vencido sin ejecutar | Supervisor y admin SCP | Diario mientras siga vencido | Email → WhatsApp |
| Visita programada o reprogramada | Encargado | Al programarla y la víspera a las 18 h | Email + link `wa.me` → WhatsApp API |
| Visita fallida | Cliente admin | En el momento | Email |
| Informe publicado | Encargado y cliente admin | En el momento | Email con link (no adjunto) |
| Pedido nuevo | Supervisor | En el momento | Email + push de la PWA; emergencia → WhatsApp |
| SLA al 75 % y al 100 % | Supervisor y admin SCP | Al cruzar cada umbral | Email + push |
| Cambio de estado de un pedido | Quien lo creó | En el momento | Email |
| Documento del cliente por vencer (habilitación, póliza) | Cliente admin y supervisor | 60, 30 y 7 días antes | Email |
| Habilitación de un proveedor por vencer | Admin SCP | 30 días antes | Email |
| Resumen mensual | Cliente admin | Primer día hábil del mes | Email con link al PDF |
| El job diario no corrió o fallan los envíos | Admin técnico | En el momento | Monitoreo (Sentry o healthcheck) |

**Criterios:**

- **Agrupar:** un email por día, no veinte.
- **Pocos avisos y todos accionables** para el cliente.
- Nada de noche, salvo emergencias.
- Preferencias por usuario; las emergencias no se pueden silenciar.
- **Outbox con clave de idempotencia** (`evento + entidad + fecha`, por ejemplo `vencimiento:123:por_vencer`): un job que se vuelve a correr no duplica avisos.

## 8. Stack técnico

| Pieza | Elección | Por qué |
|---|---|---|
| Backend y web | **Django 5.2 LTS**, un monolito | Auth, formularios, migraciones y **Django Admin** (los catálogos y el backoffice salen casi gratis). Soporte LTS hasta 2028. Hay muchos desarrolladores Python en Argentina |
| Frontend | HTML del servidor + **HTMX** + Tailwind; **PWA** instalable | Sin SPA ni API aparte: una sola base de código. Anda bien en celulares de gama media |
| Base de datos | **PostgreSQL 16/17** gestionado | Restricciones reales (índices únicos parciales, checks), JSONB para atributos |
| Tareas en segundo plano | **Procrastinate** (cola sobre Postgres) + cron diario | Sin Redis ni Celery: una pieza menos que operar |
| Fotos y archivos | **Cloudflare R2**, subida directa con URL prefirmada, bucket privado | Compatible con S3 y **sin costo de descarga**. El servidor no toca los archivos |
| Compresión | En el celular, antes de subir (~1600 px, ~300 KB) | Ahorra datos móviles y almacenamiento |
| Sin señal | Borrador de la visita en IndexedDB y cola de subida con reintentos | Lo cargado en un sótano no se pierde. El offline completo, solo si la práctica lo pide |
| PDF | **WeasyPrint** (HTML a PDF), en segundo plano | Usa las mismas plantillas que la vista web |
| Email | **Postmark** o Amazon SES, con SPF, DKIM y DMARC | Buena entrega a bajo costo |
| WhatsApp | MVP: links `wa.me` con el texto armado. Fase 3: **Cloud API de Meta** con plantillas "utility" | Costo cero al principio |
| Hosting | **Render o Railway** (web, worker, cron, Postgres con backup) | Sin servidor que administrar. Si se busca bajar costos: VPS en Hetzner con Docker Compose y Caddy |
| Backups | Backup del PaaS + `pg_dump` nocturno cifrado a otro bucket, **restauración de prueba mensual** | Un backup que nunca se restauró no es un backup |
| Observabilidad | Sentry, logs estructurados, healthcheck, alerta si el job diario no corrió | Enterarse antes que el cliente |
| Tests | Foco en el **servicio de recálculo** (fin de mes, bisiestos, anulaciones, `satisface_a`) y en el **aislamiento entre clientes** | Son los dos lugares donde un error cuesta caro |

**Descartado:** microservicios, Kubernetes y app nativa (sobran para este volumen); SPA con API aparte (dos bases de código para 1 o 2 personas); Firebase, Supabase o no-code (los permisos entre clientes quedan en reglas difíciles de testear, y hay lock-in).

**Alternativa equivalente:** si el equipo ya domina PHP, **Laravel + Filament** con la misma arquitectura. **[Decisión a tomar antes de arrancar]**

**Costo estimado:** USD 30 a 60 por mes de infraestructura. Fotos: 400 locales × 2 visitas × 15 fotos × 300 KB ≈ 3,6 GB por mes, menos de USD 1 en R2.

## 9. Riesgos, casos borde y decisiones abiertas

### Riesgos

| Riesgo | Mitigación |
|---|---|
| **Adopción:** si cargar una visita lleva más de 5 minutos, el supervisor vuelve al WhatsApp y al papel, y el sistema muestra datos falsos | QR, "Armar visita", botones grandes, borrador automático. **Piloto con un supervisor real desde la semana 1** |
| **Datos iniciales malos:** el semáforo muestra verde cuando no lo es | `SIN_DATOS` cuenta como rojo; relevamiento obligatorio con foto de cada tarjeta |
| **Responsabilidad legal:** el sistema refleja, no certifica | El certificado del tercero siempre adjunto; aviso legal revisado por un abogado |
| **Fuga de datos entre clientes** | Filtro único + tests por endpoint + URLs firmadas |
| **Abono que no cierra:** locales que consumen más de lo que pagan | Horas y materiales por visita desde el MVP; reporte de rentabilidad en fase 3 |
| **Ley 25.326** (fotos con personas, patentes, cajas, códigos de alarma) | Bucket privado, ocultar fotos, pauta de encuadre, política de retención |
| **Supervisor único como cuello de botella** | Medir la carga por supervisor; adelantar el rol de técnico si hace falta |

### Casos borde contemplados

- Matafuego que va al taller con sustituto, o que se reemplaza definitivamente: `EN_SERVICIO_EXTERNO` / reemplazo de `Unidad` sin cortar el historial del puesto.
- Ejecución en el elemento equivocado: se anula y se recalcula sola.
- Control hecho por otro proveedor del cliente: se carga como externo con el certificado y recalcula igual.
- Local cerrado (refacción, temporada): controles `SUSPENDIDO`, sin alertas.
- Baja de un cliente: vencimientos suspendidos, exportación completa y 90 días de acceso de solo lectura.
- Fechas: 29/02, días 31, feriados (los avisos salen en días hábiles; los vencimientos se cuentan en días corridos).
- Doble carga simultánea: bloqueo de la fila más índice único.
- Corrección de algo publicado: versión nueva, nunca se edita.

### Preguntas para el dueño (ordenadas por impacto en el diseño de la base de datos)

| # | Pregunta | Por qué importa |
|---|---|---|
| **P1** | Los **6 meses del matafuego**, ¿son la recarga o un control propio de SCP? ¿Registran prueba hidráulica y vida útil? | Define el catálogo base |
| **P2** | ¿El nuevo vencimiento se cuenta **desde el día del trabajo o desde el vencimiento anterior**? ¿Igual para todo? | Define el valor por defecto de `base` |
| **P3** | ¿El cliente **ve los vencidos** tal cual? (Recomiendo que sí, como "vencido – en gestión": la transparencia vende el abono) | Visibilidad y textos del portal |
| P4 | ¿Qué hace SCP y qué terceriza? ¿Quién firma cada certificado? | Proveedores y evidencia |
| P5 | ¿Qué **incluye el abono** y qué es extra? ¿Las obras entran? ¿El cliente ve montos? | Abono, obras, presupuestos |
| P6 | ¿Qué **SLA** se compromete? ¿Hay guardia 24 h? | Pedidos y alertas |
| P7 | ¿Cargan también los **técnicos**, o solo los supervisores? | Roles del MVP |
| P8 | ¿La **firma del encargado** es obligatoria en cada visita? | Cierre de visita |
| P9 | ¿Cuántos clientes, locales y supervisores hay hoy y a 12 meses? ¿En qué jurisdicciones trabajan? | Dimensionamiento y normativa |
| P10 | ¿Dónde están hoy los datos (Excel, Drive, papel)? ¿Hay un formato de informe actual para replicar? | Migración y plantilla del PDF |
| P11 | ¿El canal real con los clientes es WhatsApp? ¿Desde qué número? | Notificaciones |
| P12 | ¿Alguna cadena exige cargar datos en su propio portal de proveedores? | Integraciones futuras |
| P13 | ¿El equipo de desarrollo sabe Python o PHP? | Django o Laravel |

## 10. Roadmap

| Fase | Duración | Alcance | Criterio de éxito |
|---|---|---|---|
| **0. Relevamiento** | 1–2 sem | Respuestas P1–P13, catálogo validado, plantilla Excel, maqueta navegable del **Modo visita**, 2 clientes piloto | Catálogo firmado por el dueño |
| **1. MVP** | 6–8 sem (1–2 devs) | Roles y aislamiento entre clientes; clientes, locales, abonos; elementos y unidades con plantillas por rubro e **importación Excel**; **QR**; catálogo; **motor de vencimientos** (recálculo, ajuste, anulación, `satisface_a`); tablero "Hoy / Semana", agenda y "Armar visita"; **Modo visita** con fotos, evidencia obligatoria, horas y materiales, visita fallida, borrador sin señal; **informe inmutable con PDF**; portal del cliente (inicio, mi local, informes); **pedido básico**; emails clave + links `wa.me`; backups y monitoreo | Los pilotos trabajan **un mes solo con el sistema** y **no se pasa ningún vencimiento** |
| **2. Servicio** | 4–6 sem | SLA con escalamiento; firma de conformidad; hallazgos → correctivos; **carpeta de inspección**; **resumen mensual**; calendario y requisitos de acceso; **obras** con avance y garantías; proveedores con habilitación; push de la PWA | Ningún cliente se va porque "no ve lo que hacen" |
| **3. Escala** | continuo | Presupuestos fuera del abono con aprobación del cliente; WhatsApp Cloud API; rol de técnico; **rentabilidad por local**; reportes de SLA y cumplimiento para renovar contratos; QR público opcional; offline completo si hace falta | Se suma un supervisor sin cambiar el proceso |

**Métricas de éxito permanentes:**

- Al menos 95 % de los controles cumplidos antes de vencer.
- Informes publicados dentro de las 24 h de la visita.
- Una visita cargada en menos de 5 minutos.
- Al menos 60 % de los pedidos por el portal a los 6 meses.

---

## 11. Próximo paso: diseño de la base de datos

Con las respuestas a **P1, P2, P3, P5 y P7** se puede cerrar el esquema. Este es el borrador lógico de las tablas y de las restricciones que deben vivir **en la base**, no solo en la aplicación:

| Tabla | Restricciones clave |
|---|---|
| `cliente` | `cuit` único |
| `local` | FK a `cliente`; índice por (`cliente_id`, `estado`) |
| `membresia` | Único (`usuario_id`, `cliente_id`); `rol` en un enum |
| `abono` | Rango de vigencia sin superposición por local (constraint `EXCLUDE` con `daterange`) |
| `tipo_control` | `periodo_valor > 0` salvo que la unidad sea `MANUAL`; `base` en un enum |
| `elemento` | `qr_token` único; único (`local_id`, `codigo`) |
| `unidad` | Como mucho una unidad instalada por elemento (índice único parcial `WHERE retirada_en IS NULL`) |
| `control` | Check: **exactamente uno** de `elemento_id` / `local_id`; único (`elemento_id`, `tipo_control_id`) y único (`local_id`, `tipo_control_id`) |
| `vencimiento` | **Índice único parcial (`control_id`) `WHERE estado = 'ABIERTO'`**; índice por (`estado`, `fecha`) para el job diario |
| `ejecucion` | Sin `UPDATE` salvo los campos de anulación; FK al vencimiento que cierra |
| `informe` | Único (`numero`, `version`); `sha256` obligatorio si está publicado |
| `notificacion` | `clave_idempotencia` única |
| `adjunto` | Check: exactamente un dueño (visita, ejecución, pedido, obra, hallazgo o elemento) |
| Todas | `created_at` y `created_by`; ningún `DELETE` físico en datos de negocio (se anula con motivo) |

Antes de escribir las migraciones conviene pasar este esquema por una revisión formal (constraints, índices, FKs sin índice, seguridad de las migraciones).
