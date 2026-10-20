# Base de datos, usuarios y seguridad

> Diseño aprobado en la conversación del 20/10/2026. Reemplaza, donde se contradigan, a §3, §4 y §11 de [`propuesta-final.md`](../../propuesta-final.md) y a [`autenticacion.md`](../../autenticacion.md). Las decisiones están en [`decisiones.md`](../../decisiones.md) (D12 a D17).

## 1. Qué cambia y por qué

El dueño definió cómo trabaja SCP en la realidad:

- **No hay visitas.** El supervisor va al local, hace el trabajo y lo registra en ese momento, suelto, en la ficha del equipo o del local (D12).
- **El informe es del local en un período que elige el supervisor** (desde y hasta). Puede haber varios informes que cubran los mismos días (D13).
- **Publicar** congela el informe, le da número y genera un **PDF** que el supervisor descarga o comparte. Cuando exista la app del cliente, los publicados aparecen también ahí (D14).
- **Todos los locales llevan todo:** al dar de alta un elemento o un local se crean todos los controles que aplican; lo que no aplica se marca "no aplica" con motivo (D15).
- **Usuarios por ahora: solo SCP** (admin y supervisores). La base queda preparada para usuarios de cliente sin rehacer nada (D16).
- **Esta primera versión de la base incluye solo lo que usan las pantallas.** Abono, obras, hallazgos, proveedores, notificaciones y membresías de cliente quedan afuera (D17).

## 2. Modelo de datos

Convenciones para todas las tablas:

- Esquema `public`, nombres en español y en singular.
- `id uuid primary key default gen_random_uuid()`.
- `creado_en timestamptz not null default now()` y `creado_por uuid references perfil(id)` en las tablas de negocio.
- Fechas sin hora como `date` (horario de Buenos Aires); momentos como `timestamptz`.
- Estados y conjuntos fijos como **enums de Postgres**.
- **Nada se borra físicamente** en los datos de negocio: se anula o se cambia de estado, con motivo.
- Toda clave foránea tiene `on delete restrict` (salvo donde se indica) y **un índice del lado hijo**.

### 2.1 Usuarios

**`perfil`**: un usuario de la app. Su `id` es el de `auth.users`.

| Columna | Tipo | Regla |
|---|---|---|
| `id` | uuid | PK, FK a `auth.users(id)` |
| `nombre` | text | not null |
| `email` | text | not null, único (copia de `auth.users` para listar sin la clave de servicio) |
| `rol` | enum `rol_usuario` (`admin`, `supervisor`) | not null |
| `activo` | boolean | not null, default true |
| `debe_cambiar_clave` | boolean | not null, default true |

**`config`** (esquema `app`, una sola fila): `exigir_mfa_admin boolean not null`. `true` en producción, `false` en el proyecto de desarrollo.

### 2.2 Clientes y locales

**`cliente`**: `nombre`, `razon_social`, `cuit` (único; check de 11 dígitos), `estado` (`activo`, `baja`).

**`local`**: `cliente_id`, `nombre`, `direccion`, `barrio`, `rubro` (enum: `gastronomico`, `retail`, `farmacia`, `oficina`, `otro`), `horario_acceso`, `requisitos_acceso` (nullable), `encargado_nombre`, `encargado_telefono`, `supervisor_id` (nullable, FK a `perfil`), `estado` (`activo`, `cerrado_temporal`, `baja`). Índice (`cliente_id`, `estado`).

### 2.3 Catálogo (solo lo edita el admin)

**`tipo_elemento`**: `nombre` (único), `usa_unidad` (lleva número de serie que puede cambiar), `activo`.

**`tipo_control`**: la regla de un control.

| Columna | Regla |
|---|---|
| `nombre`, `verbo` ("Registrar recarga"), `texto_hecho` ("Recarga registrada") | not null |
| `aplica_a` | enum (`elemento`, `local`) |
| `periodo_unidad` | enum (`dia`, `mes`, `anio`, `manual`) |
| `periodo_valor` | int. Check: null si es `manual`, mayor que 0 si no |
| `base` | enum (`desde_ejecucion`, `desde_vencimiento`) |
| `anticipacion_dias` | int ≥ 0 |
| `evidencia` | `text[]` not null default `{}` (lo que hay que cargar para confirmar) |
| `ejecutor` | enum (`scp`, `tercero`) |
| `norma` | text nullable |
| `depende_de_unidad` | boolean (se recalcula al cambiar el equipo físico) |
| `activo` | boolean |

