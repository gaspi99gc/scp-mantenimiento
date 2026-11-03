-- Usuarios de cliente, paso 2 de 2: a qué locales entra cada uno y qué ve.
--
-- Un usuario de cliente ve, solo para leer, los locales de su membresía: el local y su cliente, los equipos
-- y sus unidades, los controles con sus vencimientos, el historial y los pedidos. Ve todo, incluso lo vencido (D9).
-- No escribe nada: las políticas nuevas son solo de lectura, y las funciones que cargan datos exigen ser staff.
-- Es lo que preveía el diseño de la base (docs/superpowers/specs/2026-10-20-base-datos-y-usuarios-design.md).

-- ——— Membresía: qué locales ve cada usuario de cliente ———

create table public.membresia (
  id          uuid primary key default gen_random_uuid(),
  perfil_id   uuid not null references public.perfil (id) on delete restrict,
  cliente_id  uuid not null references public.cliente (id) on delete restrict,
  local_id    uuid references public.local (id) on delete restrict,  -- null: todos los locales del cliente (una cadena)
  creado_en   timestamptz not null default now(),
  unique nulls not distinct (perfil_id, cliente_id, local_id)
);
create index on public.membresia (cliente_id);
create index on public.membresia (local_id);

comment on table public.membresia is
  'Locales que ve un usuario de cliente. Con local_id vacío ve todos los locales de ese cliente. La escribe solo el servidor.';

-- El cliente de una membresía de local es siempre el dueño de ese local.
create function app.cliente_de_membresia() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.local_id is not null then
    select l.cliente_id into new.cliente_id from public.local l where l.id = new.local_id;
  end if;
  return new;
end;
$$;

create trigger cliente_de_membresia before insert or update of local_id, cliente_id on public.membresia
  for each row execute function app.cliente_de_membresia();

-- ——— Quién es quién ———

create function app.es_cliente() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and rol = 'cliente'
  );
$$;

-- Los locales que ve el usuario de cliente que está usando la app (vacío para cualquier otro).
-- Las políticas lo usan como "local_id in (select app.mis_locales())": se calcula una vez por consulta.
create function app.mis_locales() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select l.id
  from public.membresia m
  join public.perfil p on p.id = m.perfil_id and p.activo and p.rol = 'cliente'
  join public.local l on l.cliente_id = m.cliente_id and (m.local_id is null or m.local_id = l.id)
  where m.perfil_id = auth.uid();
$$;

create function app.mis_clientes() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select distinct m.cliente_id
  from public.membresia m
  join public.perfil p on p.id = m.perfil_id and p.activo and p.rol = 'cliente'
  where m.perfil_id = auth.uid();
$$;

create function app.mis_equipos() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select e.id from public.equipo e where e.local_id in (select app.mis_locales());
$$;

revoke execute on function app.es_cliente(), app.mis_locales(), app.mis_clientes(), app.mis_equipos(),
  app.cliente_de_membresia() from public, anon;
grant execute on function app.es_cliente(), app.mis_locales(), app.mis_clientes(), app.mis_equipos()
  to authenticated;

-- ——— Permisos ———

alter table public.membresia enable row level security;
revoke all on public.membresia from anon, authenticated;
grant select on public.membresia to authenticated;

-- Cada uno ve su membresía; el staff ve todas. Nadie la escribe desde la app (la arma el admin desde el servidor).
create policy membresia_leer on public.membresia for select to authenticated
  using (perfil_id = (select auth.uid()) or (select app.es_staff()));

-- Lectura para el usuario de cliente. Las políticas del staff no cambian: estas se suman (con "o").
create policy cliente_lee_cliente on public.cliente for select to authenticated
  using (id in (select app.mis_clientes()));
create policy cliente_lee_local on public.local for select to authenticated
  using (id in (select app.mis_locales()));
create policy cliente_lee_equipo on public.equipo for select to authenticated
  using (local_id in (select app.mis_locales()));
create policy cliente_lee_unidad on public.unidad for select to authenticated
  using (equipo_id in (select app.mis_equipos()));
create policy cliente_lee_control on public.control for select to authenticated
  using (local_id in (select app.mis_locales()));
create policy cliente_lee_registro on public.registro for select to authenticated
  using (local_id in (select app.mis_locales()));
create policy cliente_lee_pedido on public.pedido for select to authenticated
  using (local_id in (select app.mis_locales()));

-- El catálogo (nombres de equipos y controles, períodos y normas) lo necesita para leer sus tarjetas.
create policy cliente_lee_tipo_equipo on public.tipo_equipo for select to authenticated
  using ((select app.es_cliente()));
create policy cliente_lee_tipo_control on public.tipo_control for select to authenticated
  using ((select app.es_cliente()));
create policy cliente_lee_tce on public.tipo_control_equipo for select to authenticated
  using ((select app.es_cliente()));
