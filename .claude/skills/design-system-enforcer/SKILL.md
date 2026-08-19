---
name: design-system-enforcer
description: Guardián del sistema de diseño en Tailwind v4 — tokens de @theme, API de las primitivas, conflictos de clases y deriva hacia valores arbitrarios. Úsala antes de dar por cerrado cualquier cambio de UI, y siempre que aparezca un color, radio, sombra o espaciado nuevo. Se activa con "añade un color", "esta clase no se aplica", "el estilo no funciona", "revisa que use los tokens", "hay valores hardcodeados", "unifica los estilos", "por qué gana esta clase". NO mide contraste (usa accessibility-premium-ui) ni decide la composición (premium-beauty-design).
---

# Sistema de diseño — Gaviota by Lia

## Objetivo

Que el sistema sea la única fuente de verdad y que ningún gesto de marca muera
en silencio por una colisión de clases.

## Dónde vive

- `src/app/globals.css` → bloque `@theme` con **todos** los tokens, más las
  utilidades `@utility` de marca.
- `src/components/ui/layout-primitives.tsx` → `Container`, `Section`,
  `SectionHeader`, `Rule`.
- `src/components/ui/button.tsx` → `Button`, `LinkButton`.
- `src/lib/utils/cn.ts` → concatenador de clases.

Tailwind v4: no hay `tailwind.config.js`. Los tokens de `@theme` generan las
utilidades (`--color-rose` → `bg-rose`, `text-rose`, `border-rose`).

## La trampa que ya costó dos gestos de marca

`cn()` **solo concatena**. No resuelve conflictos. Cuando dos utilidades tocan la
misma propiedad, gana la que aparezca más tarde **en el CSS compilado**, no la
que escribas al final del `className`. Casos reales de este repo:

1. `frame-organic rounded-card` → `.rounded-card` estaba después en el CSS y
   pisaba las esquinas del marco. El gesto salía a 4 px en toda la web.
2. `<Section className="py-0">` sobre una base con `py-28` → ganaba `py-28`. La
   sección a sangre quedaba con 112 px de banda arriba y abajo.

Ambos pasaron desapercibidos porque el código "leía" correcto.

### Las tres reglas que lo impiden

1. **Variación estructural = prop tipada, nunca `className`.**
   `<Section padding="none" tone="wine">`. La prop elige una única clase de un
   mapa; no hay dos reglas compitiendo.
2. **`className` solo para lo aditivo**: posicionamiento en rejilla, `col-span`,
   `id` de test. Si necesitas cambiar algo que ya controla una prop, **añade un
   valor a la prop**.
3. **Toda utilidad `@utility` declara la propiedad completa.** `frame-arch`
   define las cuatro esquinas, no dos, para no depender del orden.

Si una clase "no se aplica", comprueba el orden en el CSS compilado antes de
tocar nada:
```bash
curl -s "$(curl -s http://localhost:3000/es | grep -o '/_next/static/[^"]*\.css')" -o /tmp/app.css
grep -n "\.rounded-\|\.frame-arch\|\.py-" /tmp/app.css
```
Y confirma con estilos computados:
```js
await p.$$eval('.frame-arch', e => e.map(x => getComputedStyle(x).borderRadius));
```

## Tokens — reglas de uso

- **Superficies:** `ivory`, `white-warm`, `powder`, `wine`. Se aplican vía
  `<Section tone>`, no con `bg-*` a mano.
- **Marca:** `rose` (base), `rose-deep` (hover, y texto pequeño sobre `powder`),
  `rose-ink` (`:active`). `champagne` **solo** decorativo y `aria-hidden`.
- **Texto:** `ink` (titulares, precios), `body` (párrafos, válido en toda
  superficie clara), `muted` (captions — **prohibido sobre `powder`**, ahí cae a
  3.74:1). Sobre vino: `on-dark`, `on-dark-soft`.