**`tipo_control_elemento`** (`tipo_control_id`, `tipo_elemento_id`): a qué tipos de elemento se aplica. PK compuesta. Un trigger exige que el tipo de control sea `aplica_a = 'elemento'`.

**`tipo_control_satisface`** (`tipo_control_id`, `satisface_id`): hacer uno cumple el otro (la prueba hidráulica cumple la recarga). PK compuesta; check de que son distintos.

### 2.4 Inventario

**`elemento`**: `local_id`, `tipo_elemento_id`, `codigo`, `ubicacion`, `qr_token` (único, aleatorio de 16 caracteres; nunca el id), `estado` (`activo`, `en_servicio_externo`, `baja`). Único (`local_id`, `codigo`).

**`unidad`**: `elemento_id`, `serie`, `fabricacion` (date), `instalada_desde` (date), `retirada_en` (date, nullable). Índice único parcial (`elemento_id`) `where retirada_en is null`: **una sola unidad instalada por elemento**. Check `retirada_en >= instalada_desde`.

### 2.5 Controles, vencimientos y registros

**`control`**: el plan de un tipo de control en un elemento o en el local.

| Columna | Regla |
|---|---|
| `local_id` | not null (también en los controles de un elemento, para filtrar y para los permisos) |
| `elemento_id` | nullable. Trigger: si está, el elemento es de ese mismo local |
| `tipo_control_id` | not null |
| `estado` | enum (`activo`, `suspendido`, `no_aplica`) |
| `motivo_estado` | not null cuando el estado no es `activo` (check) |

Únicos parciales: (`elemento_id`, `tipo_control_id`) donde hay elemento; (`local_id`, `tipo_control_id`) donde no hay elemento.

**Todos llevan todo (D15):** un trigger al insertar un `elemento` crea un `control` por cada `tipo_control` activo vinculado a su tipo; otro al insertar un `local` crea uno por cada `tipo_control` activo con `aplica_a = 'local'`. Los controles nuevos no tienen vencimiento abierto: quedan **sin datos**, que cuenta como rojo, hasta que se cargue la primera fecha.

**`vencimiento`**: la cadena de fechas de un control. Es el historial.

| Columna | Regla |
|---|---|
| `control_id`, `fecha` | not null |
| `estado` | enum (`abierto`, `cumplido`, `anulado`) |
| `origen` | enum (`relevamiento`, `calculado`, `certificado`, `ajuste_manual`) |
| `motivo` | not null si el origen es `ajuste_manual` |
| `generado_por`, `cumplido_por` | FK a `ejecucion`, nullable |

Índice único parcial (`control_id`) `where estado = 'abierto'`: **un solo vencimiento abierto por control**. Índice (`estado`, `fecha`) para Hoy y Agenda.

**`ejecucion`**: cada vez que se hizo un control. **Inmutable.**

| Columna | Regla |
|---|---|
| `control_id`, `local_id` | not null (`local_id` se copia del control por trigger) |
| `fecha` | date, la del trabajo, no la de carga. Check: no posterior a hoy |
| `resultado` | enum (`ok`, `reemplazo`, `observado`, `no_apto`, `no_realizado`) |
| `oblea`, `nota` | text nullable |
| `ejecutor` | text not null ("SCP" o el nombre del tercero) |
| `unidad_id` | nullable (la unidad presente al registrar) |
| `anulada_en`, `anulada_por`, `motivo_anulacion` | nullables. Check: los tres juntos o ninguno |

Trigger: rechaza todo `UPDATE` que toque algo que no sean los campos de anulación, y todo `DELETE`.

**`trabajo`**: lo que se hizo en el local fuera de los controles ("cambié 3 tubos LED"). `local_id`, `fecha` (no posterior a hoy), `descripcion`, `materiales` (nullable), `horas` (`numeric(5,2)`, nullable, > 0). Se anula igual que una ejecución.

