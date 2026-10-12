# Usuarios, autenticación y permisos

> Plan para **Next.js + Supabase**. Parte de las decisiones D1, D2 y D10 de [`decisiones.md`](decisiones.md).
> Los fragmentos SQL son ilustrativos: la versión final sale del diseño de la base de datos.

## 1. Resumen en 5 respuestas

| Pregunta | Respuesta |
|---|---|
| **¿Cómo sabemos quién es?** (autenticación) | **Supabase Auth**. Sesión en cookies con `@supabase/ssr`. Supervisores y admin entran con email y contraseña (el admin, además, con código TOTP). Los clientes, en la fase 2, con un código o link por email |
| **¿Qué puede hacer?** (autorización) | Roles simples (`admin`, `supervisor`, `cliente`) más el **alcance por cliente y local** para los usuarios cliente |
| **¿Dónde se controla?** | En tres capas: (1) el middleware de Next.js redirige a quien no tiene sesión; (2) cada pantalla y Server Action vuelve a chequear; (3) **RLS en Postgres**, la barrera final. La capa 3 es la que importa: aunque las otras fallen, la base no devuelve datos ajenos |
| **¿Qué pasa si falta una regla?** | **Se niega.** RLS activado en todas las tablas sin excepción: una tabla sin política no devuelve nada |
| **¿Queda registro?** | Sí. Tabla `auditoria` con quién, qué, cuándo, valor anterior y nuevo, más los logs de Auth de Supabase |

## 2. Roles

| Rol | Fase | Qué ve | Qué puede hacer |
|---|---|---|---|
| `admin` | 0 | Todo | Todo lo del supervisor, más usuarios, catálogos y periodicidades, anulaciones y auditoría |
| `supervisor` | 0 | **Todos los locales** (equipo chico, ver D10) | Clientes, locales, elementos, controles, visitas, ejecuciones, informes (publicar y subsanar), pedidos |
| `cliente` | 2 | Solo los locales de su `membresia` y **solo lo marcado como visible para el cliente** (que es casi todo, incluso lo vencido: D9) | Ver, crear pedidos y, como `admin_cliente`, invitar encargados de su empresa |

**El rol se lee de la tabla `perfil` en cada consulta**, no de un dato guardado en el token. Si el admin desactiva a alguien o le cambia el rol, el cambio rige en la consulta siguiente, sin esperar a que venza la sesión.

## 3. Autenticación (quién es)

### 3.1 Configuración de Supabase Auth

- **Registro público desactivado** ("Allow new users to sign up": off). Nadie se crea una cuenta solo: **todos los usuarios entran por invitación**.
- **SMTP propio con Resend.** El correo que trae Supabase por defecto tiene un límite muy bajo y es solo para pruebas.
- **URLs de redirección permitidas:** solo el dominio de producción, `localhost` y el patrón de los previews del propio proyecto en Vercel. Nada con comodines amplios.
- **Rotación de refresh tokens** con detección de reuso (viene activada): si alguien roba un refresh token y lo usa, se invalida la sesión.
- **MFA TOTP** (Google Authenticator o similar) **obligatorio para `admin`**.
- **Plantillas de email en español** (invitación, recuperar contraseña, código de acceso).

### 3.2 Flujos

| Flujo | Cómo funciona |
|---|---|
| **Alta de supervisor** | El admin, en *Usuarios → Invitar*, carga nombre, email y rol. Una Server Action (solo admin) llama a `auth.admin.inviteUserByEmail` con la clave de servicio y crea la fila en `perfil`. Le llega un email, define su contraseña y entra |
| **Login del supervisor** | Email y contraseña. La sesión dura mientras se use (el refresh token la renueva), así el supervisor no tiene que loguearse cada vez que abre la app en el celular |
| **Login del admin** | Email, contraseña y código TOTP. Las acciones de admin exigen el nivel `aal2` (sesión con segundo factor) |
| **Olvidé mi contraseña** | Flujo estándar de Supabase. La respuesta es siempre la misma ("si el email existe, te mandamos un link"), para no revelar qué emails tienen cuenta |
| **Baja de un usuario** | El admin lo **desactiva**: `perfil.activo = false` (la base deja de devolverle datos **de inmediato**), bloqueo en Supabase Auth (no puede renovar la sesión) y cierre de todas sus sesiones. No se borra: su historial y su firma en los informes quedan |
| **Cliente (fase 2)** | El supervisor o el `admin_cliente` lo invita. Para entrar usa un **código de 6 dígitos por email** (OTP). Funciona mejor que el link mágico en el celular, porque el link a veces se abre en otro navegador y no en la app instalada |

### 3.3 Integración con Next.js

