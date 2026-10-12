# SCP Mantenimiento

Plataforma web para SCP, una empresa de mantenimiento integral de comercios y locales (obras, electricidad, plomería, gas, impermeabilizaciones, pintura, durlock) que trabaja con un abono mensual "todo incluido".

- **Supervisor (SCP):** carga elementos, vencimientos, visitas e informes desde el celular.
- **Cliente:** ve el estado de cumplimiento de sus locales, los informes, los certificados y la carpeta de inspección, y hace pedidos.

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres, Auth, Storage, RLS) · Vercel.

## Cómo verlo

```bash
npm install
npm run dev
```

Abrí <http://localhost:3000/s> (la app del supervisor) o <http://localhost:3000/login>. Por ahora funciona con **datos de ejemplo** (`src/lib/datos.ts`), con fechas relativas a hoy, y nada se guarda: Supabase viene en el paso siguiente.

| Pantalla | Ruta |
|---|---|
| Hoy | `/s` |
| Agenda de vencimientos | `/s/agenda` |
| Locales y ficha de local | `/s/locales`, `/s/locales/loc-1` |
| Ficha de elemento (tarjetas de control y QR) | `/s/elementos/el-1`, `/s/elementos/el-9` |
| Escanear QR | `/s/escanear` |
| Modo visita | `/s/visitas/vi-1` |
| Armar visita | `/s/visitas/nueva?local=loc-4` |
| Informe (publicado con subsanación / borrador) | `/s/informes/inf-1`, `/s/informes/inf-2` |
| Catálogo de controles | `/s/mas/catalogo` |
| Muestras del sistema de diseño | `/s/muestras` |
| Login | `/login` |

## Documentación

- [`docs/diseno.md`](docs/diseno.md): sistema de diseño (colores, tipografía, la tarjeta de control, reglas de textos).

- [`docs/proximos-pasos.md`](docs/proximos-pasos.md): lista de tareas de las próximas sesiones.
- [`docs/decisiones.md`](docs/decisiones.md): decisiones tomadas por el dueño (mandan sobre la propuesta).
- [`docs/autenticacion.md`](docs/autenticacion.md): usuarios, login y permisos con Supabase Auth y RLS.
- [`docs/propuesta-final.md`](docs/propuesta-final.md): propuesta consolidada de producto y arquitectura (auditoría de 5 propuestas y diseño final).
- [`docs/propuestas-agentes/`](docs/propuestas-agentes/): las 5 propuestas independientes originales.

## Estado

Etapa de diseño. Se construye primero la parte del supervisor y después la del cliente. Próximos pasos: subir a Vercel, la base de datos en Supabase, conectar las pantallas y el alta de locales (ver [`docs/proximos-pasos.md`](docs/proximos-pasos.md)).
