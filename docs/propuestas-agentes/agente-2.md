# Propuesta 2: plataforma de mantenimiento por abono de SCP

## 1. Resumen y supuestos

Una web app instalable en el celular (PWA) con tres piezas:
1. **Motor de vencimientos.** Cada elemento tiene uno o más *controles* con su periodicidad. Cumplir uno genera el siguiente.
2. **Órdenes de trabajo (OT) y visitas.** El supervisor carga en el local, en minutos, fotos y firma. Cada visita produce un informe inmutable, en web y PDF.
3. **Portal del cliente.** Semáforo por local, informes, pedidos y la "carpeta para el inspector".

**Supuestos (a validar en el §9):**
- **[S1]** Es solo para SCP, no un SaaS.
- **[S2]** Escala: menos de 50 clientes, 200 locales, 5 supervisores y unos 2.000 elementos.
- **[S3]** En el MVP carga solo el supervisor.
- **[S4]** La periodicidad se define por tipo de control y se puede redefinir por elemento. Los "6 meses" del matafuego son un ejemplo: en la práctica conviven la recarga anual (IRAM 3517-2), la prueba hidráulica cada 5 años y los controles visuales.
- **[S5]** El abono es por local. Los trabajos fuera de abono se registran, pero se facturan por fuera del sistema.
- **[S6]** Los trabajos de terceros (recargadora, laboratorio de agua, control de plagas, matriculado) los coordina SCP y adjunta el certificado.
- **[S7]** Los vencimientos son fechas sin hora, en horario de Buenos Aires.

## 2. Roles y permisos

| Rol | Alcance | Puede |
|---|---|---|
| Admin SCP | Todo, incluida la auditoría | Gestionar catálogos, clientes, abonos y usuarios; reasignar carteras; anular informes |
| Supervisor | Su cartera de locales | Cargar elementos, OT y visitas; publicar informes; responder pedidos |
| Técnico (fase 3) | Sus OT | Cargar fotos y checklist (no publica) |
| Admin de cliente | Todos los locales de su empresa | Ver vencimientos e informes, crear pedidos, gestionar sus usuarios |
| Encargado de local | Sus locales | Ver, crear pedidos, confirmar o reabrir |

- **Aislamiento:** hay una sola base. Cada fila cuelga de un `local` y guarda el `cliente_id`. El filtro por usuario vive en **una única capa** (`visibles_para(usuario)`), y un test verifica que pedir datos de otro cliente devuelva 404.
- **Lo interno:** el cliente nunca ve borradores, notas internas, costos ni adjuntos internos.
- **Franquicias:** un usuario puede pertenecer a varios clientes.
- **Conformidad:** la firma se hace en el celular del supervisor, sin necesidad de cuenta.

## 3. Modelo de dominio

```
Cliente 1─N Local 1─N Elemento 1─N ControlProgramado 1─N Vencimiento
              │   (un control puede colgar directo del Local)      ▲
              ├─1─N OrdenTrabajo 1─N Visita 1─N RegistroControl ───┘
              │          ▲               └─1─N Informe (versionado)
              ├─1─N Pedido ──0..1──┘
              └─1─N Observación (hallazgo) ──0..1→ OrdenTrabajo
Usuario N─N Cliente (Membresía + locales permitidos)
Adjunto (polimórfico): Elemento | Visita | RegistroControl | Pedido
```

**Catálogos (los administra SCP)**
- **`TipoElemento`:** matafuego ABC 5 kg, tanque, campana, tablero, luz de emergencia, split. Cada tipo define un `atributos_schema` en JSON (capacidad, agente, N° de cilindro, año).
- **`TipoControl`** es la regla de periodicidad:
  - `periodicidad_cantidad` y `periodicidad_unidad`.
  - `base_recalculo`:
    - `EJECUCION`: cuenta desde que se hizo.
    - `CALENDARIO`: cuenta desde el vencimiento anterior.
    - `CERTIFICADO`: toma la fecha del documento del tercero.
  - Además: `aviso_dias`, `evidencia_obligatoria`, `checklist` y `visible_cliente`.
