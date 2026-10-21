# Próximos pasos

> Actualizado el 21/10/2026. La app ya funciona con Supabase y login (admin y supervisores). Se avanza de a un punto por vez.

## Ahora, en este orden

1. [x] **Alta de clientes y locales.** El botón "Agregar local" crea el cliente (o elige uno existente) y el local; el local recibe solo sus controles.
2. [x] **Alta de equipos con su QR.** "Agregar elemento" en la ficha del local; el equipo recibe solo sus controles; etiqueta QR para imprimir.
3. [ ] **Cargar la fecha actual de cada control** (relevamiento): la que dice la tarjeta o el certificado, para que deje de estar "sin datos".
4. [ ] **Marcar "no aplica"** un control, con motivo.
5. [ ] **Deshacer un registro equivocado.**
6. [ ] **Pedidos:** cargarlos (por ejemplo, los que llegan por WhatsApp) y cambiarles el estado.
7. [ ] **Catálogo editable** por el admin: tipos de control, períodos y a qué equipos se aplican.
8. [ ] **Borrar los datos de ejemplo** cuando se empiecen a cargar los reales.

## Antes de cargar datos reales de clientes

- [ ] Cambiar la contraseña `admin01` por una larga (Más → Usuarios → Cambiar mi usuario o contraseña).
- [ ] Límite de intentos en el login.
- [ ] Decidir si se sigue con este proyecto de Supabase o se arma uno aparte para producción (hoy la compu y Vercel usan la misma base).
- [ ] En Supabase → Authentication → Providers → Email: largo mínimo de contraseña 10.

## Pendientes para más adelante

- [ ] Informes del local por período, con PDF para descargar o compartir.
- [ ] Fotos de las tarjetas y certificados al registrar.
- [ ] Exportar la agenda a Excel.
- [ ] Usuarios para los clientes (que cada cliente vea solo sus locales).
- [ ] Doble factor para el admin.
