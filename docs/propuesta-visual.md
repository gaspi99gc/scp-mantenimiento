# Propuesta visual A: "Oficio"

## La idea

La app es la carpeta de inspección del supervisor: planillas impresas con renglones y un filete grueso arriba, tarjetas de control con su ojal y la tira de meses perforada, chapas grabadas para los códigos y rótulos negros como los de un tablero eléctrico. Los colores de seguridad (IRAM 10005) se usan como en un cartel: el color de fondo con su color de contraste encima, y en ningún otro lado. Todo lo demás es tinta negra sobre papel blanco, sobre una pared gris.

## Tokens

### Color

| Token | Hex | Uso | Contraste |
|---|---|---|---|
| `yeso` | `#E4E5E1` | Fondo (pared de revoque, gris neutro, no crema) | — |
| `papel` | `#FBFBF9` | Planillas, tarjetas, hojas | — |
| `tinta` | `#16181B` | Texto, acción principal, navegación, chapas | 17,2:1 sobre papel; 14,1:1 sobre yeso |
| `cemento` | `#565A60` | Texto secundario | 6,7:1 sobre papel; 5,5:1 sobre yeso |
| `junta` | `#C8CAC5` | Renglones y bordes de planilla (no de campos) | 1,6:1 (decorativo) |
| `borde` | `#868A8F` | Borde de campos y controles | 3,4:1 sobre papel (WCAG 1.4.11) |
| `hierro` | `#A9ADB2` | Texto apagado sobre tinta (navegación) | 7,9:1 sobre tinta |
| `rojo` | `#B3261E` | Vencido. Fondo con texto papel o texto "Venció hace…" | 6,3:1 en los dos sentidos |
| `amarillo` | `#F5BC00` | Vence pronto. Siempre de fondo, con texto tinta | 10,2:1 |
| `verde` | `#1F7A4C` | Al día y confirmaciones | 5,1:1 con papel |
| Rayado | `tinta` / `cemento` a 45° | Sin datos | siempre con texto |

### Tipografía

Barlow (Jeremy Tribby, OFL), autoalojada con `@fontsource`, solo el subconjunto latino. Toma sus formas de las patentes y los carteles de ruta: es la letra de las chapas y de la señalética, legible al sol y sin aire de "tech".

| Rol | Familia | Peso | Tamaño |
|---|---|---|---|
| Título de pantalla (`.titulo`) | Barlow Semi Condensed | 700 | 30 px celular / 40 px compu |
| Rótulo de sección, de fila y de campo (`.rotulo`) | Barlow Semi Condensed | 600 | 18–22 px |
| Texto | Barlow | 400 / 600 en títulos de fila | 16–17 px |
| Secundario | Barlow | 400 | 15 px (`cemento`) |
| Mínimo | Barlow | 500 | 13 px |
| Fechas, cifras y códigos (`.cifra`, `.chapa`) | Barlow Condensed | 600–700, `tabular-nums` | 26 px en filas, 46 px en la tarjeta |

### Radios, espaciado, sombras

- Radios casi rectos: chip y botón 2 px, planilla 3 px, tarjeta 4 px, hoja 6 px arriba. El oficio es de chapa y papel, no de plástico.
- Espaciado en base 4: filas con 12–14 px de alto interno y mínimo 56 px; secciones a 40 px; 16 px de margen en el celular, 48 px en la compu con el contenido centrado (máximo 960 px).
- Sin sombras en reposo. Solo la hoja que sube tiene sombra.
- Foco: contorno de 3 px tinta con 2 px de separación (claro sobre la navegación oscura).

## Piezas

- **Planilla**: papel, borde `junta`, filete de 2 px tinta arriba (el del formulario impreso), renglones de 1 px. La cabecera de grupo (local) va sobre un renglón gris.
- **Canto de estado**: franja de 6 px pegada al borde izquierdo de la fila, de punta a punta, sin redondear.
- **Rótulo de estado** (`MarcaEstado`): el nombre del estado sobre su color, como un cartel ("Vencido" blanco sobre rojo, "Vence pronto" negro sobre amarillo). Sin datos: borde de trazos.
- **Chapa** (`Chapa`, `MarcaSCP`): código del equipo y la marca grabados en una placa negra con letras claras.
- **Tira perforada** (`TiraPerforada`): casilleros numerados que se perforan a medida que se registran los controles de una visita (Hoy y Modo visita).
- **Botón deshabilitado**: un casillero sin completar (borde de trazos y texto cemento), no un botón gris borroso.
- **Sello**: al registrar, la fecha nueva cae en un recuadro verde con un golpe inclinado que queda derecho. Es el único movimiento especial; respeta `prefers-reduced-motion`.

## La tarjeta de control

Mide 288 px (en el celular entra una entera y asoma la siguiente). De arriba abajo:

1. Cabezal del color del estado con el ojal del precinto (agujero con arandela) y el estado escrito en grande; a la derecha, "Vence en 6 días".
2. Nombre del control y período con la norma.
3. Renglón "Vence" con la fecha en Barlow Condensed a 46 px.
4. La tira de casilleros del período, como un formulario: meses (o años) en celdas con renglones; los transcurridos, perforados; el del vencimiento, lleno del color del estado. Para 20 años, dos filas de 10.
5. "Último: 25/10/2025, Recargas Norte" y, si hay, la visita programada.
6. El botón "Registrar …" al pie (negro si está vencido o por vencer, con borde si está al día).

## Navegación

Un rótulo grabado: barra inferior negra en el celular (activo en blanco con un filete arriba; "Escanear" es una placa blanca al centro) y columna negra de 240 px en la compu con la marca SCP en chapa clara, "Escanear QR" como placa blanca y el ítem activo con fondo levemente más claro y un filete. Se agregó un enlace "Ir al contenido" para teclado.

## Qué cambió en las pantallas pulidas

- **Hoy**: la visita en curso es el único bloque oscuro, con la tira perforada del avance. En la compu, dos columnas: lo que vence a la izquierda; visitas y pedidos a la derecha. Las secciones dicen cuántos controles tienen.
- **Ficha de elemento**: código en chapa junto al título, tarjetas nuevas, unidad e historial como planillas, etiqueta QR con cabezal negro y la marca.
- **Modo visita**: estado de la visita como rótulo negro, progreso con tira perforada, filas con canto, rótulo de estado y botón grande; al registrar, el sello verde. "Cerrar visita" queda como casillero sin completar hasta que no falte nada.

## Reglas de `docs/diseno.md` que rompí

- **Radios 10/8/6 px** → 2–4 px. Las esquinas blandas son lo que hacía ver la app como cualquier SaaS.
- **Tinta azul de ropa de trabajo** → negro. El azul competía con los colores de seguridad y en la norma el azul significa "obligación"; el negro deja que rojo, amarillo y verde hablen solos, y es el negro de los rótulos y de los carteles.
- **Una sola familia variable (Archivo)** → Barlow en tres anchos (sigue siendo una familia).
- **Cinta de 4 px redondeada con margen** → canto de 6 px pegado al borde.
- **Marca de estado con cuadradito + texto** → rótulo de estado lleno.

## Qué descarté

- Navegación clara: más "correcta" según los estudios de paneles, pero sin carácter; la negra se lee mejor al sol.
- Azul de seguridad para la acción principal (por la semántica de "obligación"): ponía cuatro colores fuertes en cada pantalla.
- Remaches en las chapas, textura de cartón, cinta de peligro amarilla y negra, letra stencil: kitsch.
- Mayúsculas en rótulos: solo en datos que ya vienen así (códigos).
- Una tira de resumen con números en Hoy: repetía la frase del encabezado.
