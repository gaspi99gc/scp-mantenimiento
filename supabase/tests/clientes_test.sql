-- Pruebas de los usuarios de cliente: ven solo sus locales, solo para leer.
-- Corre en una transacción que se deshace al final: no deja datos.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

-- ——— Usuarios de prueba ———
insert into auth.users (id, email) values
  ('22222222-2222-4222-8222-222222222222', 'sup@prueba.test'),
  ('55555555-5555-4555-8555-555555555555', 'local1@prueba.test'),
  ('66666666-6666-4666-8666-666666666666', 'cadena@prueba.test'),
  ('77777777-7777-4777-8777-777777777777', 'clientebaja@prueba.test'),
  ('88888888-8888-4888-8888-888888888888', 'sinmembresia@prueba.test');
insert into public.perfil (id, nombre, email, rol, activo) values
  ('22222222-2222-4222-8222-222222222222', 'Supervisor', 'sup@prueba.test', 'supervisor', true),
  ('55555555-5555-4555-8555-555555555555', 'Encargado local 1', 'local1@prueba.test', 'cliente', true),
  ('66666666-6666-4666-8666-666666666666', 'Gerente de la cadena', 'cadena@prueba.test', 'cliente', true),
  ('77777777-7777-4777-8777-777777777777', 'Cliente dado de baja', 'clientebaja@prueba.test', 'cliente', false),
  ('88888888-8888-4888-8888-888888888888', 'Cliente sin locales', 'sinmembresia@prueba.test', 'cliente', true);

create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ——— Datos: un cliente con dos locales y otro cliente con uno ———
insert into public.cliente (id, nombre, razon_social, cuit) values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'Cadena de prueba', 'Cadena S.A.', '30-22222222-2'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Otro cliente', 'Otro S.A.', '30-33333333-3');
insert into public.local (id, cliente_id, nombre, direccion, barrio, rubro) values
  ('bbbbbbbb-0000-4000-8000-000000000011', 'bbbbbbbb-0000-4000-8000-000000000001', 'Local 1', 'Calle 1', 'Centro', 'gastronomico'),
  ('bbbbbbbb-0000-4000-8000-000000000012', 'bbbbbbbb-0000-4000-8000-000000000001', 'Local 2', 'Calle 2', 'Centro', 'retail'),
  ('bbbbbbbb-0000-4000-8000-000000000021', 'bbbbbbbb-0000-4000-8000-000000000002', 'Local ajeno', 'Calle 3', 'Norte', 'retail');
insert into public.equipo (id, local_id, tipo_equipo_id, codigo, ubicacion) values
  ('bbbbbbbb-0000-4000-8000-000000000101', 'bbbbbbbb-0000-4000-8000-000000000011', '00000000-0000-4000-8000-00000000e001', 'L1-MAT-01', 'Salón'),
  ('bbbbbbbb-0000-4000-8000-000000000102', 'bbbbbbbb-0000-4000-8000-000000000012', '00000000-0000-4000-8000-00000000e001', 'L2-MAT-01', 'Salón'),
  ('bbbbbbbb-0000-4000-8000-000000000103', 'bbbbbbbb-0000-4000-8000-000000000021', '00000000-0000-4000-8000-00000000e001', 'AJ-MAT-01', 'Salón');
insert into public.unidad (equipo_id, serie, fabricacion, instalada_desde) values
  ('bbbbbbbb-0000-4000-8000-000000000101', 'C-L1', '2020-01-01', '2021-01-01'),
  ('bbbbbbbb-0000-4000-8000-000000000103', 'C-AJ', '2020-01-01', '2021-01-01');
insert into public.pedido (local_id, titulo, canal, sla_vence_en) values
  ('bbbbbbbb-0000-4000-8000-000000000011', 'Pedido del local 1', 'telefono', now() + interval '1 day'),
  ('bbbbbbbb-0000-4000-8000-000000000021', 'Pedido ajeno', 'telefono', now() + interval '1 day');

-- local1 ve solo el Local 1; el gerente ve toda su cadena (membresía sin local); los demás, nada.
insert into public.membresia (perfil_id, cliente_id, local_id) values
  ('55555555-5555-4555-8555-555555555555', 'bbbbbbbb-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000011'),
  ('66666666-6666-4666-8666-666666666666', 'bbbbbbbb-0000-4000-8000-000000000001', null),
  ('77777777-7777-4777-8777-777777777777', 'bbbbbbbb-0000-4000-8000-000000000001', null);

-- Una membresía de local toma el cliente del local, aunque digan otro.
insert into public.membresia (perfil_id, cliente_id, local_id) values
  ('88888888-8888-4888-8888-888888888888', 'bbbbbbbb-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000012');
select is(
  (select cliente_id from public.membresia where perfil_id = '88888888-8888-4888-8888-888888888888'),
  'bbbbbbbb-0000-4000-8000-000000000001'::uuid,
  'la membresía de un local queda con el cliente dueño de ese local');
delete from public.membresia where perfil_id = '88888888-8888-4888-8888-888888888888';

