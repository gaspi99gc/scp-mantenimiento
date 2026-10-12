# Propuesta 4: Plataforma de mantenimiento SCP

## 1. Resumen y supuestos

**En una línea:** un *legajo vivo* por local con lo que vence, lo que se hizo y la prueba de que se hizo. SCP lo carga desde el celular; el cliente lo ve en tiempo real.

El eje es el **Control**: un elemento (o el local) más un tipo de control con periodicidad. Cada **Ejecución** registrada con evidencia recalcula el próximo vencimiento. Visitas, informes y reclamos cuelgan de ese eje.

Objetivos:
- **Nada vence por sorpresa**, con anticipación según el tipo (un matafuego no es una habilitación).
- **El cliente muestra todo a un inspector en un minuto** (AGC, municipio, bomberos, ART, auditoría del shopping).
- **Cargar una ejecución en menos de 60 segundos**, parado en el local.
- **Que el abono "todo incluido" se vea** mes a mes.

**Supuestos (a validar):**
- **[S1]** 1 o 2 desarrolladores; infraestructura por debajo de USD 50/mes.
- **[S2]** Menos de 50 clientes, 300 locales, 5.000 elementos y 5 supervisores: alcanza un solo Postgres.
- **[S3]** Carga SCP; el cliente consulta y pide. Técnicos con usuario propio, en fase 3.
- **[S4]** Los "6 meses" del matafuego son periodicidad del contrato de SCP. IRAM 3517-2 pide recarga anual, prueba hidráulica cada 5 años y baja a los 20 años. Por eso la periodicidad es configurable por tipo y por elemento.
- **[S5]** Recarga, gas, fumigación y puesta a tierra pueden hacerlos terceros matriculados; SCP coordina y sube el certificado.
- **[S6]** Web responsive, sin app nativa. En campo puede no haber señal.
- **[S7]** La facturación queda fuera de alcance (sigue por ARCA).
- **[S8]** Opera en CABA/AMBA. La normativa va en un catálogo editable, no en el código.

## 2. Roles y permisos

Multi-tenant: un Cliente (razón social) tiene N Locales. Una **Membresía** une usuario, cliente, rol y, opcionalmente, locales.

| Rol | Ve | Edita |
|---|---|---|
| Admin SCP | Todo | Todo, incluidos el catálogo, los usuarios y las anulaciones |
| Supervisor SCP | Los clientes y locales asignados | Elementos, controles, visitas, ejecuciones, informes y pedidos |
| Técnico SCP (fase 3) | Sus visitas | Ejecuciones y fotos. No publica informes |
| Admin cliente | Todos los locales de su empresa | Pedidos, presupuestos y usuarios de su empresa |
| Encargado de local | Sus locales | Pedidos, conformidad y firma |
| Auditor cliente (opcional) | Los locales asignados | Nada |

Reglas:
- El cliente nunca ve borradores, notas internas, costos ni otros clientes.
- Todo dato cuelga de un `cliente_id`; cada consulta pasa por una única capa que filtra por membresía (el id de la URL no alcanza). Cada endpoint tiene su test de "A no ve lo de B".
- Nada se borra: se **anula** con motivo y queda auditado.
- Cada comentario declara visibilidad: `interna` o `cliente`.

## 3. Modelo de dominio

```
Cliente 1─N Local 1─N Elemento 1─N Control N─1 TipoControl
              │        (también hay Controles a nivel Local)
              │                       └─1─N Ejecucion N─1 Visita
              ├─1─N Visita 1─N Informe ─N Adjunto
              └─1─N Pedido ─N Adjunto
```

- **Cliente**: razón social, CUIT, contactos, abono (rubros incluidos, SLA).
- **Local**: sucursal, dirección, jurisdicción, zona (para recorridos), rubro (gastronómico, retail, farmacia), horario, estado (activo, cerrado temporal, baja) y **requisitos de acceso** (en shoppings: permiso de trabajo con X horas, nómina con ART/AP, horario nocturno).
- **TipoElemento**: matafuego ABC/CO2, tanque, campana, tablero, luz de emergencia… con atributos propios en JSON validado (kg, capacidad, fabricación).
- **Elemento**: local, tipo, **ubicación** ("Depósito, junto a la puerta"), atributos, QR, estado (activo, retirado temporal, baja). Es **el puesto, no la unidad física**: si se cambia el matafuego, sigue siendo "Matafuego 2 – Depósito" y la serie/tarjeta nueva queda en la ejecución. El historial no se corta.
- **TipoControl** (catálogo): aplica a tipo de elemento o local; `periodicidad` (días/meses/años o `manual`); `anticipacion_dias`; `base_recalculo` (`fecha_ejecucion` | `vencimiento_anterior`); `evidencia_requerida`; `requiere_matriculado`; checklist.
- **Control**: elemento o local, tipo, `periodicidad_override`, `proximo_vencimiento` (caché derivada de las ejecuciones), `suspendido` + motivo.
- **Ejecucion** (inmutable): control, visita, **fecha real**, quién (SCP o proveedor con matrícula), resultado (`ok` | `observado` | `no_apto`), `vencimiento_anterior`, `vencimiento_calculado`, `vencimiento_asignado`, `motivo_ajuste`, n° tarjeta/certificado, serie, adjuntos, anulación + motivo.
- **Visita**: local, fecha programada/real, tipo (preventiva, correctiva, relevamiento, obra), estado (programada, en curso, cerrada, **fallida** + motivo), firma, check-in.
- **Informe**: número correlativo, estado (borrador, publicado, reemplazado), versión, PDF inmutable.
- **Pedido**: local, rubro, urgencia, estado, `dentro_abono`, plazo SLA, conformidad.
- **Adjunto** (tipo, miniatura, visibilidad), **Notificacion** (clave de idempotencia, estado) y **Auditoria** (quién, qué, cuándo).

