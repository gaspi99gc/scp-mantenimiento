# SCP Mantenimiento

Plataforma web para SCP, una empresa de mantenimiento integral de comercios y locales (obras, electricidad, plomería, gas, impermeabilizaciones, pintura, durlock) que trabaja con un abono mensual "todo incluido".

- **Supervisor (SCP):** ve qué vence y registra cada control desde el celular; la app calcula la próxima fecha.
- **Cliente:** ve el estado de cumplimiento de sus locales, los informes, los certificados y la carpeta de inspección, y hace pedidos.

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres, Auth, Storage, RLS) · Vercel.

## Cómo verlo

1. Un archivo `.env.local` en la raíz (no se sube a git) con:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...          # solo servidor
   DEV_ADMIN_EMAIL=...                        # tu usuario admin
   DEV_ADMIN_NOMBRE=...
   DEV_ADMIN_PASSWORD=...
   ```

2. Instalar y levantar:

   ```bash
   npm install
   npm run crear-admin      # la primera vez: crea tu usuario admin
   npm run cargar-ejemplo   # opcional: datos de ejemplo con fechas relativas a hoy (solo proyecto de desarrollo)
   npm run dev
   ```

3. Abrí <http://localhost:3000/login> y tocá **Entrar como admin (solo en esta compu)**. Ese botón existe solo con `npm run dev` y abriendo la app desde la misma compu (localhost). En Vercel se entra con usuario y contraseña (el usuario del admin es `admin`); se cambian en *Más → Usuarios*.

Los datos viven en Supabase: lo que registrás queda guardado. Con los datos de ejemplo cargados:

| Pantalla | Ruta |
|---|---|
| Agenda de vencimientos (inicio) | `/s/agenda` |
| Locales y ficha de local | `/s/locales`, `/s/locales/20000000-0000-4000-8000-000000000001` |
| Ficha de equipo (tarjetas de control y QR) | `/s/elementos/30000000-0000-4000-8000-000000000001`, o el QR `/e/q7f3k2` |
| Escanear QR | `/s/escanear` |
| Usuarios (solo admin) | `/s/mas/usuarios` |
| Catálogo de controles | `/s/mas/catalogo` |
| Login | `/login` |

### Base de datos

- Cambios de la base: `supabase/migrations/`, creados con `npx supabase migration new <nombre>` y aplicados con `npx supabase db push`.
- Pruebas de seguridad y de fechas: `npm run test:db` (corren contra el proyecto vinculado, sin Docker, y no dejan datos).
- Tipos de TypeScript de la base: `npx supabase gen types typescript --linked --schema public > src/lib/supabase/tipos-db.ts`.

## Documentación

- [`docs/diseno.md`](docs/diseno.md): sistema de diseño (colores, tipografía, la tarjeta de control, reglas de textos).

- [`docs/proximos-pasos.md`](docs/proximos-pasos.md): lista de tareas de las próximas sesiones.
- [`docs/decisiones.md`](docs/decisiones.md): decisiones tomadas por el dueño (mandan sobre la propuesta).
- [`docs/autenticacion.md`](docs/autenticacion.md): usuarios, login y permisos con Supabase Auth y RLS.
- [`docs/propuesta-final.md`](docs/propuesta-final.md): propuesta consolidada de producto y arquitectura (auditoría de 5 propuestas y diseño final).
- [`docs/propuestas-agentes/`](docs/propuestas-agentes/): las 5 propuestas independientes originales.

## Estado

Núcleo simple (decisión D18) conectado a Supabase: login y usuarios (solo SCP), Agenda, locales, equipos con sus tarjetas de control, registrar un control, cambio de cilindro, escanear QR, pedidos y catálogo. Visitas, informes con PDF y fotos quedan para más adelante.
