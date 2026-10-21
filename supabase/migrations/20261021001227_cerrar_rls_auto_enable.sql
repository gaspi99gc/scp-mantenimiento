-- La función que activa RLS en cada tabla nueva (opción 'Enable automatic RLS' del proyecto) la crea
-- Supabase en public y queda llamable por la API. Se dispara como event trigger, que no necesita
-- el permiso EXECUTE, así que se le saca a todos sin perder la protección automática.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
