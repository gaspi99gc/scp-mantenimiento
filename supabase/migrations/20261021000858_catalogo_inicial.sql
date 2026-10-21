-- Catálogo inicial: los tipos de equipo y los 11 controles que usaba la app con datos de ejemplo
-- (src/lib/datos.ts, tiposControl). Los ids son fijos para que los datos de ejemplo los referencien.

insert into public.tipo_equipo (id, nombre, usa_unidad) values
  ('00000000-0000-4000-8000-00000000e001', 'Matafuego ABC 5 kg', true),
  ('00000000-0000-4000-8000-00000000e002', 'Matafuego ABC 10 kg', true),
  ('00000000-0000-4000-8000-00000000e003', 'Matafuego CO₂ 3,5 kg', true),
  ('00000000-0000-4000-8000-00000000e004', 'Tanque de agua', false),
  ('00000000-0000-4000-8000-00000000e005', 'Campana', false),
  ('00000000-0000-4000-8000-00000000e006', 'Grasera', false),
  ('00000000-0000-4000-8000-00000000e007', 'Tablero eléctrico', false),
  ('00000000-0000-4000-8000-00000000e008', 'Luces de emergencia', false),
  ('00000000-0000-4000-8000-00000000e009', 'Equipo de aire acondicionado', false);

insert into public.tipo_control
  (id, nombre, aplica_al_local, periodo_valor, periodo_unidad, base, anticipacion_dias, ejecutor, norma, evidencia, verbo, texto_hecho, depende_de_unidad)
values
  ('00000000-0000-4000-8000-00000000c001', 'Recarga', false, 12, 'mes', 'desde_ejecucion', 10, 'tercero', 'IRAM 3517-2',
   '{"Foto de la tarjeta","Número de oblea"}', 'Registrar recarga', 'Recarga registrada', false),
  ('00000000-0000-4000-8000-00000000c002', 'Prueba hidráulica', false, 5, 'anio', 'desde_ejecucion', 60, 'tercero', 'IRAM 3517-2',
   '{"Certificado"}', 'Registrar prueba hidráulica', 'Prueba hidráulica registrada', true),
  ('00000000-0000-4000-8000-00000000c003', 'Vida útil', false, 20, 'anio', 'desde_ejecucion', 90, 'scp', 'IRAM 3517-2',
   '{}', 'Registrar reemplazo', 'Reemplazo registrado', true),
  ('00000000-0000-4000-8000-00000000c004', 'Limpieza y análisis', false, 6, 'mes', 'desde_ejecucion', 20, 'tercero', 'Ley 3751 CABA',
   '{"Certificado","Análisis bacteriológico"}', 'Registrar limpieza', 'Limpieza registrada', false),
  ('00000000-0000-4000-8000-00000000c005', 'Limpieza de campana', false, 3, 'mes', 'desde_ejecucion', 10, 'scp', null,
   '{"Foto antes","Foto después"}', 'Registrar limpieza', 'Limpieza registrada', false),
  ('00000000-0000-4000-8000-00000000c006', 'Limpieza de grasera', false, 3, 'mes', 'desde_ejecucion', 10, 'scp', null,
   '{"Foto antes","Foto después"}', 'Registrar limpieza', 'Limpieza registrada', false),
  ('00000000-0000-4000-8000-00000000c007', 'Control de tablero', false, 6, 'mes', 'desde_ejecucion', 15, 'scp', null,
   '{"Checklist","Foto del tablero"}', 'Registrar control', 'Control registrado', false),
  ('00000000-0000-4000-8000-00000000c008', 'Medición de puesta a tierra', true, 12, 'mes', 'desde_ejecucion', 30, 'tercero', 'Res. SRT 900/15',
   '{"Protocolo firmado"}', 'Registrar medición', 'Medición registrada', false),
  ('00000000-0000-4000-8000-00000000c009', 'Prueba de autonomía', false, 3, 'mes', 'desde_ejecucion', 7, 'scp', null,
   '{"Checklist"}', 'Registrar prueba', 'Prueba registrada', false),
  ('00000000-0000-4000-8000-00000000c010', 'Control de plagas', true, 1, 'mes', 'desde_vencimiento', 5, 'tercero', null,
   '{"Certificado"}', 'Registrar control', 'Control registrado', false),
  ('00000000-0000-4000-8000-00000000c011', 'Service de aire', false, 12, 'mes', 'desde_vencimiento', 20, 'scp', null,
   '{"Checklist","Foto de filtros"}', 'Registrar service', 'Service registrado', false);

-- A qué tipo de equipo se aplica cada control.
insert into public.tipo_control_equipo (tipo_control_id, tipo_equipo_id)
select c.id, e.id
from (values
  ('00000000-0000-4000-8000-00000000c001'::uuid, array['00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000e003']::uuid[]),
  ('00000000-0000-4000-8000-00000000c002'::uuid, array['00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000e003']::uuid[]),
  ('00000000-0000-4000-8000-00000000c003'::uuid, array['00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-00000000e003']::uuid[]),
  ('00000000-0000-4000-8000-00000000c004'::uuid, array['00000000-0000-4000-8000-00000000e004']::uuid[]),
  ('00000000-0000-4000-8000-00000000c005'::uuid, array['00000000-0000-4000-8000-00000000e005']::uuid[]),
  ('00000000-0000-4000-8000-00000000c006'::uuid, array['00000000-0000-4000-8000-00000000e006']::uuid[]),
  ('00000000-0000-4000-8000-00000000c007'::uuid, array['00000000-0000-4000-8000-00000000e007']::uuid[]),
  ('00000000-0000-4000-8000-00000000c009'::uuid, array['00000000-0000-4000-8000-00000000e008']::uuid[]),
  ('00000000-0000-4000-8000-00000000c011'::uuid, array['00000000-0000-4000-8000-00000000e009']::uuid[])
) as v(control_id, equipos)
cross join lateral unnest(v.equipos) as eq(id)
join public.tipo_control c on c.id = v.control_id
join public.tipo_equipo e on e.id = eq.id;