- **`PlantillaRubroLocal`:** los controles que se sugieren según el rubro. Un gastronómico, por ejemplo, suma campana y trampa de grasa.

**Catálogo inicial sugerido:**

| Control | Periodicidad | Base |
|---|---|---|
| Recarga de matafuegos | 12 meses | `EJECUCION` |
| Prueba hidráulica | 5 años | `CERTIFICADO` |
| Control visual de matafuegos | Mensual | `CALENDARIO` |
| Desinfección de tanque con análisis bacteriológico | 6 meses | `EJECUCION` |
| Limpieza de campana y conductos | 3 a 6 meses | `EJECUCION` |
| Control de plagas | Mensual | `CALENDARIO` |
| Medición de puesta a tierra (Res. SRT 900/15) | 12 meses | `CERTIFICADO` |
| Disyuntores y luces de emergencia | Mensual | `CALENDARIO` |
| Revisión de gas | 12 meses | `EJECUCION` |
| Habilitación municipal | La del documento | `CERTIFICADO` |

**Entidades operativas**
- **`Local`:** rubro, dirección, contactos y supervisor. El acceso (llave, alarma, "antes de que abra el shopping") es dato interno.
- **`Abono`:** vigencia, rubros incluidos, SLA por urgencia y visitas por mes.
- **`Elemento`:** tipo, código (`PAL-MAT-03`), ubicación ("salida cocina"), atributos, estado y `qr_token`.
- **`ControlProgramado`:** local o elemento, tipo de control, y `periodicidad_override` y `aviso_override` opcionales.
- **`Vencimiento`:** `fecha_vence` (DATE), estado (`ABIERTO`, `PROGRAMADO`, `CUMPLIDO`, `CANCELADO`), origen (`CALCULADO`, `MANUAL`, `CERTIFICADO`) y motivo de ajuste.
  - Un índice único parcial garantiza **un solo vencimiento abierto por control**.
  - **El semáforo no se guarda:** se calcula con la fecha de hoy, así nunca queda desactualizado.
- **`OrdenTrabajo`:** tipo (preventiva, correctiva, reclamo, obra), `dentro_de_abono` y estado (`NUEVA` → `PROGRAMADA` → `EN_CURSO` → `ESPERANDO_TERCERO` → `RESUELTA` → `CERRADA`).
- **`Visita`:** horarios, notas internas, texto para el cliente y firma.
- **`RegistroControl`:** fecha, tercero, N° de certificado, resultado (`OK`, `REEMPLAZADO`, `NO_APTO`, `NO_REALIZADO`) y fecha nueva.
- **`Pedido`:** canal, urgencia (`EMERGENCIA`, `URGENTE`, `NORMAL`), `sla_vence_en` y OT.
- **`Observación`:** el hallazgo, con su severidad.
- **`Informe`:** versión, PDF y hash. **Lo publicado no se edita:** se emite una versión nueva.
- **`Adjunto`:** etapa (antes, después o certificado) y visibilidad.
- **`Notificacion`** (outbox) y **`Auditoria`**.

**Recálculo (en una transacción idempotente)**
1. Se registra el control con resultado OK o reemplazo. El vencimiento actual pasa a `CUMPLIDO`.
2. La base sale de `base_recalculo`. Si es `CERTIFICADO`, cargar la fecha de la tarjeta es obligatorio.
3. Nueva fecha = base + periodicidad del elemento (o la del tipo, si el elemento no tiene una propia). Al sumar meses se ajusta a fin de mes: 31/08 + 6 meses = 28/02.
4. Se crea el nuevo vencimiento `ABIERTO`. Si el supervisor ajusta la fecha, debe poner un motivo y queda auditado.
5. Si el resultado es `NO_APTO` o `NO_REALIZADO`, el vencimiento sigue abierto y se genera una Observación.

