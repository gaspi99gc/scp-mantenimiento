# Decisiones tomadas

> Registro de lo que definió el dueño. **Si algo de `propuesta-final.md` contradice este archivo, manda este archivo.**

| # | Fecha | Tema | Decisión |
|---|---|---|---|
| D1 | 12/10/2026 | **Stack** | **Next.js** (App Router, TypeScript) + **Supabase** (Postgres, Auth, Storage) + **Vercel**, con dominio propio. Reemplaza a Django/HTMX de la v1.0 |
| D2 | 12/10/2026 | **Usuarios** | Se planifican desde el principio con Supabase Auth y RLS. Ver [`autenticacion.md`](autenticacion.md) |
| D3 | 12/10/2026 | **Controles de un elemento** | Todos los controles de un elemento (por ejemplo recarga, prueba hidráulica y vida útil del matafuego) se ven y se registran **en la pantalla del elemento** |
| D4 | 12/10/2026 | **Informes** | Un informe publicado **no se edita**. Si hay un error se **subsana**: se agrega una subsanación (motivo, corrección, adjuntos) y el original queda intacto |
| D5 | 12/10/2026 | **Carpeta de inspección con QR** | Aprobada |
| D6 | 12/10/2026 | **Resumen mensual** para el cliente | Aprobado |
| D7 | 12/10/2026 | **Recálculo del matafuego** | El nuevo vencimiento se cuenta **desde el día trabajado** |
| D8 | 12/10/2026 | **Periodicidades** | Son **las de la norma** de cada control. El catálogo guarda la referencia normativa |
| D9 | 12/10/2026 | **Transparencia** | El cliente ve **todo, siempre**, incluso lo vencido. El objetivo es que no pase: para eso pagan el abono |
| D10 | 12/10/2026 | **Orden de construcción** | Primero **solo el supervisor**. La vista del cliente viene después |
| D11 | 12/10/2026 | **Resto de la propuesta** | Aprobado como estaba: puesto vs. unidad, evidencia obligatoria, obras con garantía, estacionales. *"Armar visita", "ya que vas", visita fallida y horas por visita quedan reemplazados por D12* |
| D12 | 20/10/2026 | **Sin visitas** | El supervisor va, hace el trabajo y lo registra suelto en la ficha del equipo o del local. No se planifican ni se inician visitas en la app |
| D13 | 20/10/2026 | **Informe por período** | El informe junta lo registrado en un local entre dos fechas que elige el supervisor. Puede haber varios informes que cubran los mismos días |
| D14 | 20/10/2026 | **Publicar** | Congela el informe, le asigna número y genera un PDF que el supervisor descarga o comparte. Cuando exista la app del cliente, también aparece ahí |
| D15 | 20/10/2026 | **Controles por local** | Todos los locales llevan todo: se crean todos los controles que aplican y lo que no aplica se marca "no aplica" con motivo |
| D16 | 20/10/2026 | **Usuarios** | Por ahora solo SCP (admin y supervisores), creados por el admin. Ingreso rápido de admin solo en desarrollo. La base queda lista para usuarios de cliente |
| D17 | 20/10/2026 | **Alcance de la base** | Primera versión con solo lo que usan las pantallas. Ver [`superpowers/specs/2026-10-20-base-datos-y-usuarios-design.md`](superpowers/specs/2026-10-20-base-datos-y-usuarios-design.md) |
| D18 | 20/10/2026 | **Núcleo simple** | Se limpia la app para quedarse con lo básico y sumar de a una: se van la pestaña Hoy (el inicio es la Agenda), las visitas, los informes con PDF y las fotos/evidencia al registrar. Quedan locales, equipos, registrar controles, QR, cambio de cilindro, pedidos, catálogo, login y usuarios. Reemplaza a D13, D14 y D17 y al diseño de 18 tablas |

## Interpretaciones a confirmar

- **D4, "subsanar":** lo interpreté como un agregado debajo del informe original, visible para el cliente, y el PDF se vuelve a generar con la subsanación al pie. Si la idea era otra (por ejemplo, que la subsanación sea un informe nuevo que referencia al anterior), avisar antes de diseñar la tabla.
- **D10, supervisores:** en la fase 1, **todos los supervisores ven y cargan todos los locales** (equipo chico). Cada local tiene un supervisor responsable, que es quien recibe los avisos. Si más adelante se necesita que cada supervisor vea solo su cartera, se cambia una política de RLS sin tocar el resto.

## Preguntas que siguen abiertas

- P4: ¿qué hace SCP y qué terceriza? ¿Quién firma cada certificado?
- P5: ¿qué incluye el abono y qué es extra? ¿Las obras entran?
- P6: ¿qué SLA se compromete? ¿Hay guardia 24 h?
- P8: ¿la firma del encargado es obligatoria en cada visita?
- P9: ¿cuántos clientes, locales y supervisores hay hoy y en qué jurisdicciones?
- P10: ¿dónde están hoy los datos (Excel, Drive, papel)? ¿Hay un formato de informe para replicar?
- P11: ¿el canal con los clientes es WhatsApp? ¿Desde qué número?
- P12: ¿alguna cadena exige cargar datos en su propio portal de proveedores?
