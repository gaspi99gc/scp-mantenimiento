-- Supabase les da por defecto TODOS los privilegios (incluido TRUNCATE, que saltea RLS) a anon y
-- authenticated sobre cada tabla nueva de public. Los tests lo detectaron: un supervisor podía
-- editar un vencimiento a mano. Acá se saca todo y se vuelve a dar solo lo justo.

-- Que las tablas, secuencias y funciones futuras no nazcan con permisos.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated, public;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- perfil: solo lectura (las escrituras van por el servidor con la clave secreta).
grant select on public.perfil to authenticated;

-- Catálogo: lectura para el staff; escritura solo admin (por las políticas).
grant select, insert, update on public.tipo_equipo, public.tipo_control to authenticated;
grant select, insert, delete on public.tipo_control_equipo to authenticated;

-- Operativas.
grant select, insert on public.cliente, public.local, public.equipo, public.pedido to authenticated;
grant update (nombre, razon_social, cuit) on public.cliente to authenticated;
grant update (cliente_id, nombre, direccion, barrio, rubro, horario_acceso, requisitos_acceso,
              encargado_nombre, encargado_telefono, supervisor_id) on public.local to authenticated;
grant update (codigo, ubicacion, detalle, estado) on public.equipo to authenticated;
grant update (titulo, detalle, urgencia, estado, resuelto_en) on public.pedido to authenticated;

grant select, insert on public.unidad to authenticated;
grant select on public.control to authenticated;
grant update (estado, motivo_estado) on public.control to authenticated;
grant select on public.registro to authenticated;
