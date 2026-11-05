# Plan: documentos para inspecciones

> Pedido de la empresa ("Informes para inspecciones de locales gastronómicos", Patricio, 04/11/2026). Plan armado el 05/11/2026. Decisiones D23 a D27 en [`decisiones.md`](decisiones.md).

La app suma una **carpeta de papeles por local**, que hoy no existe. Son 43 documentos en PDF, repartidos en cuatro solapas: AGC, Protección del Trabajo (HyS), Autoprotección y Residuos. SCP sube los papeles. El cliente los ve con su semáforo. El inspector ve solo los vigentes, escaneando la tarjeta del local. Además, el supervisor completa un checklist del local con fotos.

Se hace en **7 sprints**. Cada uno termina en algo que se puede probar en el celular. Al final de este archivo hay una lista con cada punto del documento y el sprint en el que entra, para que no se pierda ninguno.

## Lo que decidiste (05/11)

| # | Tema | Decisión |
|---|---|---|
| D23 | Documentos por solapa | Cada local tiene un registro por documento del catálogo, con PDF, vencimiento y semáforo (Vigente, Por vencer, Vencido, Faltante, No aplica). Un documento puede estar en varias solapas y se carga una sola vez |
| D24 | Quién sube | **Solo SCP** sube los PDF. El cliente los ve todos, también los vencidos y los que faltan, pero no sube nada (sigue D19) |
| D25 | Tarjeta de inspección | Cada local tiene una **tarjeta con QR y chip NFC**, de plástico o impresa en 3D, que guarda el encargado. El inspector la escanea o le acerca el celular y ve, sin usuario, solo los PDF vigentes de ese local. La tarjeta se puede anular y reimprimir. Es una excepción a D20 solo para esta carpeta |
| D26 | Checklist del local | Lo completa el **supervisor de SCP** en el local, con foto de lo que está mal. El cliente lo ve como recordatorios. El inspector no lo ve |
| D27 | Controles y documentos juntos | Cuando se registra un matafuego, la campana, el tanque, la fumigación o la puesta a tierra, se sube ahí mismo el certificado y el documento se actualiza solo. Se carga una sola vez |

## Cómo afecta a lo que ya está

No se borra nada de lo que ya funciona. Todo lo nuevo se suma.

| Parte de la app | Qué cambia | Sprint |
|---|---|---|
| Base de datos | Tablas nuevas: catálogo de documentos, documentos por local, versiones de cada PDF, tarjetas, checklist. Las tablas de ahora no cambian. Solo se agrega la conexión entre los controles y los documentos | 1, 2, 4, 5, 6 |
| Archivos | Se empieza a usar el almacenamiento de archivos de Supabase, que hoy no se usa. Es privado: solo entra quien tiene permiso | 2 |
| Ficha del local (SCP) | Pestaña nueva **Documentos**, con las 4 solapas. Más adelante, la pestaña **Checklist** | 1, 6 |
| Alta de local | Al crear un local se crean solos sus documentos en "Faltante", igual que pasa hoy con los controles ("todos llevan todo", D15) | 1 |
| Más → Catálogo | Se suman el catálogo de documentos y los puntos del checklist, que el admin puede editar | 1, 6 |
| Registrar un control | Para matafuegos, campana, tanque, fumigación y puesta a tierra se agrega "Adjuntar certificado (PDF)" | 5 |
| App del cliente (`/c`) | Pestaña nueva **Documentos** con el semáforo. Más adelante, **Recordatorios** (el checklist) y un botón **Carpeta de inspección** | 3, 4, 6 |
| QR y acceso | Ruta pública nueva para la tarjeta (`/i/…`). Es lo único que se ve sin usuario. El QR de los equipos sigue igual (D20) | 4 |
| Agenda | Además de los controles, muestra los documentos que vencen | 7 |
| Próximos pasos | El punto 1 (cargar la fecha actual de cada control) se hace en el sprint 5, junto con el certificado. El punto 3 (avisos al celular) pasa al sprint 7 y suma documentos y checklist. Excel e informes en PDF quedan para después | 5, 7 |

