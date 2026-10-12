# Próximos pasos

> Lista de trabajo para las próximas sesiones, armada el 12/10/2026. Está ordenada por dependencia: la base de datos va antes que los botones y que el alta de locales. Vercel se puede hacer en cualquier momento.

## 0. Decisiones del dueño antes de diseñar la base

Cambian las tablas, así que conviene tenerlas antes del bloque 2.

- [ ] **Qué controles lleva cada local.** En general todos los locales hacen todo. Falta definir si "todo" es el catálogo completo o depende del rubro: una óptica no tiene campana ni grasera. Propuesta: una plantilla por rubro con todo marcado, y en cada local se destilda lo que no aplica.
- [ ] **P5, abono:** qué incluye y qué es extra. Define la tabla `abono`; si no está claro, esa tabla puede esperar.
- [ ] **P8, firma del encargado:** si es obligatoria para cerrar una visita.
- [ ] **P10, datos actuales:** dónde están hoy (Excel, Drive, papel). Define si hace falta importar desde Excel o alcanza con cargar a mano.

Las demás preguntas abiertas están en [`decisiones.md`](decisiones.md).

## 1. Subir a Vercel

No depende de nada. Se puede hacer ya, con los datos de ejemplo, para probar la app desde el celular en cualquier lado. `npm run typecheck` pasa sin errores.

- [ ] Correr `npm run build` local y confirmar que pasa.
- [ ] Entrar a Vercel con la cuenta de GitHub e importar `gaspi99gc/scp-mantenimiento`.
- [ ] Probar la URL desde el celular con datos móviles.
- [ ] Más adelante: dominio propio y las variables de entorno de Supabase (bloque 2).

A tener en cuenta:

- La URL es pública. Con datos de ejemplo no importa, pero **no cargar datos reales hasta que el login funcione** (bloque 2).
- El plan Hobby (gratis) sirve para desarrollar y probar. Cuando SCP lo use con clientes corresponde el plan Pro (ver §8 de [`propuesta-final.md`](propuesta-final.md)).

**Listo cuando:** la app abre desde el celular, fuera del Wi-Fi de la casa, en la URL de Vercel, y cada push a `main` se publica solo.

## 2. Base de datos en Supabase

El esquema está en §11 de [`propuesta-final.md`](propuesta-final.md), el recálculo de vencimientos en §3.3 y los permisos en [`autenticacion.md`](autenticacion.md).

- [ ] Crear el proyecto en Supabase (región São Paulo, la más cercana).
- [ ] Revisar el esquema de §11 antes de escribir las migraciones: restricciones, índices y seguridad de las migraciones.
- [ ] Migraciones versionadas en `supabase/migrations/` con Supabase CLI. RLS en todas las tablas.
- [ ] Funciones de Postgres: `registrar_ejecucion`, `anular_ejecucion`, `publicar_informe` y `subsanar_informe`. El recálculo corre en una sola transacción.
- [ ] Catálogo inicial de controles según norma (§3.4) y plantillas por rubro.
- [ ] Datos de ejemplo (seed) a partir de `src/lib/datos.ts`. Completar lo que falta: los matafuegos de Almagro, del shopping y de Belgrano solo tienen la recarga, y les faltan la prueba hidráulica y la vida útil.
- [ ] Tests del recálculo (fin de mes, 29/02, anulación, prueba hidráulica que cumple la recarga) y de las políticas RLS.
- [ ] Bucket privado `adjuntos` en Storage para fotos, firmas y certificados.
- [ ] Login del supervisor con Supabase Auth. Variables de entorno en `.env.local` y en Vercel; la clave `service_role` nunca va al navegador.

**Listo cuando:** el supervisor entra con su usuario y, sin sesión, no se puede leer ningún dato.

## 3. Conectar las pantallas para que guarden

Hoy los formularios andan, pero todo vive en la pantalla y se pierde al recargar. En el código hay unas 40 marcas `TODO(supabase)` que dicen qué falta en cada lugar. Las funciones de `src/lib/datos.ts` pasan a ser consultas a la base con las mismas firmas, así las pantallas casi no cambian.

