-- "Requisitos para entrar" pasa a ser "Observaciones": lo que convenga saber del local (llaves, permisos, horarios especiales).
alter table public.local rename column requisitos_acceso to observaciones;