**Ejemplo del enunciado.** El matafuego vence el 20/11/2026, el aviso sale el 13/11 y se cambia el 14/11. Con 6 meses de periodicidad:
- con `EJECUCION`, vence el **14/05/2027**;
- con `CALENDARIO`, vence el 20/05/2027.

Recomiendo `EJECUCION`, porque la tarjeta del recargador tiene la fecha real y es la que mira el inspector.

**Matafuego de préstamo mientras se recarga el original:** "Reemplazar unidad" da de baja la unidad vieja y da de alta la nueva en la misma ubicación, con las fechas de su tarjeta. El historial queda continuo.

**Cambios de periodicidad en el catálogo:** no son retroactivos. "Recalcular abiertos" los aplica, con vista previa.

## 4. Pantallas del supervisor (diseño mobile-first)

1. **Hoy:** visitas de la semana, pedidos con el SLA en riesgo y vencimientos en aviso. Acciones: iniciar visita, ver en Maps, llamar al encargado.
2. **Tablero de vencimientos:** semáforo filtrable. **"Programar visita del local"** agrupa en una OT todo lo que vence en ese local en los próximos N días. También permite posponer con motivo y exportar a Excel.
3. **Bandeja de pedidos:** ordenada por SLA. Se toman, se responden y se convierten en OT. Acá también se **cargan los pedidos que llegan por WhatsApp o teléfono**.
4. **Órdenes de trabajo:** timeline, vencimientos vinculados y adjuntos.
5. **Registrar visita** (la pantalla central): check-in, checklist y **registro masivo de controles**: un tilde por elemento, la foto de la tarjeta y la fecha nueva propuesta. Después, fotos de antes y después, hallazgos, firma y check-out, con borrador automático.
6. **Revisión del informe:** vista previa como la verá el cliente, notas internas aparte, selección de fotos y publicar.
7. **Ficha del local:** acceso, abono, plan de controles, elementos, historial y QR.
8. **Ficha del elemento:** historial con fotos, QR imprimible, reemplazar o dar de baja.
9. **Alta y relevamiento:** plantilla por rubro y carga en el lugar con las fechas de las tarjetas actuales. Si no se conoce una fecha, queda "a verificar". También admite importación desde Excel.
10. **Clientes y usuarios**, **Catálogos** y **Reportes** (cumplimiento a término, SLA y carga por supervisor).

## 5. Pantallas del cliente

1. **Inicio:** semáforo por local (del peor al mejor), próxima visita, últimos informes y pedidos abiertos.
2. **Controles:** último control, próximo vencimiento y certificado descargable.
3. **Informes:** filtros por local, fecha y rubro. Cada informe muestra fotos de antes y después, controles con su fecha nueva, hallazgos, firma y PDF.
4. **Pedidos:** alta con local, rubro, urgencia, fotos y franja de acceso. Seguimiento con timeline y comentarios para confirmar, reabrir o calificar.
5. **Carpeta del local:** **"Descargar carpeta para inspección"** arma un PDF con índice y todos los comprobantes vigentes, para el inspector municipal o la aseguradora.
6. **Resumen del abono:** mes a mes, visitas, controles hechos, pedidos resueltos, tiempo de respuesta y hallazgos pendientes.
7. **Usuarios** (solo el admin del cliente) y **preferencias de notificación**.

## 6. Flujos clave

