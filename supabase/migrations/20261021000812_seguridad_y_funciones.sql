-- Seguridad (RLS y privilegios) y las dos operaciones de la base:
-- registrar un control y cambiar el cilindro de un equipo.
--
-- Regla general: sin sesión no se ve nada. El staff activo (admin o supervisor) que ya eligió
-- su contraseña ve y carga lo operativo; solo el admin toca el catálogo. Los usuarios se crean
-- y modifican desde el servidor con la clave secreta, después de verificar que quien pide es admin.

-- ——— Quién es quién ———

create function app.es_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and not debe_cambiar_clave
  );
$$;

create function app.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.perfil
    where id = auth.uid() and activo and not debe_cambiar_clave and rol = 'admin'
  );
$$;

grant usage on schema app to authenticated;
grant execute on function app.es_staff(), app.es_admin(), app.hoy() to authenticated;

-- ——— RLS en todas las tablas ———

alter table public.perfil              enable row level security;
alter table public.cliente             enable row level security;
alter table public.local               enable row level security;
alter table public.tipo_equipo         enable row level security;
alter table public.tipo_control        enable row level security;
alter table public.tipo_control_equipo enable row level security;
alter table public.equipo              enable row level security;
alter table public.unidad              enable row level security;
alter table public.control             enable row level security;
alter table public.registro            enable row level security;
alter table public.pedido              enable row level security;

-- Nada para anon. Por las dudas, se revoca explícito.
revoke all on all tables in schema public from anon;

-- perfil: cada uno ve el suyo; el staff ve todos. Nadie escribe desde la app (solo el servidor, con la clave secreta).
grant select on public.perfil to authenticated;
create policy perfil_leer on public.perfil for select to authenticated
  using (id = (select auth.uid()) or (select app.es_staff()));

-- Catálogo: lo lee el staff; lo escribe solo el admin.
grant select, insert, update on public.tipo_equipo, public.tipo_control to authenticated;
grant select, insert, delete on public.tipo_control_equipo to authenticated;

create policy tipo_equipo_leer on public.tipo_equipo for select to authenticated using ((select app.es_staff()));
create policy tipo_equipo_crear on public.tipo_equipo for insert to authenticated with check ((select app.es_admin()));
create policy tipo_equipo_editar on public.tipo_equipo for update to authenticated
  using ((select app.es_admin())) with check ((select app.es_admin()));

create policy tipo_control_leer on public.tipo_control for select to authenticated using ((select app.es_staff()));
create policy tipo_control_crear on public.tipo_control for insert to authenticated with check ((select app.es_admin()));
create policy tipo_control_editar on public.tipo_control for update to authenticated
  using ((select app.es_admin())) with check ((select app.es_admin()));

create policy tce_leer on public.tipo_control_equipo for select to authenticated using ((select app.es_staff()));
create policy tce_crear on public.tipo_control_equipo for insert to authenticated with check ((select app.es_admin()));
create policy tce_borrar on public.tipo_control_equipo for delete to authenticated using ((select app.es_admin()));

-- Operativas: el staff lee y carga. Las columnas que no se editan a mano quedan afuera del UPDATE.
grant select, insert on public.cliente, public.local, public.equipo, public.pedido to authenticated;
grant update (nombre, razon_social, cuit) on public.cliente to authenticated;
grant update (cliente_id, nombre, direccion, barrio, rubro, horario_acceso, requisitos_acceso,
              encargado_nombre, encargado_telefono, supervisor_id) on public.local to authenticated;
grant update (codigo, ubicacion, detalle, estado) on public.equipo to authenticated;
grant update (titulo, detalle, urgencia, estado, resuelto_en) on public.pedido to authenticated;

-- La primera unidad se carga al dar de alta el equipo; los cambios van por reemplazar_unidad().
grant select, insert on public.unidad to authenticated;
-- Los controles los crean los triggers; a mano solo se marca "no aplica" o se reactiva.
grant select on public.control to authenticated;
grant update (estado, motivo_estado) on public.control to authenticated;
-- El historial solo se escribe con registrar_control().
grant select on public.registro to authenticated;

