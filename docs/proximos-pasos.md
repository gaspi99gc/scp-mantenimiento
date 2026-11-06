# Próximos pasos

> Actualizado el 05/11/2026. La app funciona con Supabase y login (admin y supervisores). Se avanza de a un punto por vez.
> Varias ideas salen de **Lasia** (la app de la empresa de limpieza, `Documents/Lasia-Limpieza`), que ya las tiene resueltas: se toma cómo lo resolvió y se arma en SCP con su diseño y su seguridad, sin copiar pantallas enteras.

## Hecho

- [x] Alta de clientes y locales.
- [x] Alta de equipos con su QR.

## Ahora: documentos para inspecciones (pedido de la empresa)

Siete sprints, en este orden. El detalle de cada uno está en [`plan-documentos.md`](plan-documentos.md), con la lista de cada punto del documento de la empresa.

1. [x] **Sprint 1** (05/11): catálogo y lista de documentos por local, con las 4 solapas y "De corresponder".
2. [ ] **Sprint 2:** subir los PDF, con historial, vencimiento y "Otros documentos".
3. [ ] **Sprint 3:** el cliente ve sus documentos con el semáforo.
4. [ ] **Sprint 4:** tarjeta con QR y NFC, y carpeta del inspector.
5. [ ] **Sprint 5:** conectar los controles con los documentos, más el relevamiento y "no aplica" de los controles (los puntos 1 y 2 de abajo).
6. [ ] **Sprint 6:** checklist del local, con fotos.
7. [ ] **Sprint 7:** Agenda con documentos y avisos al celular (el punto 3 de abajo).

## Lo que ya estaba (se reparte en los sprints)

1. [ ] **Cargar la fecha actual de cada control** (relevamiento): la que dice la tarjeta o el certificado, para que deje de estar "sin datos". Sin esto, un local real queda todo en rojo.
2. [ ] **Marcar "no aplica"** un control, con motivo, y **deshacer un registro equivocado**.
3. [ ] **Avisos al celular de los vencimientos** (como Lasia: 7 días antes, 2 días antes y el mismo día, hasta que se registra). Le llegan al supervisor responsable del local.
4. [ ] **Exportar la agenda a Excel**, con los filtros que estén puestos.
5. [x] **App del cliente** (03/11): ve el estado de sus locales, solo para leer. Sus usuarios se crean en la ficha del cliente (D19). No hay pedidos (D21).
6. [ ] **Informes en PDF** del local por período, para descargar o compartir.
7. [x] **Catálogo editable** por el admin: tipos de control, períodos y a qué equipos se aplican.
8. [x] **Borrar los datos de ejemplo** (hecho el 02/11: quedan solo los usuarios y el catálogo).

## Antes de cargar datos reales de clientes

- [ ] Cambiar la contraseña `admin01` por una larga (Más → Usuarios → Cambiar mi usuario o contraseña).
- [ ] Límite de intentos en el login.
- [ ] Decidir si se sigue con este proyecto de Supabase o se arma uno aparte para producción (hoy la compu y Vercel usan la misma base).
- [ ] En Supabase → Authentication → Providers → Email: largo mínimo de contraseña 10, y activar "Leaked password protection" (lo marca el revisor de seguridad; requiere plan Pro).
- [ ] Supabase gratis pausa el proyecto si pasa una semana sin uso. Con uso real no pasa; si molesta, el plan Pro lo evita.

## Más adelante

- [ ] **Entrar con huella o cara** del celular (Lasia lo tiene armado, aunque no se usó).
- [ ] **KPIs**, un tablero con números, cuando haya trabajo real cargado.
- [ ] Fotos de las tarjetas y certificados al registrar.
- [ ] Doble factor para el admin.

## Descartado

- Mapa de locales: no aporta al trabajo diario.