- [ ] **Login:** entrar, cerrar sesión, recuperar la contraseña y saltar el login si ya hay sesión.
- [ ] **Armar visita:** crea la visita programada y sus controles quedan marcados como programados.
- [ ] **Modo visita:** check-in, registrar cada control, deshacer un registro (anular), visita fallida con foto y motivo, y cierre con firma, horas y trabajos.
- [ ] **Ficha de elemento y controles del local:** registrar controles y reemplazar la unidad (matafuego nuevo).
- [ ] **Informe:** el borrador se arma solo al cerrar la visita. Publicar (número, PDF y hash), subsanar y descargar el PDF.
- [ ] **Fotos:** se comprimen en el celular y se suben a Storage.
- [ ] Para después: exportar la agenda a Excel y cargar pedidos que llegan por WhatsApp o por teléfono.

**Listo cuando:** se registra una recarga, se recarga la página y sigue registrada con su vencimiento nuevo.

## 4. Catálogo de controles editable

Hoy *Más → Catálogo de controles* solo muestra los 11 controles de ejemplo. Tiene que poder editarse y aceptar controles nuevos, porque es la lista de "todo" que usa el alta de locales (bloque 5). Lo edita solo el admin; los supervisores lo ven.

- [ ] **Editar un control:** nombre, a qué se aplica (un tipo de elemento o el local), período (o "manual", cuando la fecha la da el certificado), desde cuándo se cuenta (día trabajado o vencimiento anterior), días de aviso, quién lo hace (SCP o un tercero), norma y evidencia obligatoria.
- [ ] **Agregar un control nuevo** con esos mismos datos.
- [ ] **Desactivar en lugar de borrar**, así no se pierde el historial de lo que ya se registró.
- [ ] **Cambio de período:** no reescribe la historia y rige desde la próxima renovación. Para los vencimientos que ya están abiertos, una acción "Recalcular abiertos" que muestra antes qué fechas cambian (§3.3 de [`propuesta-final.md`](propuesta-final.md)).
- [ ] **Decidir:** cuando se agrega un control nuevo, si se suma solo a todos los locales que corresponden. Si se suma, en esos locales arranca como "sin datos", que cuenta como rojo, hasta que se cargue la primera fecha.

**Listo cuando:** el admin agrega un control desde el celular y aparece en el alta de un local nuevo.

## 5. Alta de locales y controles de cada local

Hoy los botones "Agregar local" y "Agregar elemento" no hacen nada, y no hay forma de cargar un local real. El bloque 3 y los bloques 4 y 5 se pueden hacer en cualquier orden; si se quiere cargar locales reales cuanto antes, conviene empezar por 4 y 5.

Como casi todos los locales hacen todo, el alta arranca con todo marcado y el supervisor solo destilda las excepciones.

- [ ] **Datos del local:** cliente, dirección, rubro, horario y requisitos de acceso, encargado y supervisor responsable.
- [ ] **Controles del local:** la lista del catálogo (o la plantilla del rubro), con todo marcado. Se destilda lo que no aplica.
- [ ] **Inventario:** cuántos hay de cada elemento (por ejemplo, 4 matafuegos y 1 tanque), con código y ubicación. Cada elemento recibe sus controles solo: un matafuego lleva recarga, prueba hidráulica y vida útil.
- [ ] **Fecha del último control** de cada uno, sacada de la tarjeta o el certificado. Lo que no tenga fecha queda "sin datos", que cuenta como rojo.
- [ ] **Etiquetas QR** de todo el local en un PDF para imprimir.
- [ ] **Cambios después del alta:** agregar o quitar controles desde la ficha del local, y suspenderlos con motivo (por ejemplo, local cerrado por refacción).

**Listo cuando:** se da de alta un local real desde el celular y aparece en Hoy y en Agenda con sus vencimientos.

## Detalles chicos

- [ ] *Más → Muestras del sistema de diseño* es una página de referencia para quien arma las pantallas, no para el supervisor. Cuando haya usuarios reales, mostrarla solo en desarrollo o al admin.
- [ ] En pantallas angostas, los códigos largos se cortan en el guion: "SCP-2026-" queda en un renglón y "000118" en el siguiente. Pasa lo mismo con "C-700112" en el modo visita.
