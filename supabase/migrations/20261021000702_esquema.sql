-- Esquema base de SCP Mantenimiento (núcleo simple, D18).
-- Tablas: perfil, cliente, local, catálogo (tipo_equipo, tipo_control, tipo_control_equipo),
-- equipo, unidad, control, registro y pedido.

create schema if not exists app;

-- "Hoy" es siempre la fecha de Buenos Aires.
create function app.hoy() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date;
$$;

-- ——— Tipos ———

create type public.rol_usuario as enum ('admin', 'supervisor');
create type public.rubro as enum ('gastronomico', 'retail', 'farmacia', 'oficina', 'otro');
create type public.periodo_unidad as enum ('dia', 'mes', 'anio', 'manual');
create type public.base_recalculo as enum ('desde_ejecucion', 'desde_vencimiento');
create type public.ejecutor_tipo as enum ('scp', 'tercero');
create type public.estado_equipo as enum ('activo', 'en_servicio_externo', 'baja');
create type public.estado_control as enum ('activo', 'no_aplica');
create type public.resultado_registro as enum ('ok', 'reemplazo', 'observado', 'no_apto', 'no_realizado');
create type public.origen_registro as enum ('calculado', 'certificado', 'relevamiento');
create type public.urgencia_pedido as enum ('emergencia', 'urgente', 'normal');
create type public.estado_pedido as enum ('nuevo', 'aceptado', 'programado', 'resuelto');
create type public.canal_pedido as enum ('portal', 'whatsapp', 'telefono');

-- ——— Usuarios ———

create table public.perfil (
  id                  uuid primary key references auth.users (id) on delete restrict,
  nombre              text not null check (length(trim(nombre)) > 0),
  email               text not null unique,
  rol                 public.rol_usuario not null,
  activo              boolean not null default true,
  debe_cambiar_clave  boolean not null default true,
  creado_en           timestamptz not null default now()
);

-- ——— Clientes y locales ———

create table public.cliente (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null check (length(trim(nombre)) > 0),
  razon_social  text not null,
  cuit          text not null unique check (cuit ~ '^\d{2}-\d{8}-\d$'),
  creado_en     timestamptz not null default now(),
  creado_por    uuid references public.perfil (id) on delete restrict
);
create index on public.cliente (creado_por);

create table public.local (
  id                  uuid primary key default gen_random_uuid(),
  cliente_id          uuid not null references public.cliente (id) on delete restrict,
  nombre              text not null check (length(trim(nombre)) > 0),
  direccion           text not null,
  barrio              text not null,
  rubro               public.rubro not null,
  horario_acceso      text not null default '',
  requisitos_acceso   text,
  encargado_nombre    text not null default '',
  encargado_telefono  text not null default '',
  supervisor_id       uuid references public.perfil (id) on delete restrict,
  creado_en           timestamptz not null default now(),
  creado_por          uuid references public.perfil (id) on delete restrict
);
create index on public.local (cliente_id);
create index on public.local (supervisor_id);
create index on public.local (creado_por);

-- ——— Catálogo ———

create table public.tipo_equipo (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  usa_unidad  boolean not null default false,  -- lleva número de serie que puede cambiar (cilindro)
  activo      boolean not null default true
);

create table public.tipo_control (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null,
  aplica_al_local    boolean not null default false,  -- true: control de todo el local (plagas, puesta a tierra)
  periodo_valor      int,
  periodo_unidad     public.periodo_unidad not null,
  base               public.base_recalculo not null default 'desde_ejecucion',
  anticipacion_dias  int not null default 0 check (anticipacion_dias >= 0),
  ejecutor           public.ejecutor_tipo not null default 'scp',
  norma              text,
  evidencia          text[] not null default '{}',
  verbo              text not null,   -- "Registrar recarga"
  texto_hecho        text not null,   -- "Recarga registrada"
  depende_de_unidad  boolean not null default false,  -- se recalcula al cambiar el cilindro
  activo             boolean not null default true,
  check (
    (periodo_unidad = 'manual' and periodo_valor is null)
    or (periodo_unidad <> 'manual' and periodo_valor > 0)
  )
);

create table public.tipo_control_equipo (
  tipo_control_id  uuid not null references public.tipo_control (id) on delete cascade,
  tipo_equipo_id   uuid not null references public.tipo_equipo (id) on delete cascade,
  primary key (tipo_control_id, tipo_equipo_id)
);
create index on public.tipo_control_equipo (tipo_equipo_id);

-- ——— Equipos ———

create table public.equipo (
  id              uuid primary key default gen_random_uuid(),
  local_id        uuid not null references public.local (id) on delete restrict,
  tipo_equipo_id  uuid not null references public.tipo_equipo (id) on delete restrict,
  codigo          text not null check (length(trim(codigo)) > 0),
  ubicacion       text not null default '',
  detalle         text,  -- "1.000 l", "6 luces", "4.500 fg"
  qr_token        text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  estado          public.estado_equipo not null default 'activo',
  creado_en       timestamptz not null default now(),
  creado_por      uuid references public.perfil (id) on delete restrict,
  unique (local_id, codigo)
);
create index on public.equipo (tipo_equipo_id);
create index on public.equipo (creado_por);

