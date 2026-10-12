# Propuesta 5: plataforma de mantenimiento por abono para SCP

## 1. Resumen y supuestos

Una sola web app responsive, instalable como PWA, con dos caras: el **backoffice de SCP** (para cargar desde el local, con el celular en la mano) y el **portal del cliente** (lectura más pedidos). El núcleo es un **registro de cumplimiento**: todo lo que vence es un *elemento* con uno o más *planes de control*; cada ejecución deja evidencia y genera sola el próximo vencimiento. Todo trabajo termina en un **informe inmutable** (vista web con fotos más PDF).

**Tesis:** con un abono "todo incluido", el cliente no ve el trabajo preventivo. El sistema tiene que **hacerlo visible** (semáforo, rendición mensual, carpeta para inspecciones). Eso retiene clientes.

**Supuestos (a validar):**
- **S1.** Un solo operador, SCP. Multi-cliente quiere decir muchas organizaciones en una misma instancia, no un SaaS para otras empresas.
- **S2.** En el MVP cargan solo los supervisores (5 o menos). El rol de técnico queda previsto.
- **S3.** Escala: hasta 100 organizaciones, 500 locales y ~20.000 fotos por año.
- **S4.** Varios controles los hacen subcontratistas habilitados (matafuegos, tanques, plagas, medición de puesta a tierra por un matriculado según la Res. SRT 900/15). SCP coordina y sube el certificado.
- **S5.** La facturación del abono y los presupuestos quedan fuera del MVP.
- **S6.** El "matafuego a 6 meses" se toma como periodicidad configurable. Lo habitual es recarga anual (IRAM 3517), prueba hidráulica cada 5 años y vida útil de 20 años. **Hay que confirmarlo.**
- **S7.** Los vencimientos son fechas sin hora, en zona America/Argentina/Buenos_Aires.
- **S8.** Las emergencias (gas, chispazo, inundación) van por teléfono de guardia, no por la app.

## 2. Roles y permisos

| Rol | Alcance | Puede |
|---|---|---|
| Admin SCP | Todo | Catálogos, periodicidades, clientes, usuarios, anular informes, auditoría |
| Supervisor | Su cartera de locales; lectura del resto | Elementos, visitas, fotos, publicar informes, pedidos, notas internas |
| Técnico (fase 3) | Visitas asignadas | Cargar registros y fotos, sin publicar |
| Cliente admin | Todos los locales de su organización | Ver lo publicado, crear pedidos, invitar usuarios |
| Encargado de local | Uno o más locales | Ver sus locales, crear pedidos, firmar conformidad |

- **Aislamiento por organización** en una sola capa (un queryset `visibles_para(usuario)`), con un test de acceso cruzado (IDOR) por endpoint.
- El cliente **nunca** ve borradores, notas internas, costos ni fotos marcadas como internas.
- Los archivos se sirven con URLs firmadas de vida corta, emitidas después de chequear el permiso.
- Toda acción sobre algo publicado queda en la auditoría.

## 3. Modelo de dominio

```
Organizacion 1─* Local 1─* Elemento 1─* PlanControl *─1 TipoControl
                  │                        └─1─* Obligacion
                  ├─* Visita 1─* Registro *─0..1 Obligacion
                  │     └─1─* Informe (versionado)
                  ├─* Pedido ─0..1 Visita
                  └─* Hallazgo           Adjunto: polimórfico
```

- **Organizacion:** razón social, CUIT, nombre de fantasía, estado.
- **Local:** nombre, dirección, jurisdicción (define la normativa por defecto), rubro (gastronómico, retail, farmacia), horarios de acceso, contactos, supervisor, estado. **Abono:** vigencia, rubros incluidos, frecuencia de visita preventiva.
- **TipoElemento** (catálogo): matafuego ABC 5 kg, tanque de reserva, campana y conducto, tablero, disyuntor, luz de emergencia, documento (por ejemplo, el plan de autoprotección). Define atributos como n.º de serie, agente, ubicación y fecha de fabricación.
- **TipoControl** (catálogo; acá vive la periodicidad):
  - `periodo_valor` + `periodo_unidad` (días, meses o años).
  - `base_recalculo`: `DESDE_EJECUCION` (por defecto; el matafuego cuenta desde la fecha de su tarjeta) o `ANCLADO` (cuenta desde el vencimiento anterior y respeta un calendario fijo, como plagas mensual).
  - `anticipacion_dias`: matafuegos 10; tanques 20, porque hay que coordinar el corte de agua fuera del horario comercial.
  - `evidencia_requerida`: foto de oblea o tarjeta, certificado PDF, n.º de precinto.
  - `requiere_proveedor_habilitado`, `visible_cliente`, `referencia_normativa`.
  - `satisface_a`: la prueba hidráulica también cumple la recarga.
