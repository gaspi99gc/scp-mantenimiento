# Sprint 1: base de datos — plan de implementación

> **Reemplazado (D18).** El dueño decidió arrancar con un núcleo simple y sumar de a una. Queda como referencia de ideas, no como diseño vigente.

> **Para agentes:** se ejecuta con superpowers:executing-plans (lo hace la sesión principal). Pasos con casillas `- [ ]`.

**Objetivo:** crear en Supabase todas las tablas, reglas, permisos (RLS) y funciones del diseño, con tests pgTAP que prueban la seguridad y el recálculo.

**Arquitectura:** migraciones SQL versionadas en `supabase/migrations/` aplicadas con `supabase db push` al proyecto vinculado (no hay Docker local). Tests pgTAP en `supabase/tests/` corridos con `supabase test db --linked`; cada archivo abre una transacción y termina en `rollback`, así no deja datos.

**Stack:** Postgres 17 (Supabase), Supabase CLI 2.121, pgTAP.

**Spec:** [`docs/superpowers/specs/2026-10-20-base-datos-y-usuarios-design.md`](../specs/2026-10-20-base-datos-y-usuarios-design.md)

## Restricciones globales

- Nombres de tablas, columnas, enums y funciones en español, en singular, `snake_case`, tal como en el spec §2.
- Los archivos de migración se crean con `npx supabase migration new <nombre>`; nunca se inventa el nombre.
- Nada se otorga a `anon`. `authenticated` recibe solo los privilegios de §4.6 del spec, con permisos por columna donde la tabla es parcialmente editable.
- Funciones con privilegios: `security definer`, `set search_path = ''`, en el esquema `app`, con `revoke execute ... from public, anon`. Las que llama la app tienen un envoltorio `security invoker` en `public`.
- "Hoy" es siempre `app.hoy()` = fecha actual en `America/Argentina/Buenos_Aires`.
- Sumas de período con `interval` de Postgres (recorta a fin de mes: 31/08 + 6 meses = 28/02).

## Desvíos del spec decididos al planificar

- **Reemplazo de unidad:** función `reemplazar_unidad`, que retira la unidad actual, instala la nueva y recalcula los controles `depende_de_unidad` desde la **fecha de fabricación** (un cilindro nuevo trae la prueba hidráulica de fábrica). Si el supervisor tiene otra fecha, la registra después como ejecución.
- **Bloqueo de recarga:** si un control del mismo elemento que "satisface" a este (la prueba hidráulica respecto de la recarga) está vencido, `registrar_ejecucion` rechaza todo resultado que no sea `reemplazo`.
- **Edición de informes en borrador:** por permisos de columna (`resumen`, `recomendaciones`), no con un indicador de sesión.

## Review Focus

1. **Registrar dos veces el mismo control a la vez** (dos pestañas): el segundo no puede dejar dos vencimientos abiertos. Lo cubre el bloqueo de fila y el índice único (test en la tarea 4).
2. **Anular una ejecución cuyo vencimiento ya fue cumplido por otra posterior:** se rechaza con un mensaje claro (test en la tarea 4).
3. **Fecha del trabajo en el futuro o anterior a la última ejecución vigente:** futuro, rechazo; anterior, se permite (carga tardía) pero no reabre nada (test en la tarea 4).
4. **Supervisor que intenta cambiarse el rol o tocar el perfil de otro** por la API: sin privilegios de escritura en `perfil` (test en la tarea 3).
5. **Control manual (según documento) sin fecha de certificado:** rechazo con mensaje (test en la tarea 4).

---

### Tarea 1: esquema base

**Archivos:** crear `supabase/migrations/<ts>_esquema_base.sql`

- [ ] Enums: `rol_usuario`, `estado_cliente`, `rubro`, `estado_local`, `aplica_a`, `periodo_unidad`, `base_recalculo`, `ejecutor_tipo`, `estado_elemento`, `estado_control`, `estado_vencimiento`, `origen_vencimiento`, `resultado_ejecucion`, `estado_informe`, `urgencia_pedido`, `estado_pedido`, `canal_pedido`, `etapa_adjunto`, con los valores del spec §2.
- [ ] Esquema `app` y función `app.hoy()`.
- [ ] Tablas del spec §2.1 a §2.7 con sus checks, únicos, únicos parciales y un índice por cada FK del lado hijo. `app.config` con una fila (`exigir_mfa_admin = false` en este proyecto). `app.auditoria`. `app.numerador_informe (anio int primary key, ultimo int not null)`.
- [ ] `npx supabase db push` → aplica sin errores.
- [ ] Commit.

### Tarea 2: triggers de integridad

**Archivos:** crear `supabase/migrations/<ts>_triggers.sql`; test `supabase/tests/01_integridad_test.sql`

