# Propuesta 3: Plataforma de mantenimiento SCP

> Propuesta de producto y técnica, sin código. Los supuestos van marcados **[S#]** y las preguntas para el dueño **[P#]**.

## 1. Resumen y supuestos

Es una app web instalable en el celular (PWA) con dos caras:
- **Back-office del supervisor**, pensado para usarse en la calle desde el celular.
- **Portal del cliente**, de solo lectura salvo para pedidos.

El núcleo es un **plan de controles por activo**: cuando se registra un trabajo, el vencimiento se recalcula solo. Cada visita termina en un **informe inmutable** con fotos y PDF.

**Idea fuerza:** el comercio no compra mantenimiento, compra *estar en regla y sin sorpresas*. El portal tiene que contestar en 10 segundos dos preguntas: "¿estoy al día?" y "¿qué hicieron por mí este mes?". La segunda es la que sostiene el abono.

**Supuestos:**
- **[S1]** Hay una sola empresa (SCP); no es un SaaS para otras empresas. Sí es multi-cliente y multi-local, porque hay cadenas con varias sucursales.
- **[S2]** Año 1: menos de 100 clientes, menos de 400 locales, unas 100 fotos por día y entre 1 y 3 supervisores.
- **[S3]** El supervisor carga desde el celular y muchas veces sin señal (sótanos, salas de máquinas).
- **[S4]** Algunos trabajos los hace un **tercero habilitado** que SCP subcontrata: recarga de matafuegos, plagas, tanques y ascensores. **El certificado o tarjeta del tercero es la verdad legal**, no la cuenta que haga el sistema.
- **[S5]** Quedan fuera del MVP la facturación del abono y el circuito de presupuestos de trabajos extra.
- **[S6]** La zona es AMBA y la normativa cambia según el municipio, así que **ninguna periodicidad va fija en el código**.
- **[S7]** El "matafuego a 6 meses" lo tomo como valor configurable. La recarga suele ser anual (IRAM 3517-2) con prueba hidráulica cada 5 años **[P1]**.

## 2. Roles y permisos

| Rol | Ve | Edita |
|---|---|---|
| **Admin SCP** (dueño) | Todo | Todo: catálogo, usuarios, anulaciones y auditoría |
| **Supervisor** | Todos los clientes, con filtro "mis locales" | Locales, activos, órdenes de trabajo (OT), informes (puede publicarlos) y pedidos |
| **Técnico** *(fase 3)* | Solo sus OT | Carga en borrador; **no publica** |
| **Cliente admin** (gerente de la cadena) | Todos los locales de *su* cliente | Pedidos; invita encargados **[P2]** |
| **Cliente local** (encargado) | Solo los locales que tiene asignados | Pedidos y firma de conformidad |
| **Público (QR)** | El estado del activo escaneado | Nada |

**Reglas:**
- El alcance de cada usuario cliente se define con una `Membresia(usuario, cliente, locales[] o "todos")`.
- **Toda** consulta pasa por un único filtro `visible_para(usuario)`. Nunca se busca un registro por ID suelto, para que nadie pueda ver datos de otro cliente cambiando un número en la URL. Esto se cubre con tests automáticos.
- Notas, adjuntos y montos tienen visibilidad `interna` o `cliente`.
- El vencimiento se actualiza al registrar el trabajo. El informe solo aparece al **publicarse**; mientras tanto el cliente ve "en preparación".
- Los archivos se sirven con URL firmada de 10 minutos. Nunca hay un bucket público.

## 3. Modelo de dominio

```
Cliente 1─N Local 1─N Activo(puesto) 1─N Control N─1 TipoControl
Local 1─N Control            (controles del local sin activo: plagas, habilitación)
Local 1─N OrdenTrabajo 1─0..1 Informe 1─N Adjunto / Hallazgo
OrdenTrabajo 1─N Ejecucion N─1 Control     Ejecucion N─0..1 Proveedor
Local 1─N Pedido N─0..1 OrdenTrabajo
```

**Entidades y campos clave:**
- **Cliente:** razón social, CUIT, estado del abono, contactos.
- **Local:** dirección, partido, **rubro** (gastronómico, retail, farmacia), horario de acceso, quién tiene las llaves, encargado.
- **TipoControl:** es la regla de vencimiento. Campos: `periodo_cantidad` y `periodo_unidad` (días, meses o años), `ancla`, `anticipacion_aviso_dias`, `requiere_certificado`, `requiere_proveedor_habilitado`, referencia normativa y checklist.
- **Activo:** representa un **puesto**, o sea una ubicación fija con QR ("Cocina, junto a puerta trasera").
  - Además del tipo, guarda la `unidad_actual`: n° de cilindro o de serie y fecha de fabricación.
  - **Clave del rubro:** cuando SCP "cambia" un matafuego, el puesto queda y cambia la unidad física. La prueba hidráulica acompaña al cilindro y la recarga acompaña a la carga.
- **Control:** la instancia del plan para un activo o local. Guarda el tipo, `periodo_override`, la última ejecución, `proximo_vencimiento` (desnormalizado) y el estado.
- **Ejecucion** (inmutable):
  - Fecha realizada y resultado (`OK` / `OBSERVADO` / `REEMPLAZO` / `NO_APTO` / `AJUSTE`).
  - N° de oblea o certificado, proveedor, `vence_segun_certificado`, `vencimiento_resultante` y `anula_a` (para correcciones).
- **OrdenTrabajo:**
  - Tipo: preventiva, correctiva, emergencia o relevamiento. Origen: plan, pedido o hallazgo.
  - Estado `PROGRAMADA` → `EN_CURSO` → `FINALIZADA` → `INFORMADA`, y la marca `dentro_de_abono`.
- **Informe:** n° correlativo, trabajos, observaciones, firma (nombre, DNI e imagen), estado `BORRADOR` / `PUBLICADO`, PDF con hash SHA-256 y versión.
- **Hallazgo:** algo que se vio fuera de lo pedido, por ejemplo "membrana fisurada". Tiene severidad y recomendación, y más adelante puede convertirse en presupuesto.
- **Pedido:** categoría, fotos, urgencia, estados (`NUEVO` → `ACEPTADO` → `PROGRAMADO` → `RESUELTO` → `CERRADO` o `REABIERTO`) y SLA.
- **Proveedor:** matrícula o habilitación con **su propio vencimiento**. El sistema avisa si se usa uno con la habilitación vencida.
- **Adjunto:** puede colgar de cualquier entidad. Se marca como antes, después, hallazgo o certificado, y guarda la fecha de captura y la visibilidad.
- **Auditoría:** quién, qué, cuándo, valor anterior y valor nuevo.

### Periodicidad y recálculo

1. **Vencimiento resultante:** si el certificado declara una fecha, se usa esa. Si no, se calcula como `base + periodo`.
2. **Ancla:** define desde dónde se cuenta.
   - `DESDE_EJECUCION` (por defecto, para matafuegos y tanques): se cuenta desde la fecha en que se hizo el trabajo.
   - `CALENDARIO_FIJO`: se cuenta desde el vencimiento anterior, para que la fecha no se corra (por ejemplo, plagas "los días 5").
3. **Fechas:** se calcula con fechas, no con horas, en hora argentina. Los fines de mes se ajustan al último día válido: 31/08 + 6 meses = 28/02.
4. **Función de cálculo:** es una función pura, con tests, que parte de la última ejecución no anulada. Para fijar una fecha a mano se registra un `AJUSTE` con motivo obligatorio; nunca se pisa el campo sin rastro.
5. **Estado diario:**

   | Estado | Cuándo |
   |---|---|
   | `AL_DIA` | Falta más que la anticipación |
   | `POR_VENCER` | Hoy ≥ vencimiento − anticipación |
   | `VENCIDO` | Pasó la fecha |
   | `SIN_DATOS` | Activo sin historial; obliga a hacer relevamiento |
   | `SUSPENDIDO` | Local cerrado |

6. **Regla cruzada:** si la prueba hidráulica del cilindro está vencida, no se permite registrar una recarga y se sugiere `REEMPLAZO`. Al reemplazar se cargan los datos de la unidad nueva.

**Catálogo inicial** (valores por defecto a validar **[P1]**):

| Control | Período | Ancla | Aviso |
|---|---|---|---|
| Matafuego: recarga o control | 12 m (o 6 m) | ejecución | 10 d |
| Matafuego: prueba hidráulica (por cilindro) | 5 a | ejecución | 60 d |
| Luces de emergencia: autonomía | 6 m | ejecución | 15 d |
| Puesta a tierra (protocolo SRT 900/15) | 12 m | ejecución | 30 d |
| Tablero: borneras y disyuntor | 6 m | ejecución | 15 d |
| Tanque de agua: desinfección y análisis bacteriológico | 6 m | ejecución | 20 d |
| Plagas (gastronómico) | 1 m | calendario fijo | 5 d |
| Campana y conductos | 3 m | ejecución | 10 d |
| Grasera o cámara séptica | 3 m | ejecución | 10 d |
| Gas: hermeticidad (gasista matriculado) | 12 m | ejecución | 30 d |
| Habilitación, conservación contra incendio, seguros | fecha del documento | — | 45 d |

Hay **plantillas por rubro de local**: por ejemplo, la plantilla "Gastronómico" crea de una vez plagas, campana, grasera y tanque.

## 4. Pantallas del supervisor (mobile-first)

1. **Tablero "Hoy / Semana":** controles vencidos (arriba), los que vencen en 7 o 30 días, pedidos ordenados por SLA, OT del día e informes sin publicar. Cada fila tiene una acción directa.
2. **Matriz de cumplimiento:** grilla de locales contra controles, con semáforo, filtros por cliente, zona y rubro, y exportación a Excel.
3. **Planificador:**
   - Muestra lo que hay que programar, agrupado por local y por barrio.
   - **"Armar visita"** crea una OT con todo lo del local y propone **"ya que vas"**: controles de ese local que vencen en los próximos 30 días.
4. **Ficha de cliente y local:** datos, acceso, activos, plan de controles, historial, pedidos, documentos y hallazgos.
5. **Activos:** alta masiva ("6 × ABC 5 kg"), importación desde Excel e **impresión de etiquetas QR**.
6. **Visita en campo:**
   - Checklist y, por cada control, un toque: "Recargado / Reemplazado / Observado".
   - Al instante muestra el **nuevo vencimiento**, que se puede corregir según el certificado.
   - Fotos antes y después, firma del encargado en pantalla y cierre.
   - Las fotos se comprimen y suben en cola; sin señal, se reintentan después.
7. **Editor de informe:** vista previa, elección de fotos, notas internas y hallazgos. Con **Publicar** se genera el PDF y se notifica al cliente.
8. **Bandeja de pedidos:** se clasifica cada uno como abono o extra y por urgencia; después se asigna, se programa y se responde.
9. **Catálogo y plantillas** (solo admin), **proveedores**, **usuarios** (invitar o revocar) y **auditoría y anulaciones**.

## 5. Pantallas del cliente

1. **Inicio:**
   - Semáforo grande: "Todo en regla" o "N controles en gestión".
   - Próximas visitas y últimos informes.
   - En cadenas, una tabla de locales con el **% de cumplimiento** de cada uno.
2. **Vencimientos:** cada control por local, con su certificado vigente para descargar.
3. **Informes:** galería **antes/después**, trabajos, firma y PDF.
4. **Pedidos:**
   - Se crean desde el celular con foto y urgencia. Si es emergencia, además se muestra el teléfono de guardia.
   - El cliente sigue el estado y al final confirma o reabre.
5. **Carpeta de inspección:** junta los certificados vigentes y tiene el botón **"Descargar legajo PDF"** para el inspector municipal o el auditor de la franquicia.
6. **Hallazgos y recomendaciones** de SCP.
7. **Resumen mensual:** visitas, controles renovados y pedidos resueltos en el mes. Es el valor del abono a la vista.
8. **Inventario** (solo lectura) y **Mi cuenta** (canales de notificación; el cliente admin gestiona sus encargados).
9. **Página QR pública:** tipo, estado, próximo vencimiento y último control. No tiene login y no expone datos del cliente.

## 6. Flujos clave

**A. Vencimiento → aviso → visita → registro → nuevo vencimiento**
1. A las 06:00 un job recalcula estados. Un matafuego que vence el 20/11 y tiene 10 días de aviso pasa a `POR_VENCER` el 10/11: aparece en el Planificador y en el resumen diario del supervisor.
2. El supervisor toca "Armar visita" y la OT queda para el 14/11. El cliente recibe el aviso: "Visita el 14/11: recarga de 4 matafuegos".
3. En el local, el supervisor marca "Reemplazado por unidad recargada", fotografía la tarjeta y carga la oblea. El sistema propone el 14/05, o la fecha que diga la tarjeta.
4. Firma el encargado y se cierra la OT. Se genera un **borrador de informe** con las ejecuciones y las fotos.
5. El supervisor publica. Se genera el PDF, se notifica al cliente y la matriz pasa a verde.
6. **Si no se hizo a tiempo**, el control pasa a `VENCIDO`, se escala al admin y el cliente lo ve como "vencido – en gestión" **[P3]**.

**B. Pedido del cliente**
1. El encargado carga el pedido, por ejemplo "Pérdida bajo bacha", con foto y urgencia ALTA. El supervisor recibe el aviso al instante.
2. El supervisor lo acepta y lo clasifica como abono o extra. Arranca el SLA, por ejemplo 4 h para emergencia, 24 h para alta y 72 h para normal **[P4]**.
3. Se programa la OT, se ejecuta y se publica el informe; el pedido queda `RESUELTO`.
4. El cliente confirma o reabre. Si no contesta, se cierra solo a los 7 días.

**C. Alta de un cliente nuevo:** se aplica la plantilla del rubro y se hace una OT de `RELEVAMIENTO` (inventario, QR pegados, foto de las tarjetas). El vencimiento que figura hoy en cada tarjeta se carga como ejecución inicial; lo que no tiene dato queda en `SIN_DATOS`.

**D. Corrección:** un informe publicado no se edita. Se emite la versión 2 con motivo, y la anterior queda visible marcada como "reemplazada".

## 7. Alertas y notificaciones

| Evento | A quién | Cuándo | Canal (MVP → fase 2) |
|---|---|---|---|
| Resumen diario: por vencer, vencidos, pedidos | Supervisor | 07:00 en días hábiles | Email |
| Control vencido sin OT | Supervisor y admin | El día del vencimiento | Email → WhatsApp |
| Pedido nuevo | Supervisor | Inmediato | Email y push → WhatsApp |
| SLA al 75 % | Supervisor y admin | Al alcanzarse | Email y push |
| Visita programada | Cliente local | Al programarla y 24 h antes | Email → WhatsApp |
| Informe publicado | Cliente | Al publicarse | Email con link |
| Resumen mensual | Cliente admin | Primer día hábil del mes | Email con PDF |
| Habilitación de proveedor por vencer | Admin | 30 días antes | Email |

Cada envío tiene una clave de idempotencia `(evento, entidad, fecha)`, así un reintento no manda duplicados, y queda registrado con su estado. Cada usuario puede silenciar canales, salvo las emergencias.

## 8. Stack técnico

- **Django 5.2 LTS + PostgreSQL 16**, con HTML renderizado en el servidor y **HTMX**.
  - El admin de Django resuelve gratis el catálogo.
  - Auth, permisos y migraciones vienen probados.
  - Es un solo lenguaje, sin un SPA aparte que mantener.
  - Si el equipo ya sabe Laravel o Rails, se usa ese framework con la misma arquitectura.
- **PWA:** solo para instalar la app y encolar la subida de fotos. El modo offline completo queda para la fase 3.
- **Jobs:** Procrastinate o django-q2, que usan Postgres como cola, así que no hace falta Redis. Un timer del sistema dispara los procesos diarios.
- **Fotos:**
  - Se suben con URL prefirmada directo a **Cloudflare R2** (compatible con S3 y sin costo por descarga).
  - Se comprimen en el celular a unos 1600 px y ~300 KB.
  - Un job genera las miniaturas.
- **PDF:** **WeasyPrint** a partir de plantillas HTML, generado en un job y guardado en R2 con su hash. Lleva un QR de verificación.
- **Email:** Amazon SES o Postmark, con SPF, DKIM y DMARC configurados.
- **WhatsApp:** en el MVP, links `wa.me` con el texto ya armado, a costo cero. En la fase 2, la WhatsApp Cloud API con plantillas "utility".
- **Hosting:**
  - VPS en **São Paulo** (Lightsail o Vultr, entre 12 y 24 USD/mes) para tener baja latencia desde AMBA.
  - Docker Compose con Caddy para TLS automático.
  - `pg_dump` cada noche a R2 y **una prueba de restauración por mes**.
  - Monitoreo con Sentry y UptimeRobot.
- **Costo:** 25–50 USD/mes en total.
- **Descartado:** microservicios, Kubernetes y app nativa (sobran para este volumen), y Supabase o Firebase, porque los permisos quedan en reglas difíciles de testear.

## 9. Riesgos, casos borde y preguntas abiertas

**Riesgos y casos borde:**
- **Mala carga inicial:** se mitiga con `SIN_DATOS` visible y relevamiento obligatorio antes de mostrar "al día".
- **Responsabilidad legal:** el sistema refleja; no certifica. Va un aviso legal y el certificado del tercero siempre adjunto.
- **Certificado contra cálculo:** si no coinciden, gana el certificado y la diferencia queda registrada.
- **Errores después de publicar:** se corrigen con anulaciones y versiones, nunca borrando.
- **Rotación de encargados:** las invitaciones vencen a las 72 h y el acceso se revoca con un clic.
- **Privacidad (Ley 25.326):** en las fotos pueden aparecer clientes o empleados. Hace falta una pauta de encuadre y poder ocultar una foto.
- **Supervisor único como cuello de botella:** hay que medir su carga y adelantar el rol de técnico si hace falta.
- **Locales nocturnos o sin señal:** se guarda el horario de acceso y hay cola de subida, que hay que probar en un sótano real.
- **Baja de un local:** el historial se conserva y los controles quedan `SUSPENDIDO`.

**Preguntas para el dueño:**
- **[P1]** Periodicidad real de cada control y quién lo ejecuta: SCP o un tercero.
- **[P2]** ¿El cliente admin invita a sus encargados?
- **[P3]** ¿Mostramos los vencidos al cliente? Mi recomendación es que sí, con transparencia.
- **[P4]** ¿Qué SLA de emergencia se compromete en el abono? ¿Hay guardia 24/7?
- **[P5]** ¿Qué entra en el abono y qué es extra? ¿El cliente ve montos?
- **[P6]** ¿La firma de conformidad es obligatoria?
- **[P7]** ¿WhatsApp hace falta desde el día 1?
- **[P8]** Volumen actual y a 12 meses, y zonas en las que trabajan.
- **[P9]** ¿Hay Excel o carpetas para migrar?

## 10. Roadmap

| Fase | Semanas | Alcance | Éxito |
|---|---|---|---|
| **0. Relevamiento** | 1–2 | Catálogo validado, planilla de carga inicial y respuestas P1–P9 | 2 clientes piloto elegidos |
| **1. MVP** | 6–8 | Roles y alcance multi-local; locales y activos con importación desde Excel; catálogo y plantillas; motor de vencimientos; tablero y matriz; OT en campo con fotos; informe con PDF; portal (estado, vencimientos, informes); pedidos básicos; emails; backups | Los pilotos dejan el Excel durante un mes |
| **2. Diferenciales** | 4–6 | QR y página pública, carpeta de inspección, firma, SLA, "ya que vas", resumen mensual, WhatsApp API, proveedores | Ninguna baja de abono por "no veo lo que hacen" |
| **3. Escala** | continuo | Técnicos y modo offline, hallazgos convertidos en presupuestos aprobables, métricas, feriados en la agenda | Se suma un supervisor sin cambiar el proceso |