### 2.6 Informes

**`informe`**:

| Columna | Regla |
|---|---|
| `local_id`, `desde`, `hasta` | not null; check `hasta >= desde`. **Puede haber varios informes que cubran los mismos días** |
| `estado` | enum (`borrador`, `publicado`) |
| `resumen` | text |
| `recomendaciones` | `text[]` |
| `numero` | text, único, nullable. Lo asigna `publicar_informe` (`SCP-2026-000123`, correlativo por año) |
| `contenido` | jsonb, nullable. **La foto congelada** del informe al publicar: los registros, trabajos y fotos tal como estaban. Es el único jsonb del modelo y se justifica porque es un documento cerrado, no datos para consultar |
| `publicado_en`, `publicado_por` | nullables |

Checks: si está publicado, `numero`, `contenido`, `publicado_en` y `publicado_por` no son null. Trigger: una vez publicado rechaza todo `UPDATE` y `DELETE`.

**`informe_adjunto`** (`informe_id`, `adjunto_id`, `epigrafe`, `orden`): qué fotos van en el informe y con qué texto. Solo se modifica mientras el informe es borrador (trigger).

**`informe_pdf`**: cada PDF generado. `informe_id`, `version` (1, 2, … único por informe), `storage_path`, `sha256`, `generado_en`. Solo se insertan filas. La versión 1 se genera al publicar y cada subsanación genera la siguiente.

**`subsanacion`**: `informe_id` (trigger: el informe tiene que estar publicado), `motivo`, `texto`. Solo se insertan filas.

### 2.7 Pedidos, fotos y auditoría

**`pedido`**: `local_id`, `titulo`, `detalle`, `urgencia` (`emergencia`, `urgente`, `normal`), `estado` (`nuevo`, `aceptado`, `programado`, `resuelto`), `canal` (`portal`, `whatsapp`, `telefono`), `sla_vence_en` (timestamptz), `resuelto_en` (nullable).

**`adjunto`**: una foto o un PDF en Storage. `local_id`, `storage_path` (único), `tipo_mime`, `sha256`, `etapa` (`antes`, `despues`, `certificado`, `tarjeta`), `visible_cliente` (default true). Dueño: `ejecucion_id`, `trabajo_id`, `elemento_id`, `pedido_id` o `subsanacion_id`, con check `num_nonnulls(...) = 1`.

**`auditoria`** (esquema `app`): `id bigint identity`, `usuario_id`, `tabla`, `operacion`, `fila_id`, `antes jsonb`, `despues jsonb`, `en timestamptz`. La llena un trigger genérico en las tablas de negocio y de usuarios. Solo la lee el admin.

## 3. Escrituras críticas: funciones de Postgres

Viven en el esquema `app` (no expuesto en la API) con un envoltorio en `public` solo para las que se llaman desde la app. Todas son `security definer`, con `set search_path = ''`, empiezan verificando el rol y tienen `revoke execute ... from public, anon`.

| Función | Qué hace, en una transacción |
|---|---|
| `registrar_ejecucion(control, fecha, resultado, evidencia, oblea, ejecutor, nota, fecha_certificado?, ajuste?)` | Bloquea el control, valida la evidencia exigida, cierra el vencimiento abierto, crea el nuevo según la regla de §3.3 de la propuesta (certificado > ajuste manual con motivo > calculado), aplica `satisface_a` y, si hubo reemplazo de unidad, recalcula los controles `depende_de_unidad`. Con `no_apto` o `no_realizado` el vencimiento sigue abierto |
| `anular_ejecucion(id, motivo)` | Marca la ejecución anulada, anula el vencimiento que había generado y reabre el anterior |
| `cargar_vencimiento_inicial(control, fecha, origen)` | La primera fecha de un control "sin datos" (relevamiento) |
| `crear_informe(local, desde, hasta)` | Crea el borrador |
| `publicar_informe(id)` | Asigna el número, arma y congela `contenido` y pasa a publicado |
| `registrar_pdf_informe(id, path, sha256)` | Agrega la siguiente versión de `informe_pdf` |
| `subsanar_informe(id, motivo, texto)` | Agrega la subsanación |
| `marcar_clave_cambiada()` | Pone `debe_cambiar_clave = false` en el propio perfil |

