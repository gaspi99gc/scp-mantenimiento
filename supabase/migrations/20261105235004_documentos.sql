-- Documentos para inspecciones (D23), sprint 1: el catálogo de la empresa y un documento por local.
-- Cada documento del catálogo está en una o varias solapas (AGC, HyS, Autoprotección, Residuos) y se
-- carga una sola vez aunque aparezca en dos. Los PDF y los vencimientos llegan en el sprint 2: por ahora,
-- lo que aplica queda "Faltante". Detalle en docs/plan-documentos.md.
-- Fuente del catálogo: "Informes para inspecciones de locales gastronómicos" (04/11/2026), armado con la
-- Guía orientativa de inspecciones de AGC para gastronómicos y para café-bar, restaurante, cantina y parrilla.

create type public.solapa as enum ('agc', 'hys', 'autoproteccion', 'residuos');
create type public.aplica_documento as enum ('siempre', 'de_corresponder');

-- ——— Catálogo ———

create table public.tipo_documento (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null check (length(trim(nombre)) > 0),
  grupo              text,             -- en AGC: Habilitación, Seguridad, Instalaciones, Higiene, Funcionamiento
  detalle            text,
  aplica             public.aplica_documento not null default 'siempre',
  periodo_valor      int,
  periodo_unidad     public.periodo_unidad,  -- null: no vence (planos, libro de inspección); manual: según el certificado
  anticipacion_dias  int not null default 30 check (anticipacion_dias between 0 and 365),  -- cuándo pasa a "Por vencer"
  norma              text,
  a_validar          boolean not null default false,  -- falta confirmarlo antes de cargarlo (entra apagado)
  activo             boolean not null default true,
  check (
    (periodo_unidad is null and periodo_valor is null)
    or (periodo_unidad = 'manual' and periodo_valor is null)
    or (periodo_unidad <> 'manual' and periodo_valor > 0)
  )
);

-- En qué solapas aparece cada documento, y en qué lugar de cada una (la puesta a tierra es el 13 de AGC y el 5 de HyS).
create table public.tipo_documento_solapa (
  tipo_documento_id  uuid not null references public.tipo_documento (id) on delete cascade,
  solapa             public.solapa not null,
  orden              int not null,
  primary key (tipo_documento_id, solapa)
);
create index on public.tipo_documento_solapa (solapa, orden);

-- ——— Un documento por local ———

create table public.documento (
  id                 uuid primary key default gen_random_uuid(),
  local_id           uuid not null references public.local (id) on delete restrict,
  tipo_documento_id  uuid not null references public.tipo_documento (id) on delete restrict,
  aplica             boolean,          -- null: "de corresponder" sin definir; false: no aplica en este local
  motivo_no_aplica   text,
  decidido_en        timestamptz,
  decidido_por       uuid references public.perfil (id) on delete restrict,
  unique (local_id, tipo_documento_id),
  check (aplica is distinct from false or nullif(trim(motivo_no_aplica), '') is not null)
);
create index on public.documento (tipo_documento_id);
create index on public.documento (decidido_por);

-- ——— Triggers ———

-- Todos llevan todo (D15): cada local tiene un registro por cada documento activo del catálogo.
-- "Siempre" nace aplicando (queda Faltante hasta que se sube el PDF); "De corresponder", sin definir.
create function app.crear_documentos_local() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.documento (local_id, tipo_documento_id, aplica)
  select new.id, t.id, case when t.aplica = 'siempre' then true end
  from public.tipo_documento t
  where t.activo;
  return new;
end;
$$;

-- Un documento que se agrega o se activa en el catálogo llega a los locales que ya existen.
create function app.crear_documentos_tipo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.activo then
    insert into public.documento (local_id, tipo_documento_id, aplica)
    select l.id, new.id, case when new.aplica = 'siempre' then true end
    from public.local l
    on conflict (local_id, tipo_documento_id) do nothing;
  end if;
  -- Si pasa a "Siempre", los locales que todavía no lo habían definido quedan aplicando.
  if tg_op = 'UPDATE' and new.aplica = 'siempre' and old.aplica <> 'siempre' then
    update public.documento set aplica = true where tipo_documento_id = new.id and aplica is null;
  end if;
  return new;
