# Próximos pasos

> Actualizado el 02/11/2026. La app funciona con Supabase y login (admin y supervisores). Se avanza de a un punto por vez.
> Varias ideas salen de **Lasia** (la app de la empresa de limpieza, `Documents/Lasia-Limpieza`), que ya las tiene resueltas: se toma cómo lo resolvió y se arma en SCP con su diseño y su seguridad, sin copiar pantallas enteras.

## Hecho

- [x] Alta de clientes y locales.
- [x] Alta de equipos con su QR.

## Ahora, en este orden

1. [ ] **Cargar la fecha actual de cada control** (relevamiento): la que dice la tarjeta o el certificado, para que deje de estar "sin datos". Sin esto, un local real queda todo en rojo.
2. [ ] **Marcar "no aplica"** un control, con motivo, y **deshacer un registro equivocado**.
3. [ ] **Avisos al celular de los vencimientos** (como Lasia: 7 días antes, 2 días antes y el mismo día, hasta que se registra). Le llegan al supervisor responsable del local.
4. [ ] **Exportar la agenda a Excel**, con los filtros que estén puestos.
5. [ ] **Pedidos de los clientes** (como los pedidos de Lasia que ve el supervisor técnico):
   - usuarios para los clientes, que ven solo sus locales;
   - el cliente carga un pedido desde su celular y le avisa al supervisor;
   - el supervisor lo toma, le cambia el estado y el cliente ve cómo va;
   - también cargar a mano los que llegan por WhatsApp o por teléfono.
6. [ ] **Informes en PDF** del local por período, para descargar o compartir.
7. [x] **Catálogo editable** por el admin: tipos de control, períodos y a qué equipos se aplican.
8. [ ] **Borrar los datos de ejemplo** cuando se empiecen a cargar los reales.

## Antes de cargar datos reales de clientes

- [ ] Cambiar la contraseña `admin01` por una larga (Más → Usuarios → Cambiar mi usuario o contraseña).
- [ ] Límite de intentos en el login.
- [ ] Decidir si se sigue con este proyecto de Supabase o se arma uno aparte para producción (hoy la compu y Vercel usan la misma base).
- [ ] En Supabase → Authentication → Providers → Email: largo mínimo de contraseña 10.
- [ ] Supabase gratis pausa el proyecto si pasa una semana sin uso. Con uso real no pasa; si molesta, el plan Pro lo evita.

## Más adelante

- [ ] **Entrar con huella o cara** del celular (Lasia lo tiene armado, aunque no se usó).
- [ ] **KPIs**, un tablero con números, cuando haya trabajo real cargado.
- [ ] Fotos de las tarjetas y certificados al registrar.
- [ ] Doble factor para el admin.

## Descartado

- Mapa de locales: no aporta al trabajo diario.
