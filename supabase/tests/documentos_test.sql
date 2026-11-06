-- Pruebas de los documentos para inspecciones (sprint 1): el catálogo de la empresa, un documento por
-- local y quién decide si aplica. Corre en una transacción que se deshace al final: no deja datos.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

-- ——— Usuarios de prueba ———
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-1111111111d1', 'admin-doc@prueba.test'),
  ('22222222-2222-4222-8222-2222222222d2', 'sup-doc@prueba.test'),
  ('55555555-5555-4555-8555-5555555555d5', 'cli-doc@prueba.test');
insert into public.perfil (id, nombre, email, rol, activo) values
  ('11111111-1111-4111-8111-1111111111d1', 'Admin', 'admin-doc@prueba.test', 'admin', true),
  ('22222222-2222-4222-8222-2222222222d2', 'Supervisor', 'sup-doc@prueba.test', 'supervisor', true),
  ('55555555-5555-4555-8555-5555555555d5', 'Encargado', 'cli-doc@prueba.test', 'cliente', true);

create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- Solo el catálogo que trae la migración (el admin puede sumar otros).
create function pg_temp.de_la_empresa(p_id uuid) returns boolean language sql as $$
  select p_id::text like '00000000-0000-4000-8000-000000d00%';
$$;

-- ——— El catálogo ———
select is((select count(*)::int from public.tipo_documento where pg_temp.de_la_empresa(id)), 43,
  'el catálogo trae los 43 documentos de la empresa');
select is((select count(*)::int from public.tipo_documento where pg_temp.de_la_empresa(id) and a_validar and not activo), 10,
  'los 10 que hay que validar entran apagados');
select is(
  (select count(*)::int from public.tipo_documento_solapa s where pg_temp.de_la_empresa(s.tipo_documento_id) and s.solapa = 'agc'), 21,
  'AGC tiene 21 documentos');
select is(
  (select count(*)::int from public.tipo_documento_solapa s where pg_temp.de_la_empresa(s.tipo_documento_id) and s.solapa = 'hys'), 15,
  'HyS tiene 15, contando la puesta a tierra');
select is(
  (select count(*)::int from public.tipo_documento_solapa s where pg_temp.de_la_empresa(s.tipo_documento_id) and s.solapa = 'autoproteccion'), 5,
  'Autoprotección tiene 5');
select is(
  (select count(*)::int from public.tipo_documento_solapa s where pg_temp.de_la_empresa(s.tipo_documento_id) and s.solapa = 'residuos'), 3,
  'Residuos tiene 3');
select is(
  (select array_agg(solapa::text || orden order by solapa) from public.tipo_documento_solapa
    where tipo_documento_id = '00000000-0000-4000-8000-000000d00113'),
  array['agc13', 'hys5'],
  'la puesta a tierra es una sola y está en AGC (13) y en HyS (5)');

-- ——— Un local nuevo recibe sus documentos ———
insert into public.cliente (id, nombre, razon_social, cuit) values
  ('dddddddd-0000-4000-8000-000000000001', 'Cliente doc', 'Doc S.A.', '30-44444444-4');
insert into public.local (id, cliente_id, nombre, direccion, barrio, rubro) values
  ('dddddddd-0000-4000-8000-000000000011', 'dddddddd-0000-4000-8000-000000000001', 'Local doc', 'Calle 1', 'Centro', 'gastronomico');

select is(
  (select count(*)::int from public.documento where local_id = 'dddddddd-0000-4000-8000-000000000011'),
  (select count(*)::int from public.tipo_documento where activo),
  'un local nuevo recibe un documento por cada uno activo del catálogo');
select is(
  (select count(*)::int from public.documento d join public.tipo_documento t on t.id = d.tipo_documento_id
    where d.local_id = 'dddddddd-0000-4000-8000-000000000011' and t.aplica = 'siempre' and d.aplica is not true), 0,
  'los de "Siempre" nacen aplicando');