### Periodicidad y recálculo

Las reglas viven en un único servicio de dominio con tests unitarios:

1. **Periodicidad efectiva** = la del control si existe; si no, la del tipo.
2. **Con resultado `ok` u `observado`:** vencimiento calculado = base + periodicidad.
   - Base = fecha de ejecución; en controles de calendario fijo (fumigación mensual), el vencimiento anterior. Si así queda en el pasado, se usa la fecha de ejecución.
   - Fin de mes ajustado: 31/08 + 6 meses = 28/02.
3. **Ajuste manual solo con motivo.** Caso típico: la tarjeta de la recargadora trae otra fecha y el vencimiento legal es el del certificado. Se guardan ambos.
4. **`no_apto`** no renueva: abre una tarea correctiva visible para el cliente.
5. **Ejemplo:** vence 20/11, anticipación 7 días → entra en ventana el 13/11; se cambia el 14/11 → nuevo vencimiento 14/05.
6. **Anular** una ejecución recalcula desde la última válida.
7. **Cambiar la periodicidad del catálogo** no toca vencimientos asignados; hay "recalcular en lote" con vista previa.
8. **El estado** (al día, próximo, vencido, suspendido) se calcula al consultar contra hoy y no se guarda: nunca queda desactualizado aunque falle el job.

Catálogo inicial sugerido (los valores hay que confirmarlos por jurisdicción):

| Tipo de control | Periodicidad | Anticipación | Evidencia |
|---|---|---|---|
| Matafuego: control/recarga | 6–12 meses | 7 días | Foto de la tarjeta y número |
| Matafuego: prueba hidráulica | 5 años | 30 días | Certificado |
| Matafuego: vida útil | 20 años desde la fabricación | 90 días | — |
| Limpieza de tanque de agua | 6 meses | 15 días | Certificado y análisis bacteriológico |
| Control de plagas | Mensual | 5 días | Certificado de empresa habilitada |
| Limpieza de campana y conductos | 1–3 meses | 7 días | Fotos de antes y después |
| Puesta a tierra (Res. SRT 900/15) | 12 meses | 30 días | Protocolo firmado |
| Luces de emergencia: autonomía | 3 meses | 7 días | Checklist |
| Tablero y disyuntores | 6 meses | 7 días | Checklist y fotos |
| Instalación de gas | 12 meses | 15 días | Informe de un matriculado |
| Habilitación, bomberos, póliza, ascensor | `manual` | 60 días | PDF |

## 4. Pantallas del SUPERVISOR

1. **Tablero "Hoy / Semana"**: vencidos, próximos (7 y 30 días), pedidos ordenados por SLA restante y visitas del día. Cada número abre la lista filtrada.
2. **Agenda de vencimientos**: filtros por cliente, local, zona, rubro, tipo, fechas y estado. Acción **"Armar visita"**: junta todo lo que vence en ese local en los próximos N días, para aprovechar el viaje. Exporta a Excel.
3. **Calendario de visitas**: reprogramar arrastrando; avisa si falta pedir el permiso de acceso.
4. **Ficha de cliente**: abono, SLA, contactos, locales con semáforo, usuarios.
5. **Ficha de local**: datos, accesos y contactos; pestañas de controles, elementos, historial (línea de tiempo única), informes, pedidos y documentos.
6. **Ficha de elemento**: atributos, historial con foto de cada tarjeta, imprimir QR.
7. **Modo visita (celular)**: check-in → controles y pedidos pendientes con botones grandes y cámara directa → por ítem: resultado, fotos, n° de tarjeta, vencimiento propuesto (ajustable con motivo) → trabajos no planificados ("cambié 3 tubos LED") → firma del encargado o motivo → borrador de informe. También "visita fallida" con foto y motivo.
8. **Escáner QR**: el sticker del elemento abre "Registrar ejecución". Chau al "¿cuál de los 6 matafuegos era?".
9. **Informes**: editor con fotos y epígrafes, vista previa del PDF, **Publicar**. Corregir uno publicado genera versión nueva con motivo.
10. **Bandeja de pedidos**: por estado y SLA; triage dentro/fuera de abono, asignación, mensajes internos o visibles.
11. **Catálogo (admin)**: tipos, periodicidad, anticipación, base de recálculo, evidencia.
12. **Importación Excel** del relevamiento inicial, con validación por fila y vista previa.
13. **Usuarios y auditoría.**