## Los sprints

Cada sprint queda en `dev`. Se prueba con Playwright en la compu y en el celular, y se publica en Vercel solo cuando lo pedís.

### Sprint 1: catálogo y lista de documentos (sin PDF todavía)

- **Para qué:** ver, por cada local, qué papeles necesita y cuáles faltan.
- **Qué vas a ver:**
  - en la ficha del local, la pestaña Documentos con las 4 solapas;
  - en cada solapa, sus documentos con el semáforo: al principio, todos en "Faltante";
  - en los documentos "De corresponder" (ascensor, show en vivo, calderas, etc.), dos botones: **Aplica** o **No aplica**, con el motivo;
  - en Más → Catálogo, la lista de documentos para que el admin la edite.
- **Qué incluye:**
  - el catálogo completo cargado: los 21 de AGC, los 14 de HyS (la puesta a tierra es la misma de AGC), los 5 de Autoprotección y los 3 de Residuos, cada uno con su grupo, detalle, periodicidad y "Siempre" o "De corresponder";
  - los 10 documentos que el documento manda validar (HyS 1 a 4 y 13 a 15, y los 3 de Residuos) entran **apagados**, con la marca "A validar". El admin los prende cuando estén confirmados;
  - "Por vencer" empieza 30 días antes del vencimiento, y se puede cambiar por documento.
- **Listo cuando:** el Local de prueba muestra sus 33 documentos activos repartidos en las solapas, y marcar "No aplica" en uno lo pasa a gris con el motivo.

### Sprint 2: subir los PDF, con historial

- **Para qué:** que cada documento tenga su papel y su vencimiento.
- **Qué vas a ver:**
  - en cada documento, el botón **Subir PDF**, con fecha de emisión y de vencimiento. La app propone el vencimiento según la periodicidad: campana y calderas cada mes, tanques cada 6 meses, luces de emergencia cada año;
  - el botón **Abrir PDF**;
  - las versiones anteriores, que quedan guardadas;
  - **Deshacer** una carga equivocada.
- **Qué incluye:**
  - **documentos sin vencimiento**, como los planos, que no piden fecha;
  - **Simulacros:** cada local tiene su propia periodicidad, la del plan aprobado;
  - **Autoprotección 1** acepta disposición aprobatoria o declaración jurada;
  - **Otros documentos:** un documento libre con nombre propio, porque el inspector puede pedir algo que no está en la guía;
  - **Observaciones** en cada documento;
  - lo que se sube queda en el Historial del local;
  - solo se aceptan PDF, de hasta 20 MB cada uno.
- **Listo cuando:** se sube la puesta a tierra una sola vez, aparece en AGC y en HyS con el mismo PDF, y pasa a "Vigente".

### Sprint 3: el cliente ve sus documentos

- **Para qué:** que el cliente vea qué le falta antes de que llegue la inspección.
- **Qué vas a ver:** en la app del cliente, la pestaña **Documentos** con las 4 solapas. Los vencidos y los que faltan aparecen en rojo, arriba de todo. Cada documento abre su PDF. Además, un aviso dentro de la app: "Tenés 2 documentos vencidos y 3 que vencen este mes".
- **Qué incluye:** los "De corresponder" que SCP todavía no definió no se le muestran al cliente.
- **Listo cuando:** el usuario `cliente` ve los documentos del Local de prueba, abre un PDF y no puede subir ni cambiar nada.

### Sprint 4: tarjeta y carpeta del inspector

- **Para qué:** que el inspector vea los papeles en segundos, con el encargado al lado.
- **Qué vas a ver:**
  - el inspector escanea el QR de la tarjeta, o le acerca el celular al chip;
  - se abre la **Carpeta de inspección** del local, con las 4 solapas en botones grandes y **solo los documentos vigentes** (los que están por vencer siguen siendo vigentes);
  - con un toque, el PDF se abre a pantalla completa. No hay menús ni usuario;
  - el encargado también puede abrir la carpeta desde su app, por si se olvida la tarjeta.
