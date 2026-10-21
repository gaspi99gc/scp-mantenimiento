-- Pruebas del núcleo: seguridad por usuario, "todos llevan todo", registrar un control y cambiar el cilindro.
-- Corre en una transacción que se deshace al final: no deja datos.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

-- ——— Usuarios de prueba ———
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'admin@prueba.test'),
  ('22222222-2222-4222-8222-222222222222', 'sup@prueba.test'),
  ('33333333-3333-4333-8333-333333333333', 'baja@prueba.test'),
  ('44444444-4444-4444-8444-444444444444', 'nuevo@prueba.test');
insert into public.perfil (id, nombre, email, rol, activo, debe_cambiar_clave) values
  ('11111111-1111-4111-8111-111111111111', 'Admin', 'admin@prueba.test', 'admin', true, false),
  ('22222222-2222-4222-8222-222222222222', 'Supervisor', 'sup@prueba.test', 'supervisor', true, false),
  ('33333333-3333-4333-8333-333333333333', 'Dado de baja', 'baja@prueba.test', 'supervisor', false, false),
  ('44444444-4444-4444-8444-444444444444', 'Recién creado', 'nuevo@prueba.test', 'supervisor', true, true);

create function pg_temp.como(p_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ——— Estructura ———
select is(
  (select count(*)::int from pg_tables where schemaname = 'public' and not rowsecurity), 0,
  'todas las tablas de public tienen RLS');
select is(
  (select count(*)::int from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'), 0,
  'anon no tiene ningún privilegio sobre las tablas');
select is(
  (select count(*)::int from information_schema.role_table_grants
    where grantee = 'authenticated' and table_schema = 'public'
      and privilege_type in ('TRUNCATE', 'DELETE', 'TRIGGER', 'REFERENCES')
      and not (table_name = 'tipo_control_equipo' and privilege_type = 'DELETE')), 0,
  'nadie con sesión puede vaciar ni borrar tablas (salvo desvincular un control del catálogo)');
select is(app.sumar_periodo('2026-08-31', 6, 'mes'), '2027-02-28'::date, '31/08 + 6 meses recorta a fin de febrero');
select is(app.sumar_periodo('2027-08-31', 6, 'mes'), '2028-02-29'::date, 'en año bisiesto recorta al 29/02');
select is(app.sumar_periodo('2026-01-15', 20, 'anio'), '2046-01-15'::date, 'años');

-- ——— Datos de prueba (como dueño de la base) ———
insert into public.cliente (id, nombre, razon_social, cuit)
  values ('aaaaaaaa-0000-4000-8000-000000000001', 'Cliente de prueba', 'Prueba S.A.', '30-11111111-1');
insert into public.local (id, cliente_id, nombre, direccion, barrio, rubro)
  values ('aaaaaaaa-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', 'Local de prueba', 'Calle 1', 'Centro', 'gastronomico');
insert into public.equipo (id, local_id, tipo_equipo_id, codigo, ubicacion)
  values ('aaaaaaaa-0000-4000-8000-000000000003', 'aaaaaaaa-0000-4000-8000-000000000002',
          '00000000-0000-4000-8000-00000000e001', 'PRU-MAT-01', 'Salón');

select is(
  (select count(*)::int from public.control where local_id = 'aaaaaaaa-0000-4000-8000-000000000002' and equipo_id is null), 2,
  'el local nuevo recibe sus controles propios (plagas y puesta a tierra)');
select is(
  (select count(*)::int from public.control where equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003'), 3,
  'el matafuego nuevo recibe recarga, prueba hidráulica y vida útil');
select is(
  (select count(*)::int from public.control where equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003' and vencimiento is not null), 0,
  'los controles nuevos arrancan sin datos');

-- ——— Quién ve qué ———
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.local where id = 'aaaaaaaa-0000-4000-8000-000000000002'), 1, 'el supervisor activo ve los locales');
reset role;

select pg_temp.como('33333333-3333-4333-8333-333333333333');
select is((select count(*)::int from public.local), 0, 'un usuario dado de baja no ve nada');
select is((select count(*)::int from public.perfil), 1, 'un usuario dado de baja solo ve su propio perfil');
reset role;

select pg_temp.como('44444444-4444-4444-8444-444444444444');
select is((select count(*)::int from public.local), 0, 'quien todavía no eligió su contraseña no ve nada');
reset role;

set local role anon;
select throws_ok('select count(*) from public.local', '42501', null, 'sin sesión no se puede leer');
reset role;

-- ——— Qué no puede hacer un supervisor ———
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select throws_ok(
  $$insert into public.tipo_control (nombre, periodo_valor, periodo_unidad, verbo, texto_hecho) values ('X', 1, 'mes', 'X', 'X')$$,
  '42501', null, 'el supervisor no toca el catálogo');
select throws_ok(
  $$update public.perfil set rol = 'admin' where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'el supervisor no puede cambiarse el rol');
select throws_ok(
  $$update public.control set vencimiento = '2099-01-01' where equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003'$$,
  '42501', null, 'el vencimiento no se edita a mano');
select throws_ok(
  $$insert into public.registro (control_id, local_id, fecha, resultado, ejecutor)
    select id, local_id, app.hoy(), 'ok', 'X' from public.control limit 1$$,
  '42501', null, 'el historial no se escribe a mano');
reset role;

-- ——— Registrar un control ———
create temp table ids as
select
  (select c.id from public.control c join public.tipo_control t on t.id = c.tipo_control_id
    where c.equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003' and t.nombre = 'Recarga') as recarga,
  (select c.id from public.control c join public.tipo_control t on t.id = c.tipo_control_id
    where c.equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003' and t.nombre = 'Vida útil') as vida,
  (select c.id from public.control c join public.tipo_control t on t.id = c.tipo_control_id
    where c.local_id = 'aaaaaaaa-0000-4000-8000-000000000002' and t.nombre = 'Control de plagas') as plagas,
  (select c.id from public.control c join public.tipo_control t on t.id = c.tipo_control_id
    where c.local_id = 'aaaaaaaa-0000-4000-8000-000000000002' and t.nombre = 'Medición de puesta a tierra') as pat;
grant select on ids to authenticated;

select pg_temp.como('22222222-2222-4222-8222-222222222222');

select lives_ok(
  $$select public.registrar_control((select recarga from ids), app.hoy() - 10, 'ok', 'Recargas Norte', '0051234')$$,
  'el supervisor registra una recarga');
select is(
  (select vencimiento from public.control where id = (select recarga from ids)),
  ((app.hoy() - 10) + interval '12 months')::date,
  'la recarga vence 12 meses después del día trabajado');
select is(
  (select oblea from public.registro where control_id = (select recarga from ids)), '0051234',
  'el registro guarda la oblea');

select lives_ok(
  $$select public.registrar_control((select recarga from ids), app.hoy(), 'no_realizado', 'SCP', null, 'Local cerrado')$$,
  'se puede registrar que no se pudo hacer');
select is(
  (select vencimiento from public.control where id = (select recarga from ids)),
  ((app.hoy() - 10) + interval '12 months')::date,
  '"no se pudo hacer" no cambia el vencimiento');

select lives_ok(
  $$select public.registrar_control((select pat from ids), app.hoy(), 'ok', 'Ing. Domínguez', null, null, '2027-05-01')$$,
  'se puede usar la fecha que dice la tarjeta');
select is((select vencimiento from public.control where id = (select pat from ids)), '2027-05-01'::date,
  'la fecha de la tarjeta manda sobre la calculada');

select throws_ok(
  $$select public.registrar_control((select recarga from ids), app.hoy() + 1, 'ok', 'SCP')$$,
  '22023', null, 'no se registra con fecha futura');
reset role;

-- Calendario fijo (plagas): se cuenta desde el vencimiento anterior si todavía no pasó…
update public.control set vencimiento = app.hoy() + 3 where id = (select plagas from ids);
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select lives_ok($$select public.registrar_control((select plagas from ids), app.hoy(), 'ok', 'Fumigadora Sur')$$, 'registra plagas');
select is((select vencimiento from public.control where id = (select plagas from ids)),
  ((app.hoy() + 3) + interval '1 month')::date, 'plagas: cuenta desde el vencimiento anterior');
reset role;
-- …y desde el día trabajado si el vencimiento anterior + período ya quedó atrás.
update public.control set vencimiento = app.hoy() - 60 where id = (select plagas from ids);
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select lives_ok($$select public.registrar_control((select plagas from ids), app.hoy(), 'ok', 'Fumigadora Sur')$$, 'registra plagas atrasado');
select is((select vencimiento from public.control where id = (select plagas from ids)),
  (app.hoy() + interval '1 month')::date, 'plagas atrasado: cuenta desde el día trabajado');
reset role;

-- Un control marcado "no aplica" no se registra.
select pg_temp.como('22222222-2222-4222-8222-222222222222');
update public.control set estado = 'no_aplica', motivo_estado = 'No hay' where id = (select pat from ids);
select throws_ok($$select public.registrar_control((select pat from ids), app.hoy(), 'ok', 'X')$$, '22023', null,
  'un control "no aplica" no se registra');
reset role;

-- Un usuario dado de baja no registra nada.
select pg_temp.como('33333333-3333-4333-8333-333333333333');
select throws_ok($$select public.registrar_control((select recarga from ids), app.hoy(), 'ok', 'X')$$, '42501', null,
  'un usuario dado de baja no puede registrar');
reset role;

-- ——— Cambio de cilindro ———
insert into public.unidad (equipo_id, serie, fabricacion, instalada_desde)
  values ('aaaaaaaa-0000-4000-8000-000000000003', 'C-0001', '2015-03-01', '2020-01-01');
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select lives_ok(
  $$select public.reemplazar_unidad('aaaaaaaa-0000-4000-8000-000000000003', 'C-0002', '2024-01-10', app.hoy())$$,
  'el supervisor cambia el cilindro');
select is(
  (select count(*)::int from public.unidad where equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003' and retirada_en is null), 1,
  'queda una sola unidad instalada');
select is((select serie from public.unidad where equipo_id = 'aaaaaaaa-0000-4000-8000-000000000003' and retirada_en is null),
  'C-0002', 'la instalada es la nueva');
select is((select vencimiento from public.control where id = (select vida from ids)), '2044-01-10'::date,
  'la vida útil se recalcula desde la fabricación de la unidad nueva');
reset role;

-- ——— Primer ingreso ———
-- El cambio obligatorio no se puede saltear por la API: solo el servidor baja la marca.
select is(
  (select count(*)::int from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'app') and p.proname = 'marcar_clave_cambiada'), 0,
  'no existe una función para saltear el cambio de contraseña');
update public.perfil set debe_cambiar_clave = false where id = '44444444-4444-4444-8444-444444444444';
select pg_temp.como('44444444-4444-4444-8444-444444444444');
select is((select count(*)::int from public.local where id = 'aaaaaaaa-0000-4000-8000-000000000002'), 1, 'después de elegir la contraseña ya ve los locales');
reset role;

-- ——— Usuario para entrar ———
update public.perfil set usuario = 'sup.prueba' where id = '22222222-2222-4222-8222-222222222222';
select throws_ok(
  $$update public.perfil set usuario = 'sup.prueba' where id = '33333333-3333-4333-8333-333333333333'$$,
  '23505', null, 'dos personas no pueden tener el mismo usuario');
select throws_ok(
  $$update public.perfil set usuario = 'Con Espacios' where id = '33333333-3333-4333-8333-333333333333'$$,
  '23514', null, 'el usuario va en minúsculas y sin espacios');
select pg_temp.como('22222222-2222-4222-8222-222222222222');
select throws_ok(
  $$update public.perfil set usuario = 'otro' where id = '22222222-2222-4222-8222-222222222222'$$,
  '42501', null, 'nadie cambia su usuario por la API (solo el servidor)');
reset role;

-- ——— Sesiones y funciones internas ———
select ok(not has_function_privilege('authenticated', 'public.cerrar_sesiones(uuid)', 'execute'),
  'un usuario no puede cerrar sesiones ajenas');
select ok(not has_function_privilege('anon', 'app.es_staff()', 'execute'), 'sin sesión no se consulta quién es staff');
select throws_ok(
  $$update public.control set estado = 'no_aplica' where id = (select recarga from ids)$$,
  '23514', null, '"no aplica" exige un motivo');

select * from finish();
rollback;