Las tablas `vencimiento`, `ejecucion`, `informe` (al publicar), `informe_pdf` y `subsanacion` **no se escriben directo** desde la app: solo con estas funciones.

**PDF:** después de `publicar_informe`, el servidor de Next.js genera el PDF con el número ya asignado, lo sube al bucket privado y llama a `registrar_pdf_informe`. Si la generación falla, el informe queda publicado sin PDF y la pantalla ofrece "Generar PDF" de nuevo; nunca se publica dos veces.

## 4. Usuarios y autenticación

### 4.1 Supabase Auth

- Email y contraseña. **Registro público desactivado:** solo existen los usuarios que crea el admin.
- Contraseña de al menos 10 caracteres, con letras y números.
- Sesión en cookies con `@supabase/ssr`. En el servidor, la identidad se verifica siempre con `getClaims()` o `getUser()`, nunca con `getSession()`.
- **Admin con doble factor (TOTP)** cuando `app.config.exigir_mfa_admin` es true (producción). El admin lo activa en *Más → Mi cuenta* la primera vez; hasta entonces solo puede entrar a esa pantalla.

### 4.2 Alta y gestión de usuarios (*Más → Usuarios*, solo admin)

| Acción | Cómo |
|---|---|
| **Crear** | Nombre, email, rol y contraseña provisoria. Una Server Action verifica que quien llama es admin y usa la clave secreta de Supabase (`SUPABASE_SECRET_KEY`, solo en el servidor) para crear el usuario en Auth con el email ya confirmado, y su `perfil` con `debe_cambiar_clave = true` |
| **Primer ingreso** | Con `debe_cambiar_clave = true`, el usuario solo puede entrar a "Elegí tu contraseña". La base tampoco le devuelve datos hasta que la cambie |
| **Resetear contraseña** | El admin pone una provisoria nueva; vuelve `debe_cambiar_clave = true` y se cierran sus sesiones |
| **Cambiar rol** | Solo admin. No puede quitarse a sí mismo el rol de admin si es el único activo |
| **Desactivar / reactivar** | `activo = false`, bloqueo en Auth y cierre de sesiones. La base deja de devolverle datos en la consulta siguiente. No se borra: su historial queda |

Más adelante, con un servicio de mails propio (Resend), el alta pasa a ser por invitación por email y se agrega "Olvidé mi contraseña".

### 4.3 Primer admin

Un script `npm run crear-admin` (usa la clave secreta del `.env.local`) crea el usuario admin del dueño en el proyecto. Se corre una vez por proyecto de Supabase.

### 4.4 Ingreso rápido de admin en desarrollo

- El login muestra el botón **"Entrar como admin (solo en esta compu)"** únicamente si `process.env.NODE_ENV === "development"` y existen `DEV_ADMIN_EMAIL` y `DEV_ADMIN_PASSWORD` en el `.env.local`.
- Lo atiende una Server Action que **vuelve a verificar** esas dos condiciones y, si no se cumplen, responde 404. Las credenciales nunca llegan al navegador.
- En Vercel `NODE_ENV` es `production` y esas variables no existen: el botón no se muestra y la acción no funciona.
- En el proyecto de desarrollo `exigir_mfa_admin` es false, así que entra directo.

### 4.5 Las tres capas

1. **`proxy.ts`** (el middleware de Next 16) renueva la sesión y manda al login a quien no la tiene. Es solo comodidad.
2. **Cada layout protegido y cada Server Action** vuelve a verificar usuario, rol, `activo` y `debe_cambiar_clave`. Los datos que llegan se validan con Zod; el rol y el autor salen siempre de la sesión, nunca del formulario.
3. **RLS en todas las tablas**, la barrera final. Sin política, no se devuelve nada.

### 4.6 Permisos en la base (RLS)

Funciones de ayuda en el esquema `app` (`stable`, `security definer`, `search_path = ''`):

