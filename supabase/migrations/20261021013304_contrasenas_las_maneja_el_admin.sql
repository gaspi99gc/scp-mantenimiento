-- El admin maneja todas las contraseñas desde Más → Usuarios: nadie tiene que elegir la suya al entrar.
-- Se saca la marca "debe cambiar la contraseña" y las funciones de quién es quién dejan de mirarla.

create or replace function app.es_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and rol in ('admin', 'supervisor')
  );
$$;

create or replace function app.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and rol = 'admin'
  );
$$;

alter table public.perfil drop column debe_cambiar_clave;