## 5. Pantallas del CLIENTE

1. **Inicio**: semáforo por local ("12 al día, 2 próximos, 0 vencidos"), próximas visitas, últimos informes y pedidos abiertos.
2. **Mis locales**: % de cumplimiento por sucursal (cadenas).
3. **Local**: controles con estado, última ejecución, próximo vencimiento y certificado descargable.
4. **Calendario**: vencimientos y visitas, para coordinar acceso con el shopping.
5. **Informes**: filtros, fotos antes/después, PDF.
6. **Pedidos**: crear desde el celular con fotos, seguir, dar conformidad o reabrir. Botón visible **"Emergencia: llamar a la guardia"**: ante una pérdida de gas, el canal es el teléfono.
7. **Carpeta de cumplimiento**: PDF/ZIP por local con estado y último certificado de cada control, lista para un inspector.
8. **Resumen mensual**: visitas, controles, pedidos y tiempos de respuesta; hace visible el abono.
9. **Mi cuenta**: usuarios de la empresa y preferencias de notificación.

## 6. Flujos clave

**A. Del vencimiento al nuevo vencimiento**
1. Job 06:00: controles con `proximo_vencimiento − anticipacion ≤ hoy` sin aviso para ese vencimiento → agenda + **un** digest diario al supervisor.
2. El supervisor arma la visita; el sistema le recuerda el permiso de acceso si hace falta.
3. Aviso al encargado: "Visita 14/11, 9 h: control de 4 matafuegos".
4. En el local: check-in → registro con foto y n° de tarjeta → recálculo → si `no_apto`, tarea correctiva → firma.
5. Informe en borrador → revisión → publicación → el cliente recibe el PDF y su semáforo vuelve a verde.
6. Si llega el vencimiento sin ejecución: pasa a vencido y escala al Admin SCP.

**B. Pedido o reclamo**
1. El encargado lo crea con fotos y urgencia. SLA sugerido: Emergencia (gas, inundación, corte total) < 4 h; Urgente < 24 h; Normal < 5 días hábiles.
2. Aviso inmediato al supervisor; emergencias también por WhatsApp o push.
3. Triage dentro/fuera de abono (fuera requiere presupuesto aprobado, fase 3).
4. Se programa o se suma a una visita; el cliente ve la fecha estimada.
5. Se resuelve con fotos antes/después e informe; conformidad del cliente o cierre automático a 7 días.
6. Se mide contra el SLA del contrato.

**C. Informe**
1. Nace en borrador al cerrar la visita (o manual para obras y relevamientos).
2. Se arma solo con lo cargado: controles y nuevos vencimientos, trabajos, observaciones, fotos, firma.
3. El supervisor ajusta epígrafes, oculta fotos y agrega recomendaciones ("reemplazar tablero; fuera de abono").
4. Al publicar: PDF numerado (SCP-2026-000123), congelado, notificado.

## 7. Alertas y notificaciones

| Evento | A quién | Cuándo | Canal |
|---|---|---|---|
| Control entra en ventana | Supervisor | Digest diario a las 07:00 | Email y tablero |
| Control vencido sin ejecutar | Supervisor y Admin SCP | Todos los días mientras siga vencido | Email |
| Visita programada | Encargado | Al programarla y 24 h antes | Email (WhatsApp en fase 3) |
| Visita fallida | Admin cliente | En el momento | Email |
| Informe publicado | Encargado y admin cliente | En el momento | Email con PDF |
| Pedido nuevo | Supervisor | En el momento | Email; emergencias también por WhatsApp o push |
| SLA al 75 % | Supervisor | Al llegar al 75 % del plazo | Email y tablero |
| Cambio de estado de un pedido | Quien lo creó | En el momento | Email |
| Documento por vencer | Admin cliente y supervisor | 60, 30 y 7 días antes | Email |
| Resumen mensual | Admin cliente | Primer día hábil del mes | Email con PDF |
| Falla del job o de los envíos | Admin técnico | En el momento | Monitoreo |