- **Qué incluye, para el admin, en la ficha del local:**
  - **Tarjeta de inspección:** imprimir el QR, que usa el mismo armado de las etiquetas de los equipos;
  - el link para grabar en el chip NFC con una app gratuita del celular, como NFC Tools;
  - **Anular y hacer una nueva** si la tarjeta se pierde, y la tarjeta vieja deja de funcionar;
  - cada vez que se abre la carpeta queda anotada la fecha y la hora.
- **Seguridad:**
  - el link de la tarjeta es imposible de adivinar;
  - el link de cada PDF dura pocos minutos, así que no sirve reenviarlo;
  - la carpeta no aparece en Google;
  - se hace una revisión de seguridad aparte antes de publicar.
- **Listo cuando:** desde otro celular, sin usuario, el QR abre la carpeta y muestra solo lo vigente; al anular la tarjeta, el mismo QR ya no abre nada.

### Sprint 5: conectar los controles con los documentos, y el relevamiento

- **Para qué:** cargar una sola vez (D27), y que un local real deje de estar en "sin datos".
- **Qué vas a ver:** al registrar un control conectado, el campo **Adjuntar certificado (PDF)**. Ese PDF queda como versión nueva del documento, con el vencimiento del control. Las conexiones son estas:

  | Control | Documento |
  |---|---|
  | Recarga del matafuego | AGC 6, Matafuegos |
  | Limpieza de campana | AGC 16 |
  | Limpieza y análisis del tanque | AGC 18 (limpieza) y AGC 19 (análisis bacteriológico) |
  | Control de plagas | AGC 17, Fumigación |
  | Medición de puesta a tierra | AGC 13 y HyS 5 |

- **Qué incluye:**
  - **Varios equipos:** si un local tiene 6 matafuegos, el documento vence cuando vence el primero. Si los 6 se recargaron con el mismo certificado, se sube una sola vez y se usa para todos;
  - **Relevamiento**, el punto 1 de los próximos pasos: cargar la fecha actual de cada control, con su certificado si lo hay;
  - **"No aplica" y deshacer en los controles**, el punto 2 de los próximos pasos, con el mismo funcionamiento que en los documentos.
- **Listo cuando:** se registra la limpieza de campana con su PDF y el documento AGC 16 pasa a "Vigente" sin cargarlo dos veces.

### Sprint 6: checklist del local

- **Para qué:** las condiciones físicas que el inspector mira pero que no son papeles.
- **Qué vas a ver:**
  - en la ficha del local, la pestaña **Checklist**, con los 26 puntos en 4 grupos (Funcionamiento, Seguridad, Cocina y Baños);
  - el supervisor marca cada punto como **Bien**, **Mal** o **No aplica**. Si marca Mal, tiene que sacar una foto;
  - en la app del cliente, **Recordatorios**: lo que está mal, con la foto, hasta que se corrige en la revisión siguiente.
- **Qué incluye:**
  - los puntos se editan desde Más → Catálogo;
  - las fotos se achican antes de subirlas, para ocupar poco lugar;
  - el inspector no ve el checklist.
- **Listo cuando:** el supervisor marca "Botiquín de primeros auxilios" como Mal, con foto, y el cliente lo ve en Recordatorios.

### Sprint 7: Agenda y avisos al celular

- **Para qué:** que nada se venza sin que alguien se entere.
- **Qué vas a ver:**
  - la Agenda del supervisor muestra también los documentos que vencen;
  - **avisos al celular** 7 días antes, 2 días antes y el mismo día (como en Lasia), para controles y documentos. Le llegan al supervisor responsable del local y al cliente;
  - un aviso al supervisor cuando toca revisar el checklist de un local.
- **Listo cuando:** un documento que vence en 7 días hace llegar el aviso al celular del supervisor.

### Después de estos sprints (ya estaba en los próximos pasos)

- Exportar la agenda a Excel.
- Informes en PDF del local por período.
- Huella para entrar, KPIs y doble factor para el admin.

## Antes de cargar papeles reales

