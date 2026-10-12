# SCP: propuesta de producto y arquitectura

> Sistema web de mantenimiento por abono: vencimientos, visitas, informes y pedidos. Versión 1, 12/10/2026.

## 1. Resumen y supuestos

**Idea central:** cada visita que carga el supervisor produce dos cosas: **el informe** que ve el cliente y **el recálculo de los vencimientos**. Se carga una vez y sale todo. El cliente ve, por local, un semáforo de cumplimiento, sus certificados y sus informes. SCP ve qué vence, qué falta programar y qué reclamos se están por pasar del SLA.

Una sola aplicación web con dos caras: **Backoffice SCP** (para el celular, se carga en el local) y **Portal Cliente**.

**Supuestos (a validar):**
- **[S1]** Hay un solo prestador, SCP. No es un SaaS para varias empresas, pero sí maneja muchos clientes y locales.
- **[S2]** Volumen inicial: hasta 50 clientes, 200 locales y 5 supervisores. El diseño aguanta 10 veces eso.
- **[S3]** En el MVP cargan solo los supervisores. Los técnicos no usan el sistema.
- **[S4]** El nuevo vencimiento se cuenta **desde el día del trabajo**. Ejemplo: vence el 20/11, se cambia el 13/11 y queda 13/05. Esto se configura por tipo de control (§3).
- **[S5]** Algunos controles los hace un tercero habilitado (recargadora, tanques, plagas). SCP carga el certificado y el sistema lo trata como trabajo propio.
- **[S6]** La facturación (ARCA) queda afuera. El abono se guarda solo como dato del contrato.
- **[S7]** El cliente ve un informe recién cuando SCP lo publica.
- **[S8]** Zona principal CABA y GBA. La normativa cambia por municipio, así que las periodicidades son configurables.

## 2. Roles y permisos

| Rol | Alcance | Ve | Edita |
|---|---|---|---|
| Admin SCP | Todo | Todo, incluida la auditoría | Catálogos, periodicidades, usuarios, abonos |
| Supervisor SCP | Sus locales asignados | Todo de esos locales, con notas internas | Elementos, vencimientos, visitas, informes, reclamos |
| Cliente administrador | Todos los locales de su empresa | Estado, vencimientos, informes publicados, certificados | Crea, confirma o reabre reclamos |
| Encargado de local | Sus locales puntuales | Lo mismo, solo sus locales | Crea reclamos, firma conformidad |

- **Multi-cliente y multi-local:** `Membresia(usuario, cliente, local?)` define qué ve cada uno; si `local` está vacío, ve todos los locales del cliente. Todo el portal pasa por un único filtro `visible_para(usuario)` y nunca se confía en el id de la URL. Así nadie ve datos ajenos cambiando un número (IDOR), y eso tiene tests.
- **Archivos:** nunca son públicos. Se entregan con una URL firmada de corta duración, después de chequear el permiso. Cada foto tiene `visible_cliente`, que el supervisor puede apagar (por ejemplo, si aparece un empleado).
- Las **notas internas** nunca le llegan al cliente, y queda auditado quién cambió cada fecha de vencimiento y por qué.

## 3. Modelo de dominio

```
Cliente 1─N Local 1─N Elemento 1─N Vencimiento N─1 TipoControl
              │                        │ 1─N Renovacion
              ├─N Visita 1─N Tarea ────┘  (una tarea puede renovar un vencimiento)
              │     └─1 Informe ── Adjuntos
              └─N Reclamo ──(0..1)→ Visita
```

- **Cliente**: razón social, CUIT, contactos, logo y estado.
- **Local**: cliente, dirección, municipio, rubro (gastronomía, retail, oficina), horarios de acceso, encargado, supervisor asignado, notas internas y estado.
- **Abono**: local, vigencia, monto, rubros incluidos, exclusiones y SLA por prioridad.
- **TipoElemento** (catálogo): matafuego ABC, tanque de agua, campana, tablero, luz de emergencia, termotanque, equipo de aire. Define los atributos (JSON validado) y los controles que se crean por defecto.
- **TipoControl**: `periodo_cantidad` + `periodo_unidad` (días, meses o años), `modo_recalculo`, `anticipacion_dias`, `requiere_certificado` y `ejecutor` (SCP o tercero).
- **Elemento**: local, tipo, nombre con ubicación ("Matafuego 3, cocina"), atributos, **unidad física actual** (número de serie y fecha de fabricación) y QR.
- **Vencimiento**: elemento (o el local, para obligaciones del local), tipo de control, período propio opcional y `fecha_vencimiento` (DATE).
- **Renovacion**: fecha anterior, fecha de ejecución, fecha nueva, `origen` (CALCULADA o MANUAL), motivo y usuario. Solo se agregan filas; nunca se editan.
- **Visita**: local, tipo (preventiva, correctiva, inspección, relevamiento), origen, estado (programada, realizada, **fallida**, cancelada), fechas y supervisor.
- **Tarea**: visita, rubro, elemento o vencimiento si corresponde, resultado (OK, observado, no realizado), materiales y `fuera_de_abono`.
- **Informe**: número correlativo (SCP-2026-000123), estado, resumen, recomendaciones, firma de conformidad, PDF y versión. **Publicado no se modifica**: una corrección genera la versión 2.
- **Adjunto**: de un informe, tarea, elemento o reclamo; tipo (antes, después, certificado) y `visible_cliente`.
- **Reclamo**: local, autor, rubro, prioridad, fotos, estado, `sla_vence_at` y visita vinculada.

