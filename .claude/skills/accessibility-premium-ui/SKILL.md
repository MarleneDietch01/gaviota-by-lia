---
name: accessibility-premium-ui
description: Accesibilidad WCAG 2.1 AA en interfaces de estética exigente — contraste medido, foco, teclado, diálogos modales, semántica y reduced-motion. Úsala siempre que se cree o modifique un componente interactivo, o cuando se introduzca un color de texto. Se activa con "revisa la accesibilidad", "contraste", "WCAG", "navegación por teclado", "lector de pantalla", "aria", "el foco no se ve", "el menú móvil atrapa el foco". NO define la paleta (usa design-system-enforcer): aquí se mide y se dictamina si un par color/fondo es válido.
---

# Accesibilidad — Gaviota by Lia

## Objetivo

Cumplir WCAG 2.1 AA sin renunciar a la estética. En esta marca lo segundo suele
usarse como excusa para lo primero: no se acepta.

## Lección aprendida en este proyecto

El sistema anterior documentaba que su rosa daba "~7:1". Era cierto **sobre
blanco**. Ese mismo rosa se usaba a 12 px sobre el rosa empolvado de la propia
sección, donde daba **4.30:1** y fallaba AA.

**Regla:** un color no tiene contraste; lo tiene un **par color/fondo**. Mide
cada par en la superficie donde se usa de verdad.

## Umbrales

| Contenido | Mínimo |
|-----------|--------|
| Texto < 18.66 px (o < 24 px si no es negrita) | 4.5:1 |
| Texto grande | 3:1 |
| Bordes de controles, iconos con significado | 3:1 |
| Contenido decorativo (`aria-hidden`) | sin requisito |

Los eyebrows del proyecto son de 11-12 px: son **texto normal**, necesitan 4.5:1.

## Cómo medir

```js
const L = h => { const c = [1,3,5].map(i => parseInt(h.slice(i,i+2),16)/255)
  .map(v => v <= 0.03928 ? v/12.92 : ((v+0.055)/1.055)**2.4);
  return 0.2126*c[0] + 0.7152*c[1] + 0.0722*c[2]; };
const ratio = (a,b) => { const x = L(a), y = L(b);
  return (Math.max(x,y)+0.05) / (Math.min(x,y)+0.05); };
```

Para colores con alpha, compón antes contra el fondo real: `text-x/70` sobre
vino no es `#X` sobre vino.

Construye la matriz completa: cada color de texto × cada superficie del sistema
(marfil, blanco cálido, rosa empolvado, vino). Marca ✓ / solo-grande / ✗.

## Reglas por área

### Semántica
- Un solo `<h1>` por página, en el hero.
- Jerarquía sin saltos: `h1 → h2 → h3`.
- `<section>` con nombre accesible (`aria-labelledby` apuntando a su `h2`).
- Listas de tarjetas en `<ul>/<li>`; pasos numerados en `<ol>`.
- Enlace es `<a>`, acción es `<button>`. Un botón con aspecto de enlace sigue
  siendo botón, y al revés.

### Foco
- `:focus-visible` visible **siempre**. Nunca `outline: none` sin sustituto.
- Sobre superficies oscuras el indicador rosa desaparece: invierte a champán.
- Orden de tabulación coherente con el orden visual. Si reordenas con `order`,
  comprueba que lo reordenado no sea focalizable.
- Skip link al contenido principal, visible al recibir foco.

### Diálogo modal (drawer)
El drawer anterior no hacía nada de esto. Obligatorio:
- `role="dialog"` + `aria-modal="true"` + nombre accesible.
- Foco movido al panel al abrir.
- **Trampa de foco** mientras está abierto (Tab y Shift+Tab circulan dentro).
- `Escape` cierra.
- Foco devuelto al botón que lo abrió al cerrar.
- Scroll de fondo bloqueado, y restaurado al valor previo, no a `''`.
- `aria-expanded` en el disparador.

### Estados
- Nunca solo color. La página activa lleva `aria-current="page"` **y** un filete.
- Favorito activo lleva `aria-pressed`, no solo un corazón relleno.
- Feedback de acción por `aria-live="polite"`.

### Imágenes
- `alt` descriptivo del contenido, sin "imagen de". Decorativas: `alt=""` +
  `aria-hidden="true"`.
- Los `alt` de este proyecto describen personas reales: no inventes edad, etnia
  ni relación. Sigue el patrón existente en `products.ts`.

### Formularios
- `<label>` real asociado por `htmlFor`. `placeholder` no es etiqueta.
- Errores anunciados y ligados con `aria-describedby`.
- `autoComplete` correcto (`email`, `name`, `postal-code`…).

### Movimiento
- `prefers-reduced-motion: reduce` neutraliza animaciones y `scroll-behavior`.
- Un elemento con animación de entrada **no puede quedarse invisible** si el JS
  falla o el usuario pide menos movimiento: el estado inicial oculto debe vivir
  dentro de `@media (prefers-reduced-motion: no-preference)`.

### Objetivos táctiles
Mínimo 44×44 px. En móvil, 48-52 px en acciones principales.

### Anclas
Con header sticky, todo `[id]` necesita `scroll-margin-top`, o el titular queda
tapado.

## Checklist

- [ ] Matriz de contraste completa, sin ✗ en texto.
- [ ] Un solo `h1`; jerarquía sin saltos.
- [ ] Recorrido completo con teclado, sin trampas involuntarias.
- [ ] Drawer: dialog, foco dentro, Escape, foco devuelto.
- [ ] Foco visible sobre claro **y** sobre oscuro.
- [ ] Ningún estado comunicado solo con color.
- [ ] Todos los iconos-botón con `aria-label`.
- [ ] `alt` en todas las imágenes; decorativas ocultas.
- [ ] Labels en todos los campos.
- [ ] Objetivos táctiles ≥ 44 px.
- [ ] `scroll-margin-top` en anclas.
- [ ] Con reduced-motion, todo visible y usable.

## Errores que debe evitar

- Estimar el contraste a ojo o reutilizar un ratio medido sobre otro fondo.
- Documentar un ratio correcto y luego usar el color en otra superficie.
- `aria-label` en un elemento que ya tiene texto visible distinto.
- `role="button"` sobre un `<div>` en vez de usar `<button>`.
- `tabIndex` positivo.
- Abrir un modal sin gestionar el foco.
- Ocultar el foco porque "afea".
- Animaciones de entrada que dejan contenido invisible sin JS.
- `alt` que repite el texto contiguo.

## Validaciones obligatorias

1. Matriz de contraste calculada para todo par nuevo, con el número en el PR.
2. Recorrido de teclado completo en `/es` y `/en`.
3. Abrir y cerrar el drawer con teclado y comprobar dónde queda el foco.
4. Emular `prefers-reduced-motion: reduce` y recargar.
5. Revisar el árbol de accesibilidad del hero y de una tarjeta de producto.
6. `npm run lint` sin errores de `eslint-plugin-jsx-a11y` si está activo.

## Formato del informe

```markdown
## Matriz de contraste
|          | marfil | blanco | polvo | vino |
| texto X  | 8.20✓  | 8.61✓  | 5.57✓ |  —   |

## Fallos AA
| elemento | par | ratio | corrección |

## Teclado
Recorrido, trampas, orden.

## Diálogos
Estado de foco/Escape/retorno.

## Reduced motion
Qué se desactiva y qué sigue funcionando.
```
