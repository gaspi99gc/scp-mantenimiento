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
| D11 | 12/10/2026 | **Resto de la propuesta** | Aprobado como estaba: puesto vs. unidad, "Armar visita" / "ya que vas", visita fallida, evidencia obligatoria, obras con garantía, estacionales, horas y materiales por visita |

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