- `app.es_staff()`: perfil activo, sin `debe_cambiar_clave`, rol admin o supervisor.
- `app.es_admin()`: lo mismo con rol admin y, si `exigir_mfa_admin`, sesión `aal2`.

En las políticas se llaman como `(select app.es_staff())` para que se evalúen una vez por consulta.

| Tablas | Leer | Escribir |
|---|---|---|
| `perfil` | El propio usuario su fila; el staff todas | Solo admin (por Server Action) |
| Catálogo | Staff | Solo admin |
| `cliente`, `local`, `elemento`, `unidad`, `control`, `trabajo`, `pedido`, `adjunto`, `informe` (borrador), `informe_adjunto` | Staff | Staff |
| `vencimiento`, `ejecucion`, `informe_pdf`, `subsanacion` | Staff | **Nadie directo:** solo las funciones de §3 |
| `app.auditoria`, `app.config` | Solo admin | Solo triggers |

**Usuarios de cliente (después):** se agrega `membresia` y la función `app.cliente_ve_local(local_id)`, y cada política de lectura suma `or app.cliente_ve_local(local_id)`. Por eso las tablas operativas llevan `local_id` aunque se pueda deducir: cada fila sabe de qué local es.

### 4.7 Archivos

Bucket privado `adjuntos`, rutas `{local_id}/{tipo}/{uuid}.{ext}`. Subida con URL firmada que genera el servidor después de verificar el rol. Lectura con URL firmada de 10 minutos. Políticas sobre `storage.objects`: solo staff.

### 4.8 Variables de entorno

| Variable | Dónde | Pública |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` y Vercel | Sí |
| `SUPABASE_SECRET_KEY` | `.env.local` y Vercel. **La carga el dueño, no se pega en el chat** | No. Solo en `lib/supabase/admin.ts`, que importa `server-only` |
| `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD` | Solo `.env.local` | No |

## 5. Pantallas que cambian

- **Se van:** Armar visita (`/s/visitas/nueva`), Modo visita (`/s/visitas/[id]`), la tarjeta "visita en curso" de Hoy y la marca "Visita el …" en las filas.
- **Nuevas:** Login real (`/login`), Elegí tu contraseña, *Más → Usuarios*, *Más → Mi cuenta* (doble factor del admin), Nuevo informe (local, desde y hasta), Registrar trabajo (en la ficha de local), y la lista de informes del local.
- **Cambian:** Informe (borrador con las fechas elegidas; publicar genera el PDF; botón Descargar y Compartir). Hoy y Agenda leen de la base.

## 6. Cómo se verifica

- **Tests de la base con pgTAP** (`supabase test db`):
  1. Sin sesión (`anon`) no se lee ninguna tabla.
  2. Usuario desactivado o con `debe_cambiar_clave` no lee nada, aunque su token siga vigente.
  3. Supervisor no puede escribir directo en `vencimiento`, `ejecucion`, `informe_pdf`, `subsanacion` ni en un informe publicado, ni tocar el catálogo, `perfil` o la auditoría.
  4. Admin sin segundo factor no pasa `es_admin()` cuando `exigir_mfa_admin` es true.
  5. Toda tabla de `public` tiene RLS activado (recorre el catálogo de Postgres).
  6. Recálculo: fin de mes, 29/02, `desde_vencimiento` vencido, `satisface_a`, anulación, certificado y ajuste manual.
  7. Restricciones: segundo vencimiento abierto, segunda unidad instalada y `UPDATE` sobre una ejecución son rechazados.
- **Revisión de seguridad** por un agente separado sobre la base, las Server Actions y el ingreso rápido.
- **Playwright** en computadora y celular: login, ingreso rápido, crear un supervisor, primer ingreso con cambio de contraseña, desactivarlo y comprobar que queda afuera, registrar un control, armar y publicar un informe y descargar su PDF.

## 7. Fuera de este diseño

Usuarios de cliente y sus pantallas, invitación y recupero por email, abono, obras, hallazgos, proveedores, avisos automáticos, importación desde Excel y edición del catálogo desde la app (bloque 4 de [`proximos-pasos.md`](../../proximos-pasos.md)).