- **Tipografía:** `font-display` (Cormorant) solo en titulares; `font-sans`
  (Manrope) en todo lo demás. Escala `text-display|h1|h2|h3|lead`. **No inventes
  tamaños con `text-[...]`** salvo ajuste óptico justificado por comentario.
- **Radios:** `xs`, `sm`, `md`, `pill`, `arch`. Nada de `rounded-2xl`.
- **Sombras:** `subtle`, `lift`, `drawer`. No escribas `shadow-[0_2px...]`.
- **Movimiento:** `ease-editorial` (entradas), `ease-soft` (hover/estado).

## Cómo añadir un token

1. Comprueba que ninguno existente sirve.
2. Añádelo en `@theme` con un comentario que explique **para qué** es.
3. Si es color de texto, mide el contraste contra las cuatro superficies y anota
   los ratios en el comentario (ver `accessibility-premium-ui`).
4. Si es una utilidad compuesta, declara la propiedad completa.
5. Busca en el repo los valores que ese token sustituye y migra todos.

## Procedimiento de auditoría

```bash
# colores hexadecimales fuera de globals.css
grep -rnE "#[0-9a-fA-F]{3,8}" src/ --include=*.tsx

# valores arbitrarios de Tailwind
grep -rnoE "\[[0-9]+(px|rem|%)\]|\[#[0-9a-fA-F]+\]" src/ --include=*.tsx | sort | uniq -c | sort -rn

# tokens huérfanos: definidos y nunca usados
grep -oE "^\s*--color-[a-z-]+" src/app/globals.css

# clases de un sistema anterior que ya no existen
grep -rlE "bg-surface-|text-text-|brand-soft|rounded-card|frame-organic" src/
```

La última consulta es crítica tras un cambio de tokens: en Tailwind v4 una clase
que ya no corresponde a ningún token **simplemente no se genera**, no da error, y
el elemento se queda sin estilo. Un cambio de nombres debe migrarse **de golpe**
en todos los archivos.

## Checklist

- [ ] Cero hex en `.tsx`; todo color viene de un token.
- [ ] Cero clases de sistemas anteriores.
- [ ] Ninguna sección aplica `bg-*` directo pudiendo usar `<Section tone>`.
- [ ] Ningún `className` sobrescribe algo que ya controla una prop.
- [ ] Valores arbitrarios contados y justificados con comentario.
- [ ] Utilidades `@utility` declaran la propiedad completa.
- [ ] Tokens nuevos con comentario de propósito y ratios medidos.
- [ ] Sin tokens huérfanos.
- [ ] `font-display` solo en titulares.
- [ ] Radios y sombras del sistema, no ad hoc.

## Errores que debe evitar

- Añadir `tailwind-merge` como parche en vez de arreglar la API. (Si algún día
  se añade, debe ser una decisión consciente y documentada, no un apaño.)
- Renombrar tokens sin migrar todos los consumidores en el mismo cambio.
- Dar por hecho que el último `className` gana.
- Crear una variante de botón nueva para un caso único: usa `className` aditivo.
- Meter `!important` para ganar una colisión.
- Duplicar la escala tipográfica con `text-[17px]` repartido por el código.
- Escribir un comentario que afirme algo no verificado (el sistema anterior
  documentaba "no genera clases en conflicto" mientras las generaba).

## Validaciones obligatorias

1. `npm run typecheck` — las props tipadas son la primera defensa.
2. `npm run lint`.
3. `npm run build` — Tailwind v4 compila en el build; una utilidad inexistente
   se detecta mirando el CSS generado, no por error.
4. Estilos computados de todo gesto de marca (`frame-arch`, paddings de
   `Section`, radios) comprobados en el navegador.
5. Los cuatro `grep` de auditoría, con salida vacía o justificada.

## Formato del informe

```markdown
## Tokens
| token | valor | propósito | ratios medidos |

## Deriva detectada
| archivo:línea | valor arbitrario | token que lo sustituye |

## Colisiones
| clases | ganadora real | corrección |

## Verificación
Estilos computados comprobados y resultado.
```