**F1: vencimiento → visita → nuevo vencimiento**
1. Un job diario, a las 06:00, detecta los vencimientos donde `fecha_vence − aviso_dias ≤ hoy`. Si la fecha de aviso cae en feriado, se adelanta al día hábil anterior.
2. Esos vencimientos pasan a amarillo y entran en el resumen diario del supervisor.
3. "Programar visita del local" crea la OT y deja los vencimientos en `PROGRAMADO`.
4. El encargado recibe: "Visita el 14/11, 8 h: recambio de 6 matafuegos".
5. En el local: check-in, registro masivo (foto de la tarjeta y N° de certificado del recargador), confirmación de las fechas nuevas y firma.
6. En una transacción, los vencimientos pasan a `CUMPLIDO`, se crean los nuevos `ABIERTO`, la OT queda `RESUELTA` y el informe en `BORRADOR`.
7. Al publicar, se genera el PDF y le llega un email al cliente.
8. Si se pasa la fecha sin cumplir, el vencimiento queda en rojo y se avisa al supervisor y al admin SCP cada 3 días.

**F2: pedido del cliente**
1. El pedido entra por el portal, o el supervisor lo carga con canal WHATSAPP.
2. Se calcula el SLA y se avisa al supervisor. En una **emergencia** (gas, corte de luz, inundación) el aviso sale también por WhatsApp, y el portal muestra el teléfono de guardia y el de la distribuidora: la app no reemplaza la llamada.
3. El supervisor decide si entra en el abono y crea la OT. El cliente ve "En gestión" y después "Programado".
4. Visita e informe, como en F1.
5. Con el pedido `RESUELTO`, el cliente tiene 72 h para confirmar o reabrir; si no responde, se cierra solo.

**F3: informe**
1. Al cerrar la visita se arma un borrador con la plantilla del tipo de OT.
2. El supervisor edita el texto y elige las fotos.
3. Al publicar, el PDF se genera en segundo plano desde el mismo HTML y se guarda con su hash.
4. Las correcciones generan una versión nueva, con motivo.

**F4: hallazgo → correctivo.** Un disyuntor que no dispara se registra como Observación de severidad alta, visible para el cliente. De ahí sale una OT correctiva o un presupuesto (fase 3).

## 7. Alertas y notificaciones

| Evento | A quién | Cuándo | Canal |
|---|---|---|---|
| Vencimiento entra en aviso | Supervisor | Resumen diario, 7:00 | Email e in-app |
| Vencido sin cumplir | Supervisor y admin SCP | Al día siguiente y luego cada 3 días | Email e in-app (WhatsApp en F3) |
| Pedido nuevo | Supervisor | En el momento | Email e in-app; si es emergencia, también WhatsApp |
| Pedido sin tomar al 50 % o al 100 % del SLA | Admin SCP | Al cruzar cada umbral | Email |
| Cambio de estado de un pedido | Quien lo creó | En el momento | Email e in-app |
| Visita programada | Encargado | Al programarla y la víspera a las 18 h | Email (WhatsApp en F3) |
| Informe publicado | Usuarios del local | En el momento | Email con link |
| Resumen mensual | Admin del cliente | Primer día hábil del mes | Email con PDF |
| Habilitación o seguro a cargo del cliente | Admin del cliente y supervisor | 60, 30 y 7 días antes | Email |

Criterios: resúmenes en lugar de un mail por evento, preferencias por usuario y nada de noche salvo emergencias. Se usa el patrón outbox con clave de idempotencia, así un job relanzado no duplica avisos.

## 8. Stack técnico

- **App:** Django 5.2 LTS + PostgreSQL 17, con HTML del lado del servidor (**HTMX** + Tailwind). Un monolito con un solo deploy; el admin de Django resuelve los catálogos desde el día uno. Si el equipo sabe PHP, **Laravel + Filament** es equivalente.
- **Celular:** PWA, no app nativa. La cámara se usa con `<input capture>`; la cola offline queda para la fase 3.
- **Tareas:** cron diario y una cola sobre Postgres (django-q2) para PDFs y emails. Sin Redis.
- **Fotos:** se comprimen en el navegador (1600 px, unos 300 KB, por los datos móviles). Se suben con URL prefirmada a **Cloudflare R2**: bucket privado, sin costo de egreso. Se leen con URLs firmadas de pocos minutos, después de chequear permisos. Unos 5 GB por mes cuestan centavos.
- **PDF:** WeasyPrint, reutilizando las plantillas HTML.
- **Hosting:** Render o un PaaS similar, con Postgres gestionado, por USD 40 a 60 al mes. La alternativa es un VPS por USD 10 a 20. En ambos casos, `pg_dump` nocturno a R2 con restauración probada.
- **Mensajería y acceso:** email por SES o Postmark (SPF, DKIM y DMARC) y WhatsApp por la Cloud API de Meta en la fase 3. *Magic link* para los encargados y 2FA para el personal de SCP.
- **Operación:** Sentry. Los tests se concentran en el recálculo de fechas (fin de mes, bisiestos) y en el aislamiento entre clientes.