select is(
  (select count(*)::int from public.documento d join public.tipo_documento t on t.id = d.tipo_documento_id
    where d.local_id = 'dddddddd-0000-4000-8000-000000000011' and t.aplica = 'de_corresponder' and d.aplica is not null), 0,
  'los de "De corresponder" nacen sin definir');
select is(
  (select count(*)::int from public.documento
    where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00201'), 0,
  'uno apagado (a validar) no llega a los locales');

-- ——— El supervisor decide si aplica ———
select pg_temp.como('22222222-2222-4222-8222-2222222222d2');
select ok((select count(*) from public.documento where local_id = 'dddddddd-0000-4000-8000-000000000011') > 0,
  'el supervisor ve los documentos del local');
select throws_ok(
  $$ update public.documento set aplica = false
     where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109' $$,
  '23514', null, '"No aplica" sin motivo no se puede');

update public.documento set aplica = false, motivo_no_aplica = 'No tiene ascensor'
  where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109';
select is(
  (select aplica from public.documento
    where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109'),
  false, 'el supervisor marca "No aplica" con el motivo');
select is(
  (select decidido_por from public.documento
    where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109'),
  '22222222-2222-4222-8222-2222222222d2'::uuid, 'queda anotado quién lo decidió');
select throws_ok(
  $$ update public.documento set aplica = null
     where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109' $$,
  '22023', null, 'una vez decidido no vuelve a "sin definir"');

update public.documento set aplica = true
  where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109';
select is(
  (select motivo_no_aplica from public.documento
    where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00109'),
  null, 'al volver a "Aplica" se borra el motivo');

select throws_ok(
  $$ update public.documento set local_id = local_id where local_id = 'dddddddd-0000-4000-8000-000000000011' $$,
  '42501', null, 'el supervisor no cambia un documento de local');
select throws_ok(
  $$ insert into public.documento (local_id, tipo_documento_id)
     values ('dddddddd-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000d00201') $$,
  '42501', null, 'ni crea documentos a mano');
select throws_ok(
  $$ delete from public.documento where local_id = 'dddddddd-0000-4000-8000-000000000011' $$,
  '42501', null, 'ni los borra');

update public.tipo_documento set nombre = 'Cambiado' where id = '00000000-0000-4000-8000-000000d00101';
select is((select nombre from public.tipo_documento where id = '00000000-0000-4000-8000-000000d00101'),
  'Certificado de habilitación / Autorización de Actividad Económica', 'el supervisor no edita el catálogo');
select throws_ok(
  $$ insert into public.tipo_documento (nombre) values ('Documento nuevo') $$,
  '42501', null, 'ni le agrega documentos');
reset role;

-- ——— El admin activa uno que estaba a validar ———
select pg_temp.como('11111111-1111-4111-8111-1111111111d1');
update public.tipo_documento set activo = true, a_validar = false where id = '00000000-0000-4000-8000-000000d00201';
select is(
  (select count(*)::int from public.documento
    where local_id = 'dddddddd-0000-4000-8000-000000000011' and tipo_documento_id = '00000000-0000-4000-8000-000000d00201'), 1,
  'al activarlo llega a los locales que ya existen');
reset role;

-- ——— El cliente todavía no los ve (sprint 3) ———
insert into public.membresia (perfil_id, cliente_id, local_id) values
  ('55555555-5555-4555-8555-5555555555d5', 'dddddddd-0000-4000-8000-000000000001', null);
select pg_temp.como('55555555-5555-4555-8555-5555555555d5');
select is((select count(*)::int from public.documento), 0, 'el cliente todavía no ve documentos');
select is((select count(*)::int from public.tipo_documento), 0, 'ni el catálogo');
reset role;

select ok(not has_table_privilege('anon', 'public.documento', 'select'), 'sin sesión no se ve ningún documento');
select ok(not has_table_privilege('anon', 'public.tipo_documento', 'select'), 'ni el catálogo');

select * from finish();
rollback;