end;
$$;

-- Quién decidió si aplica y cuándo sale de la sesión, nunca del formulario.
create function app.sellar_decision() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.aplica is null and old.aplica is not null then
    raise exception 'Elegí si el documento aplica o no en este local.' using errcode = '22023';
  end if;
  if new.aplica is distinct from old.aplica then
    new.decidido_en := now();
    new.decidido_por := auth.uid();
  end if;
  if new.aplica is distinct from false then
    new.motivo_no_aplica := null;
  end if;
  return new;
end;
$$;

create trigger crear_documentos after insert on public.local
  for each row execute function app.crear_documentos_local();
create trigger crear_documentos after insert or update of activo, aplica on public.tipo_documento
  for each row execute function app.crear_documentos_tipo();
create trigger sellar_decision before update on public.documento
  for each row execute function app.sellar_decision();

-- ——— Seguridad ———
-- El staff lee todo y decide por local si un documento aplica; solo el admin toca el catálogo.
-- El cliente todavía no los ve: eso es el sprint 3.

alter table public.tipo_documento        enable row level security;
alter table public.tipo_documento_solapa enable row level security;
alter table public.documento             enable row level security;

revoke all on public.tipo_documento, public.tipo_documento_solapa, public.documento from anon, authenticated;
grant select, insert, update on public.tipo_documento to authenticated;
grant select, insert, delete on public.tipo_documento_solapa to authenticated;
-- Los documentos los crean los triggers; a mano solo se decide si aplica.
grant select on public.documento to authenticated;
grant update (aplica, motivo_no_aplica) on public.documento to authenticated;

create policy tipo_documento_leer on public.tipo_documento for select to authenticated using ((select app.es_staff()));
create policy tipo_documento_crear on public.tipo_documento for insert to authenticated with check ((select app.es_admin()));
create policy tipo_documento_editar on public.tipo_documento for update to authenticated
  using ((select app.es_admin())) with check ((select app.es_admin()));

create policy tds_leer on public.tipo_documento_solapa for select to authenticated using ((select app.es_staff()));
create policy tds_crear on public.tipo_documento_solapa for insert to authenticated with check ((select app.es_admin()));
create policy tds_borrar on public.tipo_documento_solapa for delete to authenticated using ((select app.es_admin()));

create policy documento_leer on public.documento for select to authenticated using ((select app.es_staff()));
create policy documento_decidir on public.documento for update to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));

revoke execute on function app.crear_documentos_local(), app.crear_documentos_tipo(), app.sellar_decision()
  from public, anon, authenticated;

-- ——— Catálogo inicial ———
-- Ids fijos para poder conectarlos con los controles (sprint 5): d001NN = AGC, d002NN = HyS,
-- d003NN = Autoprotección, d004NN = Residuos (NN = número en la solapa del documento de la empresa).
-- Vencimientos conocidos: campana y caldera cada mes, tanques cada 6 meses, luces de emergencia cada año;
-- el resto, según el certificado. Los mensuales avisan 7 días antes; los demás, 30.
-- HyS 1 a 4 y 13 a 15, y toda la solapa de Residuos, entran apagados y "a validar".

insert into public.tipo_documento
  (id, nombre, grupo, detalle, aplica, periodo_valor, periodo_unidad, anticipacion_dias, norma, a_validar, activo)
