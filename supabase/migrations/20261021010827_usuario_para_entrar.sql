-- Se puede entrar con un nombre de usuario corto ("admin") además del email.
-- Supabase Auth trabaja con email: el servidor busca el email de ese usuario y entra con él.

alter table public.perfil
  add column usuario text unique check (usuario ~ '^[a-z0-9._-]{3,30}$');

comment on column public.perfil.usuario is
  'Nombre para entrar sin escribir el email. Minúsculas, números, punto, guion o guion bajo; de 3 a 30 caracteres.';