### Periodicidad y recálculo
- La fecha se guarda como `DATE`, sin hora, en horario de Argentina. Fórmula: `nueva = base + período`, sumando meses de calendario (31/08 + 6 meses = 28/02).
  - **DESDE_EJECUCION** (por defecto): la base es el día del trabajo. Coincide con la tarjeta del matafuego y no estira plazos.
  - **DESDE_VENCIMIENTO**: la base es el vencimiento anterior. Sirve para rutinas fijas ("luces de emergencia el día 5") y evita que el calendario se corra.
- **Corrección manual:** si el certificado del tercero trae otra fecha, vale el papel. El sistema propone la fecha calculada y el supervisor la cambia con motivo y certificado obligatorios.
- **El estado se calcula, no se guarda** (*vencido*, *por vencer* según la anticipación, *vigente*). Un proceso diario solo manda avisos.
- **Varios controles por elemento:** un matafuego tiene recarga (12 meses, IRAM 3517), prueba hidráulica (5 años), vida útil (20 años) y control visual (6 meses, como en el ejemplo). Cada uno vence por su lado.
- **Reemplazo de unidad:** en el rubro es común llevarse el matafuego a recargar y dejar uno de reemplazo. Por eso el Elemento es el **puesto**. "Reemplazar unidad" registra el nuevo número de serie y su última prueba hidráulica, recalcula los controles y guarda las unidades anteriores en el historial.
- Si cambia la periodicidad de un tipo, se aplica desde la próxima renovación, sin reescribir la historia.

**Catálogo inicial sugerido** (validar con el dueño):

| Control | Período típico | Lo ejecuta |
|---|---|---|
| Recarga / prueba hidráulica de matafuego | 12 meses / 5 años | Recargadora habilitada |
| Desinfección de tanque de agua | 6 meses | Empresa habilitada, con certificado |
| Control de plagas | 1 mes (gastronomía) | Empresa habilitada |
| Limpieza de campana y conducto | 3 meses | SCP |
| Medición de puesta a tierra (Res. SRT 900/15) | 12 meses | Matriculado |
| Prueba de disyuntores y luces de emergencia | 1 mes | SCP |
| Revisión de gas y ventilaciones | 12 meses | Gasista matriculado |
| Filtros de aire acondicionado | 3 meses | SCP |
| Plan de autoprotección y simulacro | 12 meses | Profesional habilitado |

## 4. Pantallas del supervisor (para el celular)

1. **Mi semana** (inicio): *vence pronto sin visita programada*, *visitas de hoy y mañana* y *reclamos abiertos* con la cuenta regresiva del SLA. Acciones: programar visita, llamar al encargado.
2. **Planificador:** calendario semanal. Al programar sugiere sumar lo que vence en ese local en los próximos 30 días ("ya que vas por los matafuegos, la campana vence en 3 semanas").
3. **Locales:** lista con semáforo y filtros. La ficha muestra accesos, abono y notas internas, con pestañas de elementos, vencimientos, informes y reclamos.
4. **Elementos:** carga de a uno o **importación desde Excel**, e impresión de etiquetas QR. Cada ficha muestra la unidad actual, sus controles e historial.
5. **Vencimientos (todos):** tabla con filtros por estado, tipo, cliente y fechas, exportable a Excel. Acciones: programar, corregir fecha con motivo, suspender.
6. **Ejecutar visita:** checklist de lo planificado. Por tarea: resultado, fotos de antes y después (comprimidas en el celular), materiales y observación. El QR abre el elemento. Antes de confirmar muestra la fecha nueva ("nuevo vencimiento: 13/05/2027"). Permite agregar tareas, marcar la visita como fallida con evidencia y tomar la firma del encargado.
7. **Revisión del informe:** vista previa del PDF; se ocultan fotos o se corrige el texto. Al **publicar**, se avisa al cliente.
8. **Reclamos:** bandeja por estado y prioridad. Cada pedido se acepta, se marca fuera de abono o se rechaza con motivo, y se vincula a una visita.
9. **Configuración** (admin): tipos, periodicidades, SLA y usuarios, con el Django Admin.

