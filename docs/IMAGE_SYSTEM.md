# Sistema de imágenes

Este documento define cómo se muestran las imágenes de Gaviota by Lia. La
regla principal es simple: un packshot nunca se recorta; una fotografía
editorial solo se recorta alrededor de un punto focal declarado.

## Componentes auditados

| Componente | Clasificación | Tratamiento |
|---|---|---|
| `Hero` | Full-width / art direction | `<picture>` con fuentes móvil, tablet y desktop |
| `Collection` → `ProductCard` | Product packshot | `ProductImage`, 1:1, `contain` |
| `BuildRitual` | Mixed promo | `EditorialImage`; el bodegón usa `contain` |
| `Campaign` | Full-width campaign | `FillEditorialImage`, crop focal 45% 38% |
| `RitualSteps` | Editorial/lifestyle | 4:5 y punto focal por fotografía |
| `Founder` | Editorial portrait | 4:5, rostro protegido a 50% 28% |
| `Ingredients` | Mixed promo | 4:5, bodegón completo |
| `Sets` | Mixed product collection | 4:3 con `contain`, sin cortar productos |
| `Community` | Editorial carousel | 4:5 y punto focal individual |

No existen todavía PDP gallery, quick view, cart thumbnails ni admin preview.
Cuando se implementen deben consumir estos mismos componentes, no duplicar
reglas de `next/image`.

## Componentes reutilizables

Viven en `src/components/media/site-image.tsx`:

- `ProductImage`: obliga `object-contain` y centrado. Se usa para envases,
  tarros, sérums, sunscreen y miniaturas de catálogo.
- `EditorialImage`: admite `cover` o `contain`, pero exige `focal`. Se usa con
  dimensiones intrínsecas para evitar CLS.
- `FillEditorialImage`: variante para bloques cuya altura la decide el layout.
- `Hero`: mantiene un `<picture>` especializado porque necesita una fuente
  distinta por breakpoint y debe descargar una sola imagen LCP.

## Ratios

| Uso | Ratio | Fit |
|---|---:|---|
| Product card / slider | 1:1 | `contain` |
| PDP principal futuro | 1:1 o 4:5 | `contain` |
| Thumbnail futuro | 1:1 | `contain` |
| Retrato / comunidad / ritual | 4:5 | `cover` focal |
| Campaign split | altura del layout | `cover` focal |
| Bodegón dentro de bloque horizontal | 4:3 | `contain` |
| Hero | 3:4 móvil; 4:5 tablet/desktop | crop dirigido por fuente |

## Packshots

Los productos publicados usan los originales de estudio guardados en
`originales/shopify/`. `scripts/process-images.mjs` los normaliza a un lienzo
de 1200 × 1200 px, con escala óptica y una base común. Las URLs terminan en
`-studio.jpg` para que el optimizador de Next y cualquier CDN no reutilicen los
antiguos recortes rosados de `GA9` bajo la misma clave de caché.

El Tónico Para Barba es la única excepción: no existe packshot de estudio. Usa
una fotografía de ambiente cuadrada y necesita una sesión de producto propia.

## Puntos focales editoriales

| Imagen | Focal | Protege |
|---|---:|---|
| Hero 19 | 50% 30–34% | rostro y productos |
| Campaña / hidratación 7 | 45% 42% | rostro, manos y tarro |
| Exfoliación 15 | 50% 55% | pierna, mano y producto |
| Labios 16 | 52% 38% | rostro y tarro |
| Comunidad 9 | 50% 58% | modelos y productos |
| Comunidad 11 | 50% 50% | grupo completo |
| Comunidad 17 | 50% 42% | tres rostros |
| Comunidad 18 | 50% 45% | cinco rostros |
| Fundadora 2 | 50% 28% | rostro |
| Colección GA9 | 50% 52% | línea de productos |

## Rendimiento y accesibilidad

- Todas las imágenes usan `next/image`, salvo el `<picture>` del hero generado
  mediante `getImageProps`.
- `width` y `height`, o un padre posicionado con `fill`, reservan el espacio.
- `sizes` es obligatorio.
- Calidad 90 para packshots y fotografía principal; 75 queda disponible para
  imágenes secundarias futuras.
- Solo el hero utiliza `priority`.
- El texto alternativo describe lo visible y se localiza en inglés y español.

## Validación obligatoria

Revisar 360, 390, 430, 768, 1024, 1280 y 1440 px. En cada ancho se comprueba:

1. tapa, laterales, etiqueta y base completas en todos los packshots;
2. ningún rostro o producto en uso cortado accidentalmente;
3. proporciones naturales, sin estiramiento;
4. ausencia de overflow horizontal y layout shift;
5. una sola descarga prioritaria para el hero.