## 9. Riesgos, casos borde y preguntas

**Riesgos**
- **Adopción:** si cargar una visita lleva más de 5 minutos, vuelven el WhatsApp y el papel. Se mitiga con el registro masivo, el borrador automático y un piloto con un supervisor real desde la semana 1.
- **El cliente sigue con WhatsApp:** se acepta. El supervisor carga el pedido y responde con el link.
- **Valor legal del informe:** puede terminar ante un inspector, la ART o la aseguradora. Por eso es inmutable, versionado y lleva hash y firma.
- **Seguridad física:** fotos de tableros y cajas fuertes, códigos de alarma. Se guardan en un bucket privado y se cumple la Ley 25.326.

**Casos borde**
- **Control cargado dos veces:** lo bloquea el índice único.
- **Carga errónea:** "deshacer registro" reabre el vencimiento anterior y queda auditado.
- **Locales en shopping:** solo se puede entrar fuera de horario.
- **Baja de un local:** el cliente conserva la lectura de los informes por un plazo a definir.
- **Demora de un tercero:** la OT queda en `ESPERANDO_TERCERO` y el vencimiento sigue en rojo, con el motivo visible.

**Preguntas para el dueño**
1. ¿Los 6 meses del matafuego son un control propio o la recarga? ¿Se cuentan desde el cambio o desde el vencimiento anterior?
2. ¿El cliente ve lo vencido en rojo? Recomiendo que sí: la transparencia es lo que vende el abono.
3. ¿Qué incluye el abono y qué se presupuesta aparte?
4. ¿Los informes se publican directo o pasan por revisión?
5. ¿Qué SLA se compromete por urgencia? ¿Hay guardia 24 h?
6. Habilitaciones y seguros: ¿los gestiona SCP o el sistema solo avisa?
7. ¿El QR es público o pide login? ¿Hay planillas para migrar?

## 10. Roadmap

- **Fase 0: descubrimiento (1 a 2 semanas).** Catálogo real de controles y maquetas de "Registrar visita".
- **Fase 1: MVP (6 a 8 semanas, 1 o 2 desarrolladores).**
  - Roles y aislamiento entre clientes.
  - Clientes, locales, elementos y catálogos.
  - Motor de vencimientos con semáforo y resumen por email.
  - OT y visita con fotos y registro masivo.
  - Informe web y PDF.
  - Portal del cliente: inicio, controles e informes.
  - Backups.
  - **Piloto con 1 o 2 clientes.**
- **Fase 2: cliente activo (4 a 6 semanas).**
  - Pedidos con SLA.
  - Firma de conformidad.
  - Hallazgos que generan OT.
  - Carpeta para inspección.
  - Resumen mensual.
  - QR.
  - Importación desde Excel.
- **Fase 3: escala.**
  - WhatsApp.
  - Modo offline.
  - Presupuestos adicionales.
  - Rol técnico.
  - Reportes de SLA.
  - Ruteo.

**Métricas de éxito**
- Al menos 95 % de los controles cumplidos antes de vencer.
- Informes publicados dentro de las 24 h.
- Una visita cargada en menos de 5 minutos.
- Al menos 60 % de los pedidos por el portal a los 6 meses.