## 5. Pantallas del cliente

1. **Inicio:** con varios locales, una grilla con el semáforo de cada uno (% de controles vigentes). Con uno solo: *próximos vencimientos y cuándo los atiende SCP* ("Matafuegos: vence 20/11, visita programada 13/11"), últimos informes y reclamos abiertos.
2. **Vencimientos y certificados:** estado por local y rubro, con descarga del último certificado. El botón **"Legajo para inspección"** arma un PDF con todos los controles y certificados vigentes, para mostrar ante una inspección municipal o de bomberos.
3. **Informes:** listado con filtros por local, rubro y período. El detalle tiene tareas, fotos de antes y después, recomendaciones, firma y PDF.
4. **Pedidos y reclamos:** se cargan en tres pasos (rubro, urgencia, foto con descripción) y se siguen en una línea de tiempo. El cliente confirma o reabre. Siempre se ve el aviso: *"Ante olor a gas o riesgo eléctrico, llamá primero a emergencias o a la guardia de SCP."*
5. **Inventario:** elementos del local con ubicación y estado. Solo lectura.
6. **Mi cuenta:** datos y preferencias de aviso (email o WhatsApp).

## 6. Flujos clave

**A. Del vencimiento a la renovación** (matafuegos cada 6 meses, desde el trabajo)
1. **06/11, 14 días antes:** queda *por vencer* y aparece en *Mi semana* y en el resumen por email del supervisor.
2. El supervisor programa la visita del 13/11 y suma lo que vence pronto en ese local. Al cliente le llega: *"Visita programada el 13/11: recarga de matafuegos"*.
3. **13/11:** en el local escanea cada QR y carga el resultado y la foto del marbete. Si hubo recambio, carga la unidad nueva.
4. El sistema propone **13/05/2027**. El supervisor confirma o corrige con motivo, y queda la Renovación.
5. Cierra con la firma del encargado, revisa el borrador del informe y lo publica. Al cliente le llega el link.
6. Si faltan 7 días sin visita programada, se avisa también al admin. Si pasa la fecha queda *vencido*, con aviso al supervisor y al admin. Avisarle o no al cliente es una decisión abierta (§9).

**B. Pedido o reclamo del cliente**
1. El cliente lo carga con foto y prioridad. El SLA sale del abono (por ejemplo, 4 h emergencia, 24 h urgente, 72 h normal).
2. El supervisor recibe el aviso al instante; si es emergencia, por WhatsApp.
3. Lo acepta dentro del abono, lo marca fuera de abono (presupuesto, fase 3) o lo rechaza con motivo.
4. Visita, trabajo e informe publicado. El reclamo pasa a *resuelto*.
5. El cliente confirma o reabre. Sin respuesta en 72 h, se cierra solo.

**C. Informe**
1. Se arma desde la visita: tareas con resultado y fotos, vencimientos renovados, recomendaciones ("reemplazar el disyuntor de la cocina") y firma.
2. El PDF se genera en segundo plano. Publicado no se modifica; una corrección emite una versión nueva.

**D. Alta de un cliente nuevo** (es lo que más cuesta y de lo que depende el éxito)
1. Visita de relevamiento: inventario completo, con foto de cada tarjeta o certificado y su fecha.
2. Importación desde una plantilla Excel. Lo que no tiene fecha queda **"sin dato"** y cuenta como rojo.
3. Se pegan los QR, se crean los usuarios y se entrega el primer *Legajo* como bienvenida.

## 7. Alertas y notificaciones

| Evento | A quién | Cuándo | Canal |
|---|---|---|---|
| Por vencer sin visita | Supervisor | Resumen diario 7:00, días hábiles | Email + panel |
| Sin programar a 7 días | Supervisor + admin | Diario hasta resolverse | Email |
| Vencido | Supervisor + admin (cliente a definir) | Día siguiente | Email (+ WhatsApp fase 2) |
| Visita programada | Encargado | Al programar y el día anterior | Email o WhatsApp |
| Informe publicado | Cliente | Al publicar | Email con link |
| Reclamo nuevo | Supervisor | Al instante | Email; WhatsApp si es emergencia |
| SLA en riesgo o vencido | Supervisor + admin | Al 75% del plazo y al vencer | Email + WhatsApp |
| Cambio en un reclamo | Cliente que lo creó | Al instante | Email |
| Resumen mensual | Cliente administrador | Día 1 | Email con PDF |

**Envío:** bandeja de salida (*outbox*) guardada junto con el evento; un proceso aparte la envía con reintentos y una clave que evita duplicados. Los emails llevan link, no adjuntos. WhatsApp va por Cloud API con plantillas de "utilidad" (se cobran por mensaje).

## 8. Stack técnico

