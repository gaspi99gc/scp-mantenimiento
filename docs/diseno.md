# Sistema de diseño SCP

> Lo usan todas las pantallas. Si una pantalla necesita algo que no está acá, primero se agrega acá.

## A quién le hablamos

El **supervisor de SCP**, parado en un local con el celular en la mano: a veces en un sótano sin señal, a veces al sol en una vereda, a veces con una mano ocupada. Su trabajo en la app es uno solo: **saber qué vence y dejar registrado lo que hizo, rápido**. La pantalla tiene que contestar sin que la lea entera: *¿qué vence, dónde y cuándo?*

## La idea: la tarjeta de control

En el rubro, cada matafuego lleva colgada una **tarjeta de control**: un cartón con un agujero para el precinto, los datos del service y una grilla de meses que el técnico perfora. Es el objeto que todo el mundo en el oficio reconoce y lo que mira el inspector.

La app toma ese objeto como pieza central: **cada control se muestra como una tarjeta** con su agujero, la franja del color del estado, el vencimiento en números grandes y condensados y la **grilla perforada** del período (los meses o años que ya pasaron desde el último service aparecen perforados). En la ficha de un elemento, sus controles cuelgan uno al lado del otro, como en la pared del local.

**Es lo único llamativo de la interfaz.** Todo lo demás es silencioso, ordenado y legible.

## Color

Los colores de estado son los **colores de seguridad de la norma** (IRAM 10005): rojo, amarillo y verde. Nunca se usan como decoración: si algo es rojo, es porque está vencido.

| Token | Hex | Uso |
|---|---|---|
| `yeso` | `#ECEEEA` | Fondo general (tono de revoque fino, levemente verdoso, no crema) |
| `papel` | `#FAFAF7` | Superficies: planillas, hojas, tarjetas |
| `tinta` | `#1D2940` | Texto principal y acción primaria. Azul de ropa de trabajo |
| `cemento` | `#5B6472` | Texto secundario |
| `junta` | `#CDD2CC` | Líneas y bordes |
| `rojo` | `#C42B2B` | **Vencido**. También errores |
| `amarillo` | `#F0BE2C` | **Vence pronto**. Siempre como fondo con texto `tinta`, nunca como texto |
| `verde` | `#2E7A4E` | **Al día**. Confirmaciones |
| Rayado | `cemento` a 45° | **Sin datos**: rayado diagonal, como una zona en obra. No es un color: es "acá falta información" |

Contraste: `tinta` sobre `papel` 13:1; `cemento` sobre `papel` 5,6:1; texto `papel` sobre `rojo` 5,2:1 y sobre `verde` 5,3:1; `tinta` sobre `amarillo` 9,5:1.

## Tipografía

**Archivo** (variable, ejes de peso y ancho), de Omnibus-Type, una fundidora de Buenos Aires. Es una sola familia, y lo que cambia según el rol es el **ancho**:

| Rol | Ancho | Peso | Tamaño | Notas |
|---|---|---|---|---|
| Fechas y cifras (`.cifra`) | 62–68 % (condensada) | 600–700 | Según el contexto | `tabular-nums`. Es la voz de "sello" de la tarjeta |
| Título de pantalla | 87 % | 700 | 28 px (móvil) / 34 px | Interletrado −0,01 em |
| Título de sección | 100 % | 650 | 19 px | |
| Texto | 100 % | 400 | 16 px | Interlineado 1,45 |
| Secundario | 100 % | 400 | 14 px | Color `cemento` |
| Mínimo | 100 % | 500 | 13 px | Nada más chico |

Escala: 13 · 14 · 16 · 19 · 23 · 28 · 34 · 46.

**Prohibido:**

- Etiquetas en MAYÚSCULAS.
- Rótulos encima de cada título.
- Resaltar una sola palabra del título en otro color o estilo.
- Fuente monoespaciada.
- Flechas "→" pegadas al texto de los botones.
- Separar datos con puntos medios ("A · B").

## Layout

- **Celular primero.** Una columna, márgenes laterales de 16 px y contenido de hasta 640 px.
- **Barra inferior** en el celular: Hoy · Agenda · **Escanear** (botón central, cuadrado y oscuro) · Locales · Más. En la computadora (≥ 1024 px) pasa a ser una **columna izquierda** de 240 px y el contenido llega hasta 880 px.
- **Listas, no grillas de cards.** La información se agrupa en **planillas**: un bloque `papel` con filas separadas por líneas `junta`. Cada fila tiene a la izquierda una **cinta** de 4 px del color del estado, en el medio qué es y dónde, y a la derecha la fecha en `.cifra`.
- **Acciones abajo, al alcance del pulgar.** La acción principal de cada pantalla va en una barra fija abajo en el celular.
- **Toques de 48 px** como mínimo.
- **Bordes redondeados según jerarquía, no iguales para todo:**
  - Planillas y hojas: 10 px.
  - Botones: 8 px.
  - Chips: 6 px.
  - La tarjeta: 6 px, con el agujero.
  - Sombras casi nulas: solo la hoja que sube desde abajo tiene sombra.
- Alineación a la izquierda siempre. Fechas y cifras, a la derecha dentro de las filas.

## Movimiento

- Solo como respuesta a una acción: la hoja que sube desde abajo, la confirmación de un registro.
- **Un solo momento especial:** al confirmar un registro, la tarjeta pasa del color anterior a verde y la fecha nueva queda **sellada**: aparece con un golpe corto de escala, como un sello de goma.
- Se respeta `prefers-reduced-motion`.

## Textos

- Voseo rioplatense, frases cortas, verbos concretos.
- El botón dice exactamente lo que pasa: "Registrar recarga", "Armar visita", "Publicar informe", "Subsanar". El aviso que sigue repite el mismo verbo: "Recarga registrada", "Informe publicado".
- Las fechas se dicen de forma relativa cuando ayuda: "Vence en 6 días", "Venció hace 3 días", "Vence hoy". La fecha absoluta va al lado, en `.cifra`.
- Los vacíos invitan a hacer algo: "No hay nada vencido en este local. El próximo control es la campana, el 2 de diciembre."
- Los errores dicen qué pasó y cómo arreglarlo, sin pedir perdón.

## Estados (siempre los mismos nombres)

| Estado | Cuándo | Cómo se ve |
|---|---|---|
| Vencido | Hoy > vencimiento | Cinta `rojo`. "Venció hace N días" |
| Vence pronto | Hoy ≥ vencimiento − anticipación | Cinta `amarillo`. "Vence en N días" |
| Al día | El resto | Cinta `verde`. Solo la fecha |
| Sin datos | No hay vencimiento cargado | Cinta rayada. "Falta cargar la fecha" |
| Programado | Hay una visita armada que lo incluye (se suma a los otros estados) | Junto a la fecha: "Visita el 13/11" |

## Accesibilidad

- El foco de teclado siempre visible: contorno de 2 px `tinta` con 2 px de separación.
- El estado nunca se comunica solo con color: siempre hay texto.
- `lang="es-AR"`.