- **PlanControl:** elemento, tipo y un periodo propio con motivo (opcional). Un matafuego tiene tres planes: recarga anual, prueba hidráulica quinquenal y fin de vida útil (alerta de reemplazo, sin recálculo).
- **Obligacion:** plan, `fecha_vencimiento`, estado (`PENDIENTE`, `PROGRAMADA`, `CUMPLIDA`, `ANULADA`), registro que la cumplió, ajuste manual con motivo. **Una sola obligación abierta por plan**, garantizado con un índice único parcial.
- **Visita:** local, tipo (preventiva, correctiva, relevamiento, obra), fecha programada y fecha real, estado (`PLANIFICADA`, `EN_CURSO`, `CERRADA`, `PUBLICADA`), pedido de origen.
- **Registro:** visita, elemento y obligación (opcionales), rubro, descripción, resultado (`OK`, `OBSERVADO`, `NO_CONFORME`), fecha de ejecución, proveedor, precinto o certificado, `fuera_de_abono`.
- **Hallazgo:** lo detectado y no resuelto ("disyuntor no dispara"), con prioridad y foto. Es la base de los presupuestos.
- **Informe:** versión, estado (`BORRADOR`, `PUBLICADO`, `REEMPLAZADO`), PDF, hash SHA-256, conformidad (nombre, DNI, firma, fecha y hora).
- **Pedido:** categoría, urgencia, estado (`NUEVO`, `ACEPTADO`, `PROGRAMADO`, `RESUELTO`, `CERRADO`, `RECHAZADO`), SLA, visita.
- **Adjunto:** clave en el storage, hash, fecha de captura, etiqueta (antes, después, certificado), visible al cliente.
- **Notificacion** (outbox): canal, plantilla, clave de idempotencia, estado.

**Recálculo.** Pasa en una sola transacción al cerrar un registro vinculado a una obligación:
1. La obligación pasa a `CUMPLIDA` con la **fecha real de ejecución**, la de la tarjeta, no la de carga.
2. Nueva fecha = base + periodo. Los meses se suman con tope a fin de mes (31/08 + 6 meses = 28/02).
3. El supervisor ve la fecha propuesta **antes de confirmar** y puede ajustarla con un motivo si la tarjeta dice otra cosa.
4. Se crea la nueva obligación `PENDIENTE` y se procesan las de `satisface_a`.
5. Ninguna fecha se pisa: la cadena de obligaciones *es* el historial.

"Al día", "próximo" y "vencido" no se guardan: se calculan al leer, así no se desincronizan. Cambiar la periodicidad de un tipo afecta solo a lo futuro. Para lo abierto hay una acción "recalcular pendientes" con vista previa.

## 4. Pantallas del supervisor (pensadas para el celular)

1. **Mi semana:** vencimientos de los próximos 15 días agrupados por local, con los vencidos arriba en rojo; pedidos ordenados por SLA; visitas de hoy. Acción clave: elegir obligaciones y **armar una visita**.
2. **Cartera:** locales con semáforo (porcentaje al día, vencidos, pedidos, última visita), con filtros por cliente, zona y rubro.
3. **Ficha de local:** contactos, horarios de acceso (clave en shoppings), abono y pestañas: Elementos · Vencimientos · Visitas · Pedidos · Hallazgos · Legajo · Notas internas.
4. **Alta de elementos** con **plantillas por rubro**. "Gastronómico" trae matafuegos, tanque, campana, trampa de grasa, tablero, disyuntores, luces de emergencia y plagas. En el relevamiento se carga el vencimiento que dice la tarjeta.
5. **Visita en curso:** checklist precargado más trabajos libres. Por ítem: resultado, fotos de antes y después, precinto, proveedor, "fuera de abono". **El ítem no cierra si falta la evidencia que pide su tipo.** Al final, firma del encargado en la pantalla o link de conformidad.
6. **Editor de informe:** borrador automático; se edita el resumen, se ocultan fotos, se revisa la vista previa y se **publica**.
7. **Bandeja de pedidos:** por estado y con el SLA en colores. Se clasifica (abono o presupuesto), se vincula a una visita y se responde.
8. **Calendario:** visitas y vencimientos; al reprogramar se avisa al cliente.
9. **Catálogos** (admin): tipos, periodicidades, plantillas y proveedores con el vencimiento de su habilitación.
10. **Clientes y usuarios**, **reportes** (cumplimiento por cliente, vencidos sin programar, trabajos fuera de abono, carga por supervisor) e **importación CSV**.