-- ——— Estructura ———
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity), 0,
  'todas las tablas de public siguen con RLS');
select is(
  (select count(*)::int from information_schema.role_table_grants
    where grantee = 'authenticated' and table_schema = 'public' and table_name = 'membresia' and privilege_type <> 'SELECT'), 0,
  'nadie con sesión escribe membresías');

-- ——— El encargado de un local ———
select pg_temp.como('55555555-5555-4555-8555-555555555555');
select is((select count(*)::int from public.local), 1, 'local1 ve un solo local');
select is((select nombre from public.local), 'Local 1', 'y es el suyo');
select is((select count(*)::int from public.cliente), 1, 've su cliente y ningún otro');
select is((select count(*)::int from public.equipo), 1, 've solo los equipos de su local');
select is((select count(*)::int from public.unidad), 1, 've solo las unidades de sus equipos');
select is(
  (select count(*)::int from public.control where local_id <> 'bbbbbbbb-0000-4000-8000-000000000011'), 0,
  'no ve controles de otros locales');
select ok((select count(*) from public.control) > 0, 've los controles de su local');
select is((select count(*)::int from public.pedido), 1, 've solo los pedidos de su local');
select is((select count(*)::int from public.perfil), 1, 've solo su propio perfil');
select is((select count(*)::int from public.membresia), 1, 've solo su membresía');
select ok((select count(*) from public.tipo_control) > 0, 'lee el catálogo para entender sus tarjetas');
select is(
  (select count(*)::int from public.local where id = 'bbbbbbbb-0000-4000-8000-000000000021'), 0,
  'pedir un local ajeno por id no devuelve nada');

-- No escribe nada.
select throws_ok(
  $$insert into public.local (cliente_id, nombre, direccion, barrio, rubro)
    values ('bbbbbbbb-0000-4000-8000-000000000001', 'X', 'X', 'X', 'otro')$$,
  '42501', null, 'el cliente no crea locales');
select throws_ok(
  $$insert into public.pedido (local_id, titulo, canal, sla_vence_en)
    values ('bbbbbbbb-0000-4000-8000-000000000011', 'X', 'portal', now())$$,
  '42501', null, 'el cliente todavía no carga pedidos');
select throws_ok(
  $$insert into public.membresia (perfil_id, cliente_id) values ('55555555-5555-4555-8555-555555555555', 'bbbbbbbb-0000-4000-8000-000000000002')$$,
  '42501', null, 'el cliente no se agrega locales');
update public.local set nombre = 'Hackeado' where id = 'bbbbbbbb-0000-4000-8000-000000000011';
update public.equipo set ubicacion = 'Hackeado' where id = 'bbbbbbbb-0000-4000-8000-000000000101';
select throws_ok(
  $$select public.registrar_control(
      (select id from public.control where equipo_id = 'bbbbbbbb-0000-4000-8000-000000000101' limit 1),
      app.hoy(), 'ok', 'Yo')$$,
  '42501', null, 'el cliente no registra controles');
select throws_ok(
  $$select public.reemplazar_unidad('bbbbbbbb-0000-4000-8000-000000000101', 'C-X', '2024-01-01', app.hoy())$$,
  '42501', null, 'el cliente no cambia cilindros');
select ok(not app.es_staff(), 'un cliente no es staff');
reset role;

select is((select nombre from public.local where id = 'bbbbbbbb-0000-4000-8000-000000000011'), 'Local 1',
  'el intento de editar el local no cambió nada');
select is((select ubicacion from public.equipo where id = 'bbbbbbbb-0000-4000-8000-000000000101'), 'Salón',
  'el intento de editar el equipo no cambió nada');

-- ——— El gerente de la cadena ———
select pg_temp.como('66666666-6666-4666-8666-666666666666');
select is((select count(*)::int from public.local), 2, 'el gerente ve los dos locales de su cadena');
select is((select count(*)::int from public.equipo), 2, 'y los equipos de los dos');
select is(
  (select count(*)::int from public.local where cliente_id = 'bbbbbbbb-0000-4000-8000-000000000002'), 0,
  'pero nada de otro cliente');
reset role;

-- ——— Dado de baja o sin locales ———
select pg_temp.como('77777777-7777-4777-8777-777777777777');
select is((select count(*)::int from public.local), 0, 'un cliente dado de baja no ve nada');
select is((select count(*)::int from public.tipo_control), 0, 'ni siquiera el catálogo');
reset role;

select pg_temp.como('88888888-8888-4888-8888-888888888888');
select is((select count(*)::int from public.local), 0, 'un cliente sin membresía no ve locales');
reset role;

-- ——— El staff no cambió ———
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.local where id::text like 'bbbbbbbb%'), 3, 'el supervisor sigue viendo todos los locales');
select is((select count(*)::int from public.membresia), 3, 'el supervisor ve las membresías');
reset role;

select ok(not has_function_privilege('anon', 'app.mis_locales()', 'execute'), 'sin sesión no se consultan locales de nadie');

select * from finish();
rollback;
