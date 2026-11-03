-- Usuarios de cliente, paso 1 de 2: el rol.
-- Va solo en su archivo porque un valor nuevo de un enum no se puede usar en la misma transacción en que se agrega.

alter type public.rol_usuario add value if not exists 'cliente';