## 5. Pantallas del cliente

1. **Panel:** semáforo ("38 de 40 controles al día"), vencimientos de los próximos 60 días ("programado para el 14/11"), últimas visitas y pedidos abiertos. Con varios locales, una tabla comparativa.
2. **Mi local:** elementos con su estado ("Matafuego #3 · Cocina · vence 20/11/2026") y el historial de cada uno.
3. **Visitas e informes:** galería de antes y después, y descarga del PDF.
4. **Carpeta de inspección:** los certificados vigentes en **un solo PDF**, más un QR para mostrárselos al inspector municipal, la ART o la aseguradora.
5. **Pedidos:** crear uno con fotos, urgencia y franja de acceso; seguirlo; confirmar que se resolvió o reabrirlo.
6. **Recomendaciones:** hallazgos abiertos, con un botón "quiero presupuesto".
7. **Rendición mensual:** qué se hizo en el mes en cada local.
8. **Usuarios y notificaciones** (cliente admin).

## 6. Flujos clave

**A. Vencimiento, aviso, visita y nuevo vencimiento**
1. Un job diario a las 06:00 detecta las obligaciones que entran en su ventana y las suma a "Mi semana".
2. El supervisor arma la visita y suma todo lo que vence en los próximos 30 días en ese local, para aprovechar el viaje.
3. El cliente recibe el aviso: "Martes 14/11, de 8 a 10: recarga de 4 matafuegos; se dejan sustitutos". Las obligaciones pasan a `PROGRAMADA`.
4. En el local se registra cada ítem con la foto de la tarjeta nueva y el precinto. Si el equipo va al taller, queda "en servicio externo" con el sustituto registrado.
5. Al cerrar el ítem se confirma la fecha propuesta: se cumple la obligación y se crea la nueva.
6. Firma, informe, publicación y aviso al cliente.
7. Si vence sin acción, se alerta al admin de SCP. Qué ve el cliente en ese caso está por decidir (§9).

**B. Pedido del cliente**
1. El cliente lo crea con fotos. Si es "urgente", antes de enviarlo la app le muestra el teléfono de guardia.
2. Se avisa al instante al supervisor.
3. Si entra en el abono, se acepta y se programa. Si no, queda en "requiere presupuesto", visible para el cliente.
4. Visita, registro e informe vinculados al pedido.
5. Pasa a `RESUELTO`. El cliente lo confirma o lo reabre dentro de 7 días; si no contesta, se cierra solo.

**C. Informe**
1. Al cerrar la visita se arma un borrador con los ítems, los resultados, las fotos y los hallazgos.
2. El supervisor saca las fotos no aptas (personas, cajas registradoras) y escribe el resumen.
3. Al publicar se genera el PDF con hash y un QR de verificación. Desde ese momento es inmutable.
4. Una corrección genera una versión nueva y la anterior queda "reemplazada".

**D. Alta de un cliente:** relevamiento con la plantilla del rubro, carga de los vencimientos actuales e invitación por mail. Entra por primera vez y su panel ya tiene datos.

## 7. Alertas y notificaciones

| Evento | A quién | Cuándo | Canal |
|---|---|---|---|
| Obligación entra en su ventana | Supervisor | Diario | In-app y resumen por mail los lunes |
| Obligación vencida | Supervisor y admin SCP | Día siguiente | Mail e in-app |
| Visita programada o reprogramada | Encargado | Al programar y 24 h antes | Mail (WhatsApp en fase 3) |
| Informe publicado | Cliente | Inmediato | Mail con link |
| Pedido nuevo | Supervisor | Inmediato | Mail y push de la PWA |
| Cambio de estado de un pedido | Autor | Inmediato | Mail |
| Pedido fuera de SLA | Admin SCP | Al vencer el SLA | Mail |
| Habilitación de un proveedor por vencer | Admin SCP | 30 días antes | Mail |
| Rendición mensual | Cliente admin | Día 1 | Mail con link |

El cliente recibe **pocos mensajes y todos accionables**. Un outbox con clave de idempotencia asegura que un reintento no duplique mails. Lo que no es crítico se puede apagar.

## 8. Stack técnico