Criterios:
- **Agrupar:** un email por día, no veinte.
- **Respetar las preferencias** de cada usuario.
- **No duplicar:** cada aviso lleva una clave de idempotencia (`control + vencimiento + evento`), así un reintento no lo manda dos veces.

## 8. Stack técnico

- **Django 5 + PostgreSQL**, HTML del servidor + **HTMX**, un solo monolito. Auth, formularios, migraciones y el **admin** (catálogo y back office gratis) cubren buena parte del sistema; Python se consigue fácil en Argentina; sin SPA ni API que mantener. Equivalente: Rails + Hotwire si el equipo ya lo domina.
- **Celular**: PWA responsive con borradores locales y cola de fotos con reintentos. Offline completo, solo si la práctica lo pide.
- **Fotos**: compresión en el navegador (1600 px, JPEG 80 %), subida directa a **Cloudflare R2** con URL prefirmada (compatible S3, sin costo de egreso), bucket privado con URLs firmadas de vida corta, miniaturas en segundo plano.
- **PDF**: **WeasyPrint** con las mismas plantillas HTML; se genera al publicar y se guarda en R2 como documento oficial.
- **Jobs**: cola sobre Postgres (`django-q2` o `procrastinate`) + cron diario. Sin Redis ni Celery.
- **Email**: Amazon SES o Brevo, con SPF/DKIM/DMARC. WhatsApp (Cloud API de Meta) en fase 3.
- **Hosting**: VPS de 2–4 GB (Hetzner o DigitalOcean) con Docker Compose y Caddy, o Render si no quieren administrar servidor. `pg_dump` diario cifrado a R2 y prueba de restore mensual. USD 20–50/mes.
- **Operación y seguridad**: Sentry, logs estructurados, alerta si el job diario no corrió; magic link para encargados, 2FA para Admin SCP, límite de intentos de login.

## 9. Riesgos, casos borde y decisiones abiertas

**Riesgos**
- **Adopción**: si cargar es lento, el supervisor no carga y el sistema miente. Mitigación: pocos toques, QR, precarga.
- **Fuga entre clientes**: capa de acceso única + tests por endpoint.
- **Responsabilidad legal**: el certificado lo firma el matriculado; el "al día" debe apoyarse en esa evidencia. Texto legal revisado por abogado.
- **Relevamiento inicial**: con datos malos, las alertas fallan. Prever una visita de relevamiento por local.
- **Ley 25.326**: fotos con personas o patentes; definir qué se publica.

**Casos borde**
- Carga tardía: cuenta la fecha real, no la de carga.
- Matafuego en recarga: "retirado temporal" + registro del equipo sustituto.
- Local cerrado (refacción, temporada): controles suspendidos, sin alertas.
- Visita fallida: evidencia de que SCP fue; la protege si el vencimiento se pasa por culpa del cliente.
- Ejecución en el elemento equivocado: anular y recargar; recálculo automático.
- SLA en días hábiles con calendario de feriados nacionales.

**Preguntas para el dueño**
1. ¿Los 6 meses del matafuego son control propio o la recarga? ¿Quién recarga?
2. ¿El cliente ve los vencidos en tiempo real? (Recomiendo sí: la transparencia vende el abono.)
3. ¿Qué queda fuera del abono? ¿Presupuestos dentro del sistema?
4. ¿SLA por contrato o estándar?
5. ¿Firma del encargado obligatoria?
6. ¿Usan WhatsApp con clientes? ¿Desde qué número?
7. ¿En qué jurisdicciones operan?
8. ¿Cuántos clientes, locales y supervisores hoy y en 12 meses? ¿Hay técnicos?
9. ¿Alguna cadena exige cargar datos en su portal de proveedores?
10. ¿Hay un formato de informe actual para replicar?

## 10. Roadmap

**Fase 0: relevamiento (1–2 semanas).** Catálogo con el dueño, plantilla de importación, piloto de 3 a 5 locales.

**Fase 1: MVP (6–8 semanas).** Roles; clientes, locales, elementos y catálogo; controles con recálculo y anulación; agenda; modo visita con fotos; informes PDF; portal del cliente (inicio, local, informes, vencimientos); digest al supervisor y aviso de informe; importación Excel; backups. Éxito: el piloto trabaja un mes solo con el sistema y no se pasa ningún vencimiento.

**Fase 2: servicio (4–6 semanas).** Pedidos con SLA, visitas programadas con aviso y requisitos de acceso, firma, QR, carpeta de cumplimiento, resumen mensual.

**Fase 3: escala.** Presupuestos fuera de abono, WhatsApp, técnicos y proveedores, offline completo, métricas de cumplimiento y respuesta para renovar contratos, integración con facturación.