```
app/
  (publico)/login/            ← email + contraseña (y TOTP si es admin)
  (publico)/auth/confirm/     ← recibe invitaciones y recuperos (route handler)
  (supervisor)/s/...          ← layout que exige rol admin o supervisor
  (cliente)/c/...             ← fase 2; layout que exige rol cliente
  api/cron/diario/route.ts    ← protegido con CRON_SECRET, no con sesión
lib/supabase/
  server.ts   ← cliente para Server Components y Server Actions (cookies)
  browser.ts  ← cliente para componentes del navegador (subida de fotos)
  admin.ts    ← usa SUPABASE_SERVICE_ROLE_KEY; empieza con import 'server-only'
middleware.ts (proxy.ts en Next 16) ← renueva la sesión y redirige a /login
```

**Reglas:**

1. **En el servidor nunca se confía en `getSession()`.** Para saber quién llama se usa `getClaims()` o `getUser()`, que verifican el token.
2. **El middleware es solo comodidad** (redirigir a `/login`). Cada layout protegido y cada Server Action vuelve a verificar el usuario. Y aunque una verificación falte, RLS sigue filtrando.
3. **La clave `service_role` saltea RLS.** Solo va en `lib/supabase/admin.ts`, solo se usa para invitar o desactivar usuarios y en el cron, y **nunca** con prefijo `NEXT_PUBLIC_`. Si se filtra, hay que rotarla en el momento.
4. **Server Actions:** Next.js ya controla el origen de la petición (protección contra CSRF). Los datos que llegan se validan con **Zod** y nunca se acepta del formulario un `rol`, un `cliente_id` de otro cliente ni un `creado_por`: esos datos salen de la sesión.
5. **Variables de entorno en Vercel:** `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o la nueva *publishable key*) son públicas por diseño, y la seguridad la pone RLS. `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` y `RESEND_API_KEY` son solo del servidor.

## 4. Autorización en la base (RLS)

### 4.1 Tablas de usuarios

```sql
create type rol_usuario as enum ('admin', 'supervisor', 'cliente');

create table public.perfil (
  id         uuid primary key references auth.users (id) on delete restrict,
  nombre     text not null,
  rol        rol_usuario not null,
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

-- Fase 2: a qué cliente y locales accede cada usuario cliente
create table public.membresia (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references public.perfil (id),
  cliente_id  uuid not null references public.cliente (id),
  local_id    uuid references public.local (id),          -- null = todos los locales del cliente
  rol_cliente text not null check (rol_cliente in ('admin_cliente', 'encargado')),
  unique nulls not distinct (usuario_id, cliente_id, local_id)
);
```

> ⚠️ **El rol nunca sale de `user_metadata`.** El propio usuario puede editar ese campo desde el navegador. El rol vive solo en `perfil`, y a esa tabla solo escribe el admin.

### 4.2 Funciones de ayuda

Viven en un esquema `app`, que no se publica en la API, y se usan dentro de las políticas:

```sql
create schema if not exists app;

create function app.es_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and rol in ('admin', 'supervisor')
  );
$$;

create function app.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and rol = 'admin'
  ) and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';   -- exige el segundo factor
$$;

-- Fase 2
create function app.cliente_ve_local(p_local_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.membresia m
    join public.perfil p on p.id = m.usuario_id and p.activo
    join public.local  l on l.cliente_id = m.cliente_id
    where m.usuario_id = auth.uid()
      and l.id = p_local_id
      and (m.local_id is null or m.local_id = l.id)
  );
$$;

grant usage on schema app to authenticated;
grant execute on all functions in schema app to authenticated;
```

### 4.3 Políticas por tipo de tabla

| Tipo de tabla | Ejemplos | Leer | Escribir |
|---|---|---|---|
| Usuarios | `perfil` | El propio usuario ve su fila; el staff ve todas | Solo admin |
| Catálogos | `tipo_elemento`, `tipo_control`, `plantilla_rubro` | Todo usuario logueado | Solo admin |
| Operativas | `cliente`, `local`, `elemento`, `unidad`, `control`, `visita`, `trabajo`, `pedido`, `adjunto` | Staff: todo. Cliente: lo de sus locales, si es visible | Staff (el cliente, en fase 2, solo crea `pedido`) |
| **Críticas** | `vencimiento`, `ejecucion`, `informe`, `subsanacion` | Igual que las operativas | **Nadie directo.** Solo a través de funciones (§4.4) |
| Internas | `nota_interna`, costos, `auditoria` | Solo staff (`auditoria`, solo admin) | Solo staff o triggers |

Ejemplo:

```sql
alter table public.local enable row level security;

create policy local_leer on public.local for select to authenticated
  using ( (select app.es_staff()) or app.cliente_ve_local(id) );

create policy local_escribir on public.local for all to authenticated
  using ( (select app.es_staff()) )
  with check ( (select app.es_staff()) );