- **Django 5 + PostgreSQL 16**, monolito con plantillas del servidor y **HTMX**. Un solo código y un solo deploy; auth, migraciones y formularios vienen resueltos, y el **Django admin** cubre los catálogos desde el primer día. Descarto una SPA con API aparte (dos bases de código para 1 o 2 personas) y Firebase o no-code (permisos multi-cliente difíciles y lock-in).
- **PWA:** se instala, recibe push y guarda los borradores de la visita en IndexedDB, porque en sótanos y depósitos no hay señal.
- **Jobs:** cron del hosting más una cola sobre Postgres (Procrastinate) para mails, miniaturas y PDFs. **Sin Redis.**
- **Fotos:** **Cloudflare R2** (compatible con S3, sin costo de egreso). Se suben directo con URL prefirmada y se comprimen en el celular a ~1600 px (de 5 MB a ~300 KB). Bucket privado, URLs firmadas de 10 minutos.
- **PDF:** **WeasyPrint**, con la misma plantilla HTML que la vista web. Se genera una vez y queda guardado.
- **Mail:** Amazon SES o Postmark, con SPF, DKIM y DMARC. **WhatsApp** en la fase 3 (Cloud API de Meta, con plantillas aprobadas y costo por conversación).
- **Hosting:** un PaaS con Postgres administrado (Render o DigitalOcean App Platform); si se busca algo más barato, un VPS en Hetzner con Docker Compose y Caddy. Backups: un `pg_dump` nocturno a otro bucket y una restauración de prueba cada trimestre.
- **Auth:** contraseña para SCP (2FA para los admins) y **link mágico** para los clientes, porque los encargados rotan.
- **Observabilidad:** Sentry y monitor de uptime. **Costo:** USD 30 a 60 por mes.

## 9. Riesgos, casos borde y decisiones abiertas

**Riesgos**
- **Carga inicial:** sin datos el sistema no vale. Se mitiga con plantillas, CSV y el relevamiento como primer servicio del abono.
- **Adopción:** si cargar una visita lleva más de 5 minutos, el supervisor vuelve al WhatsApp.
- **Transparencia:** mostrarle los vencidos al cliente puede jugar en contra.
- **Valor legal:** ante una inspección o un siniestro, el informe es evidencia. De ahí la inmutabilidad, el hash y la auditoría.
- **Ley 25.326:** fotos con personas. Hace falta un criterio de recorte y una política de retención.

**Casos borde**
- Matafuego que va a recarga con sustituto, o reemplazo definitivo: baja del viejo y alta del nuevo con su propio historial.
- Elemento que se muda de local, o local que cierra: baja lógica, se conserva el historial.
- Control que el cliente hizo con otro proveedor: se carga como "externo" con el certificado y recalcula igual.
- Control muy anticipado: si se cuenta desde la ejecución, el cliente pierde días. El sistema avisa.
- Fechas como el 29/02 o el 31; feriados al proponer visitas.
- Error en algo publicado: se anula y se reemplaza, nunca se edita.
- Baja de un cliente: exportación completa y 90 días de acceso de solo lectura.

**Preguntas para el dueño**
1. ¿Los 6 meses del matafuego son una revisión interna o la recarga? ¿Registran la prueba hidráulica y la vida útil?
2. ¿Qué controles se hacen con subcontratistas y quién firma los certificados?
3. ¿El cliente ve los vencidos? ¿Ve los montos fuera de abono?
4. ¿Hay técnicos que deberían cargar datos?
5. ¿En qué jurisdicciones trabajan (CABA, PBA, interior)? Eso cambia las periodicidades de tanques, plagas y autoprotección.
6. ¿Hace falta la firma del encargado en cada visita?
7. ¿Cuántos clientes, locales y supervisores hay hoy, y cuántos en 12 meses?
8. ¿Dónde están hoy los datos (Excel, Drive, papel)? ¿El canal real con los clientes es WhatsApp?

## 10. Roadmap

- **Fase 0 (2 semanas):** catálogo de controles validado con el dueño, 2 locales piloto y planilla de importación.
- **Fase 1, MVP (6 a 8 semanas, 1 o 2 devs):** roles y aislamiento multi-cliente; locales y elementos con plantillas; controles, obligaciones y recálculo; visitas con fotos y evidencia obligatoria; informe PDF inmutable; portal del cliente (panel, elementos, informes); mails de informe y resumen semanal; importación CSV. *Criterio de salida:* los pilotos trabajan un mes sin planillas paralelas.
- **Fase 2 (4 a 6 semanas):** pedidos con SLA, hallazgos, firma de conformidad, carpeta de inspección, calendario, rendición mensual y borradores offline.
- **Fase 3:** WhatsApp, presupuestos fuera de abono con aprobación del cliente, etiquetas QR en los elementos y rol de técnico.
- **Fase 4:** portal de proveedores para subir certificados, rentabilidad por local e integración con la facturación.