Los PDF tienen datos sensibles: nómina de personal, ART, seguros y aptitud médica. Antes de subir el primer papel de un cliente real:

- [ ] Cambiar la contraseña `admin01` y poner límite de intentos en el login. Ya estaba pendiente.
- [ ] **Plan de Supabase.** El plan gratis guarda alrededor de 1 GB de archivos. Una cuenta aproximada: 43 papeles × 20 locales, a 1 o 2 MB cada uno, más las versiones de cada mes, pasa ese límite en el primer año. El plan Pro cuesta unos USD 25 por mes, guarda 100 GB y evita que el proyecto se pause. Los números son aproximados y hay que confirmarlos en supabase.com.
- [ ] Decidir si se usa este proyecto de Supabase o uno aparte para producción. Ya estaba pendiente.
- [ ] **Dominio antes de imprimir tarjetas.** El QR y el chip guardan una dirección web. Si se imprimen con `scp-mantenimiento.vercel.app` y después se pasa a `scp.com.ar`, hay que reimprimirlas. Conviene tener el dominio definitivo antes de hacer las tarjetas reales.

## Preguntas para la empresa

1. **"Por vencer":** ¿30 días para todos los documentos, o distinto según el documento?
2. **Capacitaciones y plan de emergencia:** el documento dice que se comparten entre solapas. ¿En cuáles va cada uno? Por ahora, solo la puesta a tierra está en dos solapas (AGC y HyS).
3. **Limpieza de campana:** el documento dice mensual, y en la app hoy es cada 3 meses. ¿Cuál vale?
4. **Luces de emergencia:** la planilla anual (HyS 9), ¿se arma con las pruebas cada 3 meses que ya registra la app?
5. **Rubros:** ¿esto vale solo para gastronómicos? La app también tiene locales de comercio, farmacia y oficina. Propuesta: por ahora, solo los gastronómicos llevan este catálogo.
6. **Checklist:** ¿cada cuánto lo revisa el supervisor? Propuesta: una vez por mes.
7. **Tarjeta:** ¿una por local, o una por encargado? Propuesta: una por local. Si hay dos encargados, se hacen dos copias de la misma.
8. **Validar:** HyS 1 a 4 y 13 a 15, y toda la solapa de Residuos, que hay que consultar con el Ministerio de Espacio Público.

## Lista de control: cada punto del documento y su sprint

| Punto del documento | Sprint |
|---|---|
| Cuatro solapas: AGC, HyS, Autoprotección y Residuos | 1 |
| Catálogo completo: 21 + 15 + 5 + 3 documentos, con grupo, detalle y "Aplica" | 1 |
| Cada documento con local, ítem del catálogo y una o varias solapas | 1 |
| Estado calculado por fecha (Vigente, Por vencer, Vencido, Faltante) | 1 |
| "No aplica" marcado a mano por local, y los "De corresponder" que se activan por local | 1 |
| Por vencer a 30 días (a confirmar) | 1 |
| Vencimientos conocidos: campana y caldera cada mes, tanques cada 6 meses, luces cada año, el resto según certificado | 1 |
| HyS 1 a 4 y 13 a 15, y toda la solapa de Residuos, "a validar" antes de cargarlos | 1 |
| El Programa de Seguridad no aplica: en su lugar va el legajo técnico (HyS 2) | 1 |
| PDF vigente con historial de versiones anteriores | 2 |
| Fecha de emisión, y fecha de vencimiento obligatoria salvo en documentos sin vencimiento | 2 |
| Periodicidad: mensual, semestral, anual o según certificado | 1 y 2 |
| Observaciones | 2 |
| Un mismo PDF en varias solapas, cargado una sola vez (puesta a tierra, capacitaciones, plan de emergencia) | 1 y 2 |
| Autoprotección 1 acepta disposición aprobatoria o declaración jurada | 2 |
| Simulacros: periodicidad según el plan aprobado de cada local | 2 |
| Otros documentos: ítem libre | 2 |
| Solo SCP sube los PDF (D24) | 2 |
| Botón para abrir el PDF | 2 y 3 |
| Vista del cliente: todos los ítems con semáforo, vencidos y faltantes en rojo | 3 |
| Alertas de vencimiento para el cliente | 3 (en la app) y 7 (al celular) |
| Vista del inspector: solo lectura, PDF vigentes por solapa, pantalla completa con un toque, sin menús | 4 |
| Tarjeta con QR y NFC (D25) | 4 |
| Controles y documentos conectados (D27) | 5 |
| Checklist del local: 26 puntos, con foto | 6 |
| Las condiciones físicas no se le muestran al inspector | 4 y 6 |
| Checklist con aviso periódico | 6 (revisión) y 7 (aviso) |
| Lo completa el supervisor (D26) | 6 |
| Fuentes: las guías de AGC quedan anotadas como referencia en el catálogo | 1 |