- [ ] Test (falla primero): insertar un `local` crea sus controles de local; insertar un `elemento` de tipo matafuego crea recarga, prueba hidráulica y vida útil; `control.local_id` y `ejecucion.local_id` se copian solos; `UPDATE` y `DELETE` sobre `ejecucion` son rechazados (salvo los campos de anulación); un segundo vencimiento abierto y una segunda unidad instalada son rechazados; `UPDATE` sobre un informe publicado y sobre `subsanacion` son rechazados; `subsanacion` sobre un borrador es rechazada; `informe_adjunto` de un informe publicado no se modifica; `tipo_control_elemento` con un tipo `aplica_a = 'local'` es rechazado.
- [ ] Triggers: `app.crear_controles_local`, `app.crear_controles_elemento`, `app.copiar_local_id`, `app.proteger_inmutable`, `app.proteger_informe`, `app.validar_subsanacion`, `app.validar_informe_adjunto`, `app.validar_tipo_control_elemento`, `app.sellar_autor` (pone `creado_por = auth.uid()`), y `app.auditar` en las tablas de negocio y `perfil`.
- [ ] `db push` y `npx supabase test db --linked` → pasa.
- [ ] Commit.

### Tarea 3: seguridad (RLS, privilegios, Storage)

**Archivos:** crear `supabase/migrations/<ts>_seguridad.sql`; test `supabase/tests/02_seguridad_test.sql`

- [ ] Test (falla primero):
  - toda tabla de `public` tiene RLS y `anon` no tiene ningún privilegio;
  - un staff activo lee `local`; uno desactivado o con `debe_cambiar_clave` lee 0 filas;
  - un supervisor no puede insertar en `ejecucion` ni `vencimiento`, ni actualizar `perfil`, ni insertar en `tipo_control` (0 filas o error de privilegio);
  - `app.es_admin()` es false para un admin con `aal1` cuando `exigir_mfa_admin` es true, y true con `aal2`.
- [ ] Funciones `app.es_staff()` y `app.es_admin()`; políticas y `grant` por tabla según el spec §4.6; bucket privado `adjuntos` con políticas de staff en `storage.objects`.
- [ ] `db push` + `test db --linked` → pasa. Commit.

### Tarea 4: funciones del dominio

**Archivos:** crear `supabase/migrations/<ts>_funciones.sql`; test `supabase/tests/03_vencimientos_test.sql`

**Produce** (envoltorios en `public`, llamables con `supabase.rpc`):

- `registrar_ejecucion(p_control uuid, p_fecha date, p_resultado resultado_ejecucion, p_ejecutor text, p_evidencia text[] default '{}', p_oblea text default null, p_nota text default null, p_fecha_certificado date default null, p_fecha_ajuste date default null, p_motivo_ajuste text default null) returns uuid` (id de la ejecución)
- `anular_ejecucion(p_ejecucion uuid, p_motivo text) returns void`
- `cargar_vencimiento_inicial(p_control uuid, p_fecha date, p_origen origen_vencimiento default 'relevamiento') returns uuid`
- `reemplazar_unidad(p_elemento uuid, p_serie text, p_fabricacion date, p_instalada_desde date) returns uuid` (id de la unidad nueva)
- `anular_trabajo(p_trabajo uuid, p_motivo text) returns void`
- `crear_informe(p_local uuid, p_desde date, p_hasta date) returns uuid`
- `publicar_informe(p_informe uuid) returns text` (el número)
- `registrar_pdf_informe(p_informe uuid, p_path text, p_sha256 text) returns int` (la versión)
- `subsanar_informe(p_informe uuid, p_motivo text, p_texto text) returns uuid`
- `marcar_clave_cambiada() returns void`

- [ ] Test (falla primero), con un matafuego de ejemplo creado en el test:
  - recarga mensual del 31/08/2026 + 6 meses → 28/02/2027; anual → mismo día del año siguiente;
  - `desde_vencimiento` con el vencimiento anterior en el futuro cuenta desde él; si ya pasó, cuenta desde la fecha del trabajo;
  - la prueba hidráulica deja la recarga con vencimiento nuevo (`satisface`);
  - `no_realizado` deja el vencimiento abierto;
  - certificado manda sobre ajuste y ajuste sobre calculado; ajuste sin motivo, rechazo;
  - evidencia faltante, rechazo; fecha futura, rechazo; control manual sin certificado, rechazo;
  - recarga con la prueba hidráulica vencida, rechazo salvo `reemplazo`;
  - anular reabre el vencimiento anterior; anular cuando el nuevo ya fue cumplido por otra, rechazo;
  - `reemplazar_unidad` deja una sola unidad instalada y recalcula vida útil desde la fabricación;
  - `publicar_informe` numera `SCP-<año>-000001`, congela `contenido` con las ejecuciones no anuladas del período, y un segundo `publicar` es rechazado; `registrar_pdf_informe` da versiones 1 y 2; un supervisor sin sesión válida no puede llamar ninguna.
- [ ] Implementar las funciones (lógica de recálculo del spec §3 y de `src/lib/fechas.ts`).
- [ ] `db push` + `test db --linked` → pasa. Commit.

### Tarea 5: catálogo inicial

**Archivos:** crear `supabase/migrations/<ts>_catalogo_inicial.sql`

- [ ] Los tipos de elemento y los 11 tipos de control de `src/lib/datos.ts` (`tiposControl`) con sus vínculos y `satisface`, insertados con ids fijos para que el seed del sprint 3 los referencie.
- [ ] `db push`; verificar con `npx supabase db query --linked "select count(*) from tipo_control"` → 11. Commit.
