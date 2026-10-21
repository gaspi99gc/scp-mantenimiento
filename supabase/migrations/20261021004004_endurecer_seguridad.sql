-- Ajustes de la revisión de seguridad del 20/10/2026.

-- 1. "Staff" es explícitamente admin o supervisor. Hoy son los únicos roles, pero el día que se sumen
--    usuarios de cliente, un cliente no tiene que pasar por staff.
create or replace function app.es_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and not debe_cambiar_clave and rol in ('admin', 'supervisor')
  );
$$;

revoke execute on function app.es_staff(), app.es_admin() from public, anon;
grant execute on function app.es_staff(), app.es_admin() to authenticated;

-- 2. Marcar "ya eligió su contraseña" ya no se puede pedir por la API: lo hace el servidor después de que
--    Supabase Auth confirma el cambio. Así nadie se saltea el cambio obligatorio de la provisoria.
drop function public.marcar_clave_cambiada();
drop function app.marcar_clave_cambiada();

-- 3. Cerrar todas las sesiones de un usuario (al desactivarlo o al ponerle una contraseña provisoria).
--    Solo la llama el servidor con la clave secreta, nunca un usuario.
create function public.cerrar_sesiones(p_usuario uuid) returns void
language sql security definer set search_path = '' as $$
  delete from auth.sessions where user_id = p_usuario;
$$;
revoke execute on function public.cerrar_sesiones(uuid) from public, anon, authenticated;
grant execute on function public.cerrar_sesiones(uuid) to service_role;

-- 4. Marcar un control como "no aplica" exige decir por qué.
alter table public.control
  add constraint control_motivo_si_no_aplica check (estado = 'activo' or nullif(trim(motivo_estado), '') is not null);