```

> `(select app.es_staff())` entre paréntesis hace que Postgres lo evalúe **una vez por consulta** y no una vez por fila. Es la recomendación de Supabase para que RLS no se vuelva lento.

**Datos internos:** en lugar de ocultar columnas sueltas (RLS trabaja por fila, no por columna), lo interno va en **tablas aparte** (`nota_interna`, costos), que el cliente directamente no puede leer.

### 4.4 Escrituras críticas: funciones en Postgres

El recálculo de vencimientos y la publicación de informes no se hacen con `insert` o `update` sueltos desde Next.js. Son **funciones de Postgres** que se llaman con `supabase.rpc(...)` y corren **en una transacción**:

| Función | Qué hace |
|---|---|
| `registrar_ejecucion(...)` | Verifica permisos y evidencia, bloquea el control, cierra el vencimiento abierto, crea el nuevo, aplica `satisface_a` y audita (ver §3.3 de la propuesta) |
| `anular_ejecucion(id, motivo)` | Reabre el vencimiento anterior y anula el generado |
| `publicar_informe(id)` | Numera, congela y registra el hash |
| `subsanar_informe(id, motivo, texto)` | Agrega la subsanación; el informe original no se toca |

Cada una:

- empieza con `if not app.es_staff() then raise exception 'no autorizado' using errcode = '42501'; end if;`
- es `security definer` con `set search_path = ''`;
- tiene `revoke execute ... from public, anon` y `grant execute ... to authenticated`. **Ojo:** Postgres le da permiso de ejecución a todo el mundo por defecto, así que el `revoke` es obligatorio.

**Inmutabilidad:** además, un trigger rechaza cualquier `UPDATE` o `DELETE` sobre `ejecucion` (salvo los campos de anulación), sobre `informe` publicado y sobre `subsanacion`. Ni siquiera un bug en una función puede reescribir la historia.

### 4.5 Archivos (Supabase Storage)

- **Bucket privado** `adjuntos`, con ruta `{local_id}/{tipo}/{uuid}.jpg`.
- **Subida:** el servidor genera una URL firmada de subida (`createSignedUploadUrl`) después de verificar que es staff. El celular sube directo a esa URL, sin pasar la foto por Vercel.
- **Lectura:** siempre con **URL firmada de corta duración** (unos 10 minutos), generada en el servidor después del chequeo. Nunca URLs públicas.
- **Políticas sobre `storage.objects`:** el staff lee y escribe en el bucket; el cliente (fase 2) solo lee los archivos de sus locales marcados `visible_cliente`.

### 4.6 QR de los elementos

- El QR apunta a `https://<dominio>/e/{qr_token}`. El `qr_token` es aleatorio (no es el ID ni un número correlativo), así que no se puede adivinar el de otro elemento.
- Abrirlo **pide login** y RLS se sigue aplicando. Por ahora no hay página pública sin login.

## 5. Auditoría

- **Trigger genérico** en las tablas importantes que guarda en `auditoria`: `auth.uid()`, tabla, operación, fila anterior y nueva (JSONB), fecha y hora.
- Las funciones críticas registran además el evento de negocio ("ejecución registrada", "informe publicado", "fecha ajustada a mano: motivo …").
- Los logins, fallos de login e invitaciones quedan en los logs de Auth de Supabase.

## 6. Tests que no pueden faltar

Con `supabase test db` (pgTAP), simulando cada tipo de usuario:

1. Sin sesión (`anon`): **no lee ninguna tabla**.
2. Supervisor desactivado: no lee nada, aunque su token siga vigente.
3. Supervisor: no puede hacer `update` directo sobre `vencimiento`, `ejecucion` ni sobre un `informe` publicado.
4. Supervisor: no puede ejecutar funciones de admin; admin sin segundo factor (`aal1`): tampoco.
5. *(Fase 2)* Cliente A: no ve ni un local, elemento, informe ni archivo del cliente B, aunque pida su ID directo.
6. *(Fase 2)* Encargado con un solo local: no ve los otros locales de su misma empresa.
7. Toda tabla del esquema `public` tiene RLS activado (un test que recorre el catálogo de Postgres y falla si alguna no lo tiene).

## 7. Checklist antes de salir a producción

- [ ] Registro público desactivado.
- [ ] RLS activo en **todas** las tablas (test 7 en verde).
- [ ] `service_role` solo en el servidor; búsqueda en el bundle del navegador sin resultados.
- [ ] MFA activado para todos los admin.
- [ ] SMTP propio configurado, con SPF, DKIM y DMARC en el dominio.
- [ ] URLs de redirección limitadas al dominio propio.
- [ ] Bucket `adjuntos` privado.
- [ ] Funciones críticas con `revoke ... from public, anon`.
- [ ] Ruta del cron rechaza peticiones sin `CRON_SECRET`.
- [ ] Backup nocturno funcionando y **una restauración de prueba hecha**.