create policy cliente_staff on public.cliente for all to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));
create policy local_staff on public.local for all to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));
create policy equipo_staff on public.equipo for all to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));
create policy pedido_staff on public.pedido for all to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));
create policy unidad_staff on public.unidad for all to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));
create policy control_staff on public.control for all to authenticated
  using ((select app.es_staff())) with check ((select app.es_staff()));
create policy registro_leer on public.registro for select to authenticated using ((select app.es_staff()));

-- ——— Operaciones ———

-- Suma el período de un tipo de control a una fecha. Postgres recorta a fin de mes (31/08 + 6 meses = 28/02).
create function app.sumar_periodo(p_fecha date, p_valor int, p_unidad public.periodo_unidad) returns date
language sql immutable set search_path = '' as $$
  select case p_unidad
    when 'dia'  then p_fecha + p_valor
    when 'mes'  then (p_fecha + make_interval(months => p_valor))::date
    when 'anio' then (p_fecha + make_interval(years => p_valor))::date
    else null
  end;
$$;

-- Registrar que se hizo (o no) un control. Calcula el nuevo vencimiento con la misma regla que
-- proponerVencimiento() de src/lib/fechas.ts, actualiza el control y guarda el registro, todo junto.
create function app.registrar_control(
  p_control       uuid,
  p_fecha         date,
  p_resultado     public.resultado_registro,
  p_ejecutor      text,
  p_oblea         text default null,
  p_nota          text default null,
  p_fecha_tarjeta date default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_control  public.control;
  v_tipo     public.tipo_control;
  v_nuevo    date;
  v_origen   public.origen_registro := 'calculado';
  v_desde    date;
  v_id       uuid;
begin
  if not app.es_staff() then
    raise exception 'No tenés permiso para registrar controles.' using errcode = '42501';
  end if;
  if p_fecha is null or p_fecha > app.hoy() then
    raise exception 'La fecha del trabajo no puede ser posterior a hoy.' using errcode = '22023';
  end if;
  if coalesce(trim(p_ejecutor), '') = '' then
    raise exception 'Falta quién hizo el trabajo.' using errcode = '22023';
  end if;

  -- Bloquea el control: dos registros a la vez no se pisan.
  select * into v_control from public.control where id = p_control for update;
  if not found then
    raise exception 'El control no existe.' using errcode = 'P0002';
  end if;
  if v_control.estado <> 'activo' then
    raise exception 'Este control está marcado como "no aplica".' using errcode = '22023';
  end if;
  select * into v_tipo from public.tipo_control where id = v_control.tipo_control_id;

  if p_resultado in ('ok', 'reemplazo', 'observado') then
    if p_fecha_tarjeta is not null then
      v_nuevo := p_fecha_tarjeta;
      v_origen := 'certificado';
    elsif v_tipo.periodo_unidad = 'manual' then
      raise exception 'Este control vence según el documento: cargá la fecha que dice.' using errcode = '22023';
    else
      v_desde := p_fecha;
      -- Calendario fijo: se cuenta desde el vencimiento anterior, salvo que eso ya haya pasado.
      if v_tipo.base = 'desde_vencimiento' and v_control.vencimiento is not null then
        v_nuevo := app.sumar_periodo(v_control.vencimiento, v_tipo.periodo_valor, v_tipo.periodo_unidad);
        if v_nuevo < app.hoy() then
          v_nuevo := null;
        end if;
      end if;
      v_nuevo := coalesce(v_nuevo, app.sumar_periodo(v_desde, v_tipo.periodo_valor, v_tipo.periodo_unidad));
    end if;

    update public.control
      set vencimiento = v_nuevo, ultima_fecha = p_fecha, ultimo_ejecutor = trim(p_ejecutor)
      where id = p_control;
  end if;

  insert into public.registro (control_id, local_id, fecha, resultado, origen, ejecutor, oblea, nota,
                               vencimiento_anterior, vencimiento_nuevo)
  values (p_control, v_control.local_id, p_fecha, p_resultado, v_origen, trim(p_ejecutor),
          nullif(trim(p_oblea), ''), nullif(trim(p_nota), ''), v_control.vencimiento, v_nuevo)
  returning id into v_id;

  return v_id;
end;
$$;

-- Cambiar el cilindro de un equipo: retira el actual, instala el nuevo y recalcula los controles
-- que dependen de la unidad (vida útil, prueba hidráulica) desde la fecha de fabricación.
create function app.reemplazar_unidad(
  p_equipo       uuid,
  p_serie        text,
  p_fabricacion  date,
  p_desde        date
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_actual  public.unidad;
  v_id      uuid;
begin
  if not app.es_staff() then
    raise exception 'No tenés permiso para cambiar unidades.' using errcode = '42501';
  end if;
  if coalesce(trim(p_serie), '') = '' or p_fabricacion is null or p_desde is null then
    raise exception 'Faltan el número de serie, la fabricación o la fecha de cambio.' using errcode = '22023';
  end if;
  if p_desde > app.hoy() or p_fabricacion > p_desde then
    raise exception 'Revisá las fechas: el cambio no puede ser futuro ni anterior a la fabricación.' using errcode = '22023';
  end if;
  perform 1 from public.equipo where id = p_equipo for update;
  if not found then
    raise exception 'El equipo no existe.' using errcode = 'P0002';
  end if;

  select * into v_actual from public.unidad where equipo_id = p_equipo and retirada_en is null;
  if found then
    if p_desde < v_actual.instalada_desde then
      raise exception 'La fecha de cambio es anterior a la instalación de la unidad actual.' using errcode = '22023';
    end if;
    update public.unidad set retirada_en = p_desde where id = v_actual.id;
  end if;

  insert into public.unidad (equipo_id, serie, fabricacion, instalada_desde)
  values (p_equipo, trim(p_serie), p_fabricacion, p_desde)
  returning id into v_id;

  update public.control c
    set vencimiento = app.sumar_periodo(p_fabricacion, t.periodo_valor, t.periodo_unidad),
        ultima_fecha = p_fabricacion,
        ultimo_ejecutor = null
    from public.tipo_control t
    where c.equipo_id = p_equipo and t.id = c.tipo_control_id and t.depende_de_unidad
      and t.periodo_unidad <> 'manual';

  return v_id;
end;
$$;

-- El propio usuario marca que ya eligió su contraseña (después de cambiarla en Supabase Auth).
create function app.marcar_clave_cambiada() returns void
language sql security definer set search_path = '' as $$
  update public.perfil set debe_cambiar_clave = false where id = auth.uid() and activo;
$$;

revoke execute on function app.sumar_periodo(date, int, public.periodo_unidad),
  app.registrar_control(uuid, date, public.resultado_registro, text, text, text, date),
  app.reemplazar_unidad(uuid, text, date, date),
  app.marcar_clave_cambiada() from public, anon;
grant execute on function app.registrar_control(uuid, date, public.resultado_registro, text, text, text, date),
  app.reemplazar_unidad(uuid, text, date, date),
  app.marcar_clave_cambiada() to authenticated;

-- Envoltorios en public para llamarlos desde la app con supabase.rpc(). Corren con los permisos
-- de quien llama; la lógica y los chequeos están en el esquema app, que no se publica en la API.
create function public.registrar_control(
  p_control uuid, p_fecha date, p_resultado public.resultado_registro, p_ejecutor text,
  p_oblea text default null, p_nota text default null, p_fecha_tarjeta date default null
) returns uuid
language sql security invoker set search_path = '' as $$
  select app.registrar_control(p_control, p_fecha, p_resultado, p_ejecutor, p_oblea, p_nota, p_fecha_tarjeta);
$$;

create function public.reemplazar_unidad(p_equipo uuid, p_serie text, p_fabricacion date, p_desde date) returns uuid
language sql security invoker set search_path = '' as $$
  select app.reemplazar_unidad(p_equipo, p_serie, p_fabricacion, p_desde);
$$;

create function public.marcar_clave_cambiada() returns void
language sql security invoker set search_path = '' as $$
  select app.marcar_clave_cambiada();
$$;

revoke execute on function public.registrar_control(uuid, date, public.resultado_registro, text, text, text, date),
  public.reemplazar_unidad(uuid, text, date, date),
  public.marcar_clave_cambiada() from public, anon;
grant execute on function public.registrar_control(uuid, date, public.resultado_registro, text, text, text, date),
  public.reemplazar_unidad(uuid, text, date, date),
  public.marcar_clave_cambiada() to authenticated;