| Pieza | Elección | Por qué |
|---|---|---|
| Backend y web | **Django**, un monolito | Probado; el **Admin** resuelve gratis la configuración. Hay muchos desarrolladores en Argentina |
| Frontend | HTML del servidor + **HTMX** + Tailwind; PWA instalable para el supervisor | Sin SPA ni build complejo. Anda en celulares de gama media |
| Base de datos | **PostgreSQL** gestionado | Restricciones y JSONB para atributos |
| Tareas en segundo plano | Cola sobre Postgres (Procrastinate) + cron diario | Sin Redis ni infraestructura extra |
| Fotos y archivos | **Cloudflare R2**, con subida directa por URL prefirmada | No cobra por descarga y el servidor no toca los archivos |
| Compresión | En el celular, antes de subir (1600 px, unos 300 KB) | Ahorra datos móviles y almacenamiento |
| PDFs | **WeasyPrint** (HTML a PDF) en segundo plano | Usa las mismas plantillas que la web |
| Email | Amazon SES o Postmark | Buena entrega, centavos por mes |
| Acceso | Clientes con **link mágico** por email; doble factor para el admin | El encargado no recuerda contraseñas |
| Hosting | Render o Railway: web, worker, cron y Postgres con backup diario | Sin servidores que administrar. USD 40 a 60 por mes |
| Monitoreo | Sentry gratuito + logs estructurados + healthcheck | Enterarse del error antes que el cliente |

**Cuentas rápidas:** 200 locales × 2 visitas × 15 fotos × 300 KB son unos 1,8 GB por mes, menos de USD 1 en R2.

**Sin señal:** la visita guarda el borrador en el celular (IndexedDB) y reintenta las subidas, así no se pierde lo cargado en un sótano. El offline completo con sincronización queda afuera: es caro y no hace falta.

## 9. Riesgos, casos borde y decisiones abiertas

**Riesgos y casos borde**
- **Si los datos iniciales están mal, el semáforo miente.** Por eso "sin dato" cuenta como rojo y se fotografía cada tarjeta.
- **Responsabilidad legal:** el certificado es la fuente, no el sistema; el portal lo aclara.
- **Visita fallida** (local cerrado o sin acceso): se registra con evidencia y hora. Cubre a SCP si después el control vence.
- Si un cliente rescinde, sus vencimientos se suspenden y conserva acceso de lectura N meses.
- Fechas: fin de mes, bisiestos y feriados. Los avisos salen en días hábiles; los vencimientos se cuentan en días corridos.
- Las fotos pueden mostrar personas (Ley 25.326). Se pueden ocultar y nunca son públicas.
- **Si cargar una tarea lleva más de 2 minutos, el supervisor no lo va a usar.**

**Preguntas para el dueño**
1. ¿El vencimiento se cuenta desde el día del trabajo o desde el vencimiento anterior? ¿Para todo igual?
2. Los 6 meses del ejemplo, ¿son de recarga o de control? La recarga suele ser anual.
3. ¿Qué hacen ustedes y qué tercerizan? ¿Quién firma cada certificado?
4. ¿El cliente ve tal cual los vencidos y las observaciones negativas? ¿Todo informe pasa por revisión?
5. ¿Qué queda fuera del "todo incluido" y cómo se aprueba un extra?
6. ¿Qué SLA se comprometen? ¿Hay guardia 24 h?
7. ¿Cargan también los técnicos?
8. ¿WhatsApp es imprescindible desde el primer día?
9. ¿Quieren firma del encargado en cada visita?
10. ¿Cuántos clientes, locales y supervisores tienen hoy, y en qué zonas?

## 10. Roadmap

**Fase 0, relevamiento (1 a 2 semanas):** catálogo de tipos y periodicidades con el dueño, plantilla Excel, prototipo navegable y 2 clientes piloto.

**Fase 1, MVP (6 a 8 semanas, 1 o 2 desarrolladores):** usuarios y roles; clientes, locales y elementos con importación Excel; vencimientos con recálculo y corrección manual; visitas con fotos; informe PDF y publicación; portal del cliente (semáforo, vencimientos, informes); reclamos básicos; emails clave. Piloto con 5 a 10 locales.

**Fase 2, operación (4 a 6 semanas):** SLA con escalamiento, WhatsApp, firma de conformidad, QR por elemento, Legajo para inspección, planificador que agrupa vencimientos, resumen mensual y mejor funcionamiento sin señal.

**Fase 3, gestión:** presupuestos fuera de abono con aprobación del cliente, reportes y KPIs, usuarios técnicos y vista pública por QR para inspectores.

**El MVP funcionó si:** todos los locales piloto tienen el inventario cargado, ningún vencimiento toma a nadie por sorpresa y los clientes dejan de pedir informes por WhatsApp.