## Notas técnicas (para armar cada sprint)

- **Tablas nuevas:**
  - `tipo_documento`: catálogo con nombre, grupo, detalle, `solapas solapa[]` (un enum: agc, hys, autoproteccion, residuos), aplica (siempre o de_corresponder), periodicidad (reusa `periodo_unidad`), `vence boolean`, `anticipacion_dias` (30 por defecto), orden, norma, activo y `a_validar`;
  - `documento`: un registro por local e ítem, o un ítem libre con su propio nombre y solapas. Guarda vencimiento, emisión, `no_aplica` con motivo, decisión de "De corresponder", periodicidad propia del local (para simulacros) y observaciones;
  - `documento_version`: ruta del archivo, nombre, tamaño, fechas, `subido_por`, y `registro_id` si vino de un control;
  - `tarjeta_inspeccion`: local, token aleatorio, fecha en que se anuló. Más `apertura_carpeta` para anotar cuándo se abre;
  - `punto_checklist`, `revision` y `revision_punto` (resultado y foto).
- **"Todos llevan todo":** un trigger como `app.crear_controles_local()` (`supabase/migrations/20261021000702_esquema.sql`). Al crear un ítem del catálogo, se suma a los locales que ya existen, igual que hace `guardarControl` en `src/app/s/mas/catalogo/acciones.ts`.
- **Estado:** misma regla que `estadoDe` en `src/lib/fechas.ts` (al_dia/pronto/vencido/sin_datos → Vigente/Por vencer/Vencido/Faltante). La propuesta de vencimiento reusa `sumarPeriodo` y `proponerVencimiento`.
- **Permisos (RLS):**
  - el staff lee y escribe;
  - el cliente lee con `local_id in (select app.mis_locales())`, como en `supabase/migrations/20261103120100_usuarios_de_cliente.sql`;
  - solo el admin edita el catálogo;
  - pruebas pgTAP en `supabase/tests/` (`npm run test:db`).
- **Archivos:**
  - bucket privado `documentos` (solo `application/pdf`, hasta 20 MB) y bucket privado `fotos` (JPEG achicado en el navegador);
  - políticas sobre `storage.objects` por local;
  - se abren con links firmados de pocos minutos.
- **Carpeta del inspector:**
  - ruta pública `/i/[token]`, que hay que abrir en `src/proxy.ts`. El servidor valida el token con `clienteAdmin` (`src/lib/supabase/admin.ts`) o con una función `security definer` que devuelve solo los vigentes de ese local;
  - `noindex`. El QR reusa `src/components/elementos/etiqueta-qr.tsx`;
  - token de 128 bits; anular cambia el token.
- **Conexión con controles:**
  - tabla `tipo_control_documento` (control ↔ documento, de muchos a muchos);
  - al registrar con PDF se crea la versión. El vencimiento del documento es el menor vencimiento entre los controles activos conectados de ese local.
- **Pantallas:** el catálogo sigue el patrón de `src/app/s/mas/catalogo/`. Las pestañas usan `Pestanas` (`src/components/locales/pestanas.tsx`) y el semáforo usa `MarcaEstado`/`Fila` de `src/components/ui.tsx`.