values
  -- Solapa 1: AGC
  ('00000000-0000-4000-8000-000000d00101', 'Certificado de habilitación / Autorización de Actividad Económica', 'Habilitación',
   'Con código QR; debe coincidir rubro, superficie y titular', 'siempre', null, null, 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00102', 'Planos de habilitación', 'Habilitación',
   null, 'siempre', null, null, 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00103', 'Plano contra incendio y plano conforme a obra final', 'Habilitación',
   'Con certificado final', 'de_corresponder', null, null, 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00104', 'RNE y RNPA', 'Habilitación',
   null, 'de_corresponder', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00105', 'Libro de inspección / libro digital', 'Habilitación',
   null, 'siempre', null, null, 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00106', 'Matafuegos', 'Seguridad',
   'Carga vigente, con marbete QR', 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00107', 'Ignifugados', 'Seguridad',
   'Certificado de tratamiento (cortinados, revestimientos)', 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00108', 'Cálculo de estructuras / certificado de sobrecarga', 'Seguridad',
   'Entrepiso y lugares donde habitan personas', 'de_corresponder', null, null, 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00109', 'Ascensores y montacargas', 'Seguridad',
   'Habilitación y mantenimiento vigente', 'de_corresponder', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00110', 'Seguro de RC comprensivo', 'Seguridad',
   null, 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00111', 'Permiso de anuncio publicitario', 'Seguridad',
   'Con RC que cubra el cartel (letreros, toldos, marquesinas)', 'de_corresponder', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00112', 'Seguridad privada', 'Seguridad',
   'Alta de vigiladores y credenciales', 'de_corresponder', null, 'manual', 30, 'Ley 5688', false, true),
  ('00000000-0000-4000-8000-000000d00113', 'Medición de puesta a tierra', 'Instalaciones',
   'Con encomienda profesional', 'siempre', null, 'manual', 30, 'Res. SRT 900/15', false, true),
  ('00000000-0000-4000-8000-000000d00114', 'Termografía de tableros', 'Instalaciones',
   null, 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00115', 'Calderas y termotanques', 'Instalaciones',
   'Registro ante GCBA con QR (desde 300 l o 50.000 kcal/h) y planilla de mantenimiento mensual', 'de_corresponder', 1, 'mes', 7, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00116', 'Limpieza de campana y conductos', 'Higiene',
   'Con QR, mensual; empresa inscripta en el registro de AGC', 'siempre', 1, 'mes', 7, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00117', 'Fumigación, desratización y desinfección', 'Higiene',
   null, 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00118', 'Limpieza de tanques de agua', 'Higiene',
   'Semestral', 'siempre', 6, 'mes', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00119', 'Análisis bacteriológico del agua', 'Higiene',
   null, 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00120', 'Carnets de manipulación de alimentos', 'Higiene',
   'Todo el personal que manipula alimentos', 'siempre', null, 'manual', 30, 'Guía orientativa AGC', false, true),
  ('00000000-0000-4000-8000-000000d00121', 'Permiso especial de show en vivo', 'Funcionamiento',
   null, 'de_corresponder', null, 'manual', 30, 'Guía orientativa AGC', false, true),

  -- Solapa 2: Protección del Trabajo (HyS). La 5 es la puesta a tierra de AGC.
  ('00000000-0000-4000-8000-000000d00201', 'Contrato / constancia de ART y nómina de personal', null,
   null, 'siempre', null, 'manual', 30, null, true, false),
  ('00000000-0000-4000-8000-000000d00202', 'Legajo técnico y mapa de riesgos / análisis de riesgos de la actividad', null,
   'Va en lugar del Programa de Seguridad, que es de obra', 'siempre', null, 'manual', 30, null, true, false),
  ('00000000-0000-4000-8000-000000d00203', 'RGRL (Relevamiento General de Riesgos Laborales)', null,
   null, 'siempre', null, 'manual', 30, null, true, false),
  ('00000000-0000-4000-8000-000000d00204', 'RAR (Relevamiento de Agentes de Riesgo)', null,
   null, 'siempre', null, 'manual', 30, null, true, false),
  ('00000000-0000-4000-8000-000000d00206', 'Iluminación', null,
   'Protocolo de medición', 'siempre', null, 'manual', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00207', 'Ruido', null,
   'Protocolo de medición', 'siempre', null, 'manual', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00208', 'Carga de fuego', null,
   'Estudio', 'siempre', null, 'manual', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00209', 'Control de luces de emergencia', null,
   'Planilla anual de control', 'siempre', 1, 'anio', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00210', 'Carga térmica y contaminantes', null,
   'Cocina: monóxido, vapores', 'de_corresponder', null, 'manual', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00211', 'Ergonomía', null,
   null, 'de_corresponder', null, 'manual', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00212', 'Capacitaciones', null,
   'Constancias y registros de asistencia', 'siempre', null, 'manual', 30, null, false, true),
  ('00000000-0000-4000-8000-000000d00213', 'Entrega de EPP y ropa de trabajo', null,
   'Constancias firmadas', 'siempre', null, 'manual', 30, null, true, false),
  ('00000000-0000-4000-8000-000000d00214', 'Exámenes médicos periódicos', null,
   'Solo constancia de aptitud, sin datos clínicos', 'siempre', null, 'manual', 30, null, true, false),
  ('00000000-0000-4000-8000-000000d00215', 'Registro de accidentes y denuncias a ART', null,
   null, 'siempre', null, 'manual', 30, null, true, false),

  -- Solapa 3: Autoprotección y simulacros
  ('00000000-0000-4000-8000-000000d00301', 'Disposición aprobatoria del Sistema de Autoprotección', null,
   'O declaración jurada, según corresponda al local', 'siempre', null, 'manual', 30, 'Ley 5920', false, true),
  ('00000000-0000-4000-8000-000000d00302', 'Informe descriptivo del Sistema de Autoprotección', null,
   null, 'siempre', null, 'manual', 30, 'Ley 5920', false, true),
  ('00000000-0000-4000-8000-000000d00303', 'Plano de evacuación visado', null,
   'Visible en el local y conforme a la realidad', 'siempre', null, null, 30, 'Ley 5920', false, true),
  ('00000000-0000-4000-8000-000000d00304', 'Roles y capacitación del personal designado', null,
   'Según el plan aprobado', 'siempre', null, 'manual', 30, 'Ley 5920', false, true),
  ('00000000-0000-4000-8000-000000d00305', 'Simulacros', null,
   'Acta o registro de cada uno, con fecha y asistentes', 'siempre', null, 'manual', 30, 'Ley 5920', false, true),

  -- Solapa 4: Residuos (ambiental). Toda a validar con el Ministerio de Espacio Público e Higiene Urbana.
  ('00000000-0000-4000-8000-000000d00401', 'Inscripción en el Registro de Generadores Especiales o constancia de dispensa', null,
   'La dispensa se tramita por TAD', 'de_corresponder', null, 'manual', 30, 'Ley 1854 y Res. 1177/MEPHUGC/23', true, false),
  ('00000000-0000-4000-8000-000000d00402', 'Contrato y constancias de retiro con operador privado de residuos húmedos', null,
   null, 'de_corresponder', null, 'manual', 30, 'Ley 1854 y Res. 1177/MEPHUGC/23', true, false),
  ('00000000-0000-4000-8000-000000d00403', 'Registro de generadores de aceites vegetales usados (AVU) y constancias de retiro', null,
   'Para locales que generan aceite de cocina usado', 'de_corresponder', null, 'manual', 30, 'Ley 1854 y Res. 1177/MEPHUGC/23', true, false);

-- En qué solapa va cada uno: el número del documento de la empresa es el orden dentro de la solapa.
insert into public.tipo_documento_solapa (tipo_documento_id, solapa, orden)
select t.id, s.solapa, s.orden
from public.tipo_documento t
cross join lateral (
  values (
    (case substr(t.id::text, 33, 2) when '01' then 'agc' when '02' then 'hys' when '03' then 'autoproteccion' else 'residuos' end)::public.solapa,
    substr(t.id::text, 35, 2)::int
  )
) as s(solapa, orden);

-- La puesta a tierra también va en HyS, en el lugar 5: un solo PDF para las dos solapas.
insert into public.tipo_documento_solapa (tipo_documento_id, solapa, orden)
values ('00000000-0000-4000-8000-000000d00113', 'hys', 5);