create table public.unidad (
  id               uuid primary key default gen_random_uuid(),
  equipo_id        uuid not null references public.equipo (id) on delete restrict,
  serie            text not null check (length(trim(serie)) > 0),
  fabricacion      date not null,
  instalada_desde  date not null,
  retirada_en      date,
  check (retirada_en is null or retirada_en >= instalada_desde)
);
-- Una sola unidad instalada por equipo.
create unique index unidad_una_instalada on public.unidad (equipo_id) where retirada_en is null;

-- ——— Controles y registros ———

create table public.control (
  id               uuid primary key default gen_random_uuid(),
  local_id         uuid not null references public.local (id) on delete restrict,
  equipo_id        uuid references public.equipo (id) on delete restrict,  -- null: control de todo el local
  tipo_control_id  uuid not null references public.tipo_control (id) on delete restrict,
  vencimiento      date,           -- null: sin datos
  ultima_fecha     date,
  ultimo_ejecutor  text,
  estado           public.estado_control not null default 'activo',
  motivo_estado    text
);
create index on public.control (local_id);
create index on public.control (tipo_control_id);
create index on public.control (vencimiento);
-- El mismo tipo de control no se repite en un equipo ni en un local.
create unique index control_unico_equipo on public.control (equipo_id, tipo_control_id) where equipo_id is not null;
create unique index control_unico_local on public.control (local_id, tipo_control_id) where equipo_id is null;

create table public.registro (
  id                    uuid primary key default gen_random_uuid(),
  control_id            uuid not null references public.control (id) on delete restrict,
  local_id              uuid not null references public.local (id) on delete restrict,
  fecha                 date not null,
  resultado             public.resultado_registro not null,
  origen                public.origen_registro not null default 'calculado',
  ejecutor              text not null check (length(trim(ejecutor)) > 0),
  oblea                 text,
  nota                  text,
  vencimiento_anterior  date,
  vencimiento_nuevo     date,
  creado_en             timestamptz not null default now(),
  creado_por            uuid references public.perfil (id) on delete restrict
);
create index on public.registro (control_id, fecha desc);
create index on public.registro (local_id, fecha desc);
create index on public.registro (creado_por);

-- ——— Pedidos ———

create table public.pedido (
  id            uuid primary key default gen_random_uuid(),
  local_id      uuid not null references public.local (id) on delete restrict,
  titulo        text not null check (length(trim(titulo)) > 0),
  detalle       text not null default '',
  urgencia      public.urgencia_pedido not null default 'normal',
  estado        public.estado_pedido not null default 'nuevo',
  canal         public.canal_pedido not null,
  creado_en     timestamptz not null default now(),
  sla_vence_en  timestamptz not null,
  resuelto_en   timestamptz,
  creado_por    uuid references public.perfil (id) on delete restrict
);
create index on public.pedido (local_id, estado);
create index on public.pedido (creado_por);

-- ——— Triggers ———

-- El autor sale siempre de la sesión, nunca del formulario.
create function app.sellar_autor() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.creado_por := auth.uid();
  return new;
end;
$$;

create trigger sellar_autor before insert on public.cliente  for each row execute function app.sellar_autor();
create trigger sellar_autor before insert on public.local    for each row execute function app.sellar_autor();
create trigger sellar_autor before insert on public.equipo   for each row execute function app.sellar_autor();
create trigger sellar_autor before insert on public.registro for each row execute function app.sellar_autor();
create trigger sellar_autor before insert on public.pedido   for each row execute function app.sellar_autor();

-- Un control de equipo es siempre del local de ese equipo.
create function app.local_del_control() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.equipo_id is not null then
    select e.local_id into new.local_id from public.equipo e where e.id = new.equipo_id;
  end if;
  return new;
end;
$$;

create trigger local_del_control before insert or update of equipo_id, local_id on public.control
  for each row execute function app.local_del_control();

-- Todos llevan todo (D15): al crear un local o un equipo se crean sus controles, sin fecha.
create function app.crear_controles_local() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.control (local_id, tipo_control_id)
  select new.id, t.id from public.tipo_control t where t.activo and t.aplica_al_local;
  return new;
end;
$$;

create function app.crear_controles_equipo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.control (local_id, equipo_id, tipo_control_id)
  select new.local_id, new.id, tce.tipo_control_id
  from public.tipo_control_equipo tce
  join public.tipo_control t on t.id = tce.tipo_control_id and t.activo
  where tce.tipo_equipo_id = new.tipo_equipo_id;
  return new;
end;
$$;

create trigger crear_controles after insert on public.local  for each row execute function app.crear_controles_local();
create trigger crear_controles after insert on public.equipo for each row execute function app.crear_controles_equipo();

revoke execute on all functions in schema app from public, anon;
