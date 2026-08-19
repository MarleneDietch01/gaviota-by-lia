---
name: performance-core-web-vitals
description: Rendimiento y Core Web Vitals en Next 16 — LCP, CLS, INP, peso de JavaScript, frontera Server/Client Component y estrategia de carga. Úsala cuando el tema sea velocidad, peso o métricas. Se activa con "va lento", "mejora el rendimiento", "LCP", "CLS", "layout shift", "reduce el JavaScript", "demasiados client components", "optimiza la carga", "Lighthouse". NO cubre fidelidad ni compresión de imagen (usa image-quality-web): aquí importa cuándo y cuánto se descarga, no cómo se ve.
---

# Rendimiento — Gaviota by Lia

## Objetivo

Que la home cargue rápido en móvil sin sacrificar la fotografía, que es la
propuesta de la marca. El objetivo no es la puntuación: es que la primera
impresión sea inmediata.

## Presupuestos

| Métrica | Objetivo | Nota |
|---------|----------|------|
| LCP (móvil, 4G) | < 2.5 s | Es la imagen del hero |
| CLS | **0** | Hay `image-manifest.json`: no hay excusa |
| INP | < 200 ms | Poca interacción; drawer y quick add |
| JS de cliente en la home | < 120 KB comprimido | |
| Peso del hero servido | 90-130 KB AVIF | Compromiso con calidad 90 |

## Reglas de la arquitectura

### Server Components por defecto
Todo el contenido de `src/lib/content/` y `src/lib/catalog/` lleva
`import 'server-only'`. Las secciones son `async` Server Components. Solo lleva
`'use client'` lo que necesita estado del navegador:

- `site-header.tsx` — scroll, drawer, contador de bolsa
- `reveal.tsx` — IntersectionObserver
- controles de quick add / favoritos

**No subas `'use client'` de nivel.** Un `'use client'` en `page.tsx` o en
`layout.tsx` arrastra todo el árbol al bundle de cliente.

### Sin librerías pesadas para gestos simples
`framer-motion` está en `package.json` pero **no debe usarse** para un fade-up:
son ~50 KB de cliente que se resuelven con IntersectionObserver + dos reglas CSS.
Antes de importar una librería de animación, justifica por escrito por qué el
CSS no basta.

`lucide-react` se importa por icono nombrado; nunca `import * as`.

### Estrategia de imágenes (el eje del LCP)
- Una sola imagen con `priority` por página: la del hero.
- Art direction con `getImageProps()` + `<picture>`: **una sola descarga**.
  Dos `<Image>` con `lg:hidden` / `hidden lg:block` descargan las dos. Verificado
  en este repo: en escritorio se bajaban hero-mobile **y** hero-desktop, ambos
  con `fetchPriority="high"`, compitiendo por el ancho de banda del LCP.
- Todo lo demás, `lazy` (por defecto). No pongas `priority` "por si acaso".
- `width`/`height` reales o contenedor con relación de aspecto → CLS 0.

### Fuentes
`next/font/google` con `display: 'swap'` y subconjuntos `latin` + `latin-ext`
(el español necesita tildes y `ñ`). Se auto-alojan: no añadas `<link>` a Google.
No añadas una tercera familia.

### CSS
Tailwind v4 vía `@tailwindcss/postcss`. Los tokens viven en `@theme` de
`src/app/globals.css`. Evita `@apply` masivo y clases arbitrarias repetidas: es
CSS que no se deduplica.

## Procedimiento

### 1. Medir sobre build de producción
```bash
npm run build && npm run start
```
Dev tiene HMR, sin minificar y sin caché de imagen: sus números no valen.
Nota: Next 16 ya no imprime `size` / `First Load JS` en el build, por
inexactos en arquitecturas RSC. Mide en el navegador.

### 2. LCP y CLS reales
```js
new PerformanceObserver(l => l.getEntries().forEach(e =>
  console.log('LCP', e.startTime, e.element?.tagName, e.url))
).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver(l => { let cls = 0;
  l.getEntries().forEach(e => { if (!e.hadRecentInput) cls += e.value; });
  console.log('CLS', cls);
}).observe({ type: 'layout-shift', buffered: true });
```

### 3. Auditar la frontera cliente
```bash
grep -rln "'use client'" src/
```
Cada resultado debe estar justificado. Comprueba que ninguno es una página o un
layout.

### 4. Auditar la red
Cuenta peticiones a `/_next/image` en la carga inicial. Cualquier imagen que no
se vea en el primer viewport y aparezca ahí es un `priority` mal puesto o un
`lg:hidden` que no evita la descarga.

## Checklist

- [ ] Un solo `priority` en toda la página.
- [ ] Un solo archivo de hero en la red por viewport.
- [ ] CLS = 0 medido, no supuesto.
- [ ] Ninguna página ni layout con `'use client'`.
- [ ] Sin `framer-motion` en el bundle de la home.
- [ ] Iconos importados uno a uno.
- [ ] Fuentes con `swap`, dos familias, subconjunto correcto.
- [ ] Sin scripts de terceros añadidos sin necesidad.
- [ ] Listeners de scroll con `{ passive: true }` y limpiados en el `return`.
- [ ] `IntersectionObserver` desconectado tras dispararse.

## Errores que debe evitar

- Optimizar el peso degradando la fotografía: aquí el equilibrio se inclina a
  favor de la imagen. Sube `quality` y ahorra en otro sitio.
- Poner `priority` a varias imágenes: compiten y empeoran el LCP.
- Marcar `'use client'` una sección entera por un botón.
- Usar `useEffect` para leer `localStorage` en el primer render y provocar
  mismatch de hidratación (léelo tras montar y parte de un valor neutro).
- Añadir un carrusel con librería cuando `scroll-snap` de CSS resuelve.
- Confiar en las cifras de `next build` o de `next dev`.
- Precargar fuentes o imágenes "por si acaso".

## Validaciones obligatorias

1. `npm run build` sin errores ni warnings nuevos.
2. LCP, CLS e INP medidos sobre `npm run start`, en móvil emulado con throttling.
3. Recuento de peticiones de imagen en la carga inicial, y que ninguna sea de
   una variante oculta por CSS.
4. Listado de `'use client'` justificado archivo por archivo.
5. Con `prefers-reduced-motion: reduce`, nada se rompe ni se queda invisible.

## Formato del informe

```markdown
## Métricas
| métrica | antes | después | objetivo |

## LCP
Qué elemento es, qué archivo, cuánto pesa, cuándo se pide.

## JavaScript de cliente
| archivo con 'use client' | por qué | ¿evitable? |

## Red en carga inicial
Peticiones, peso total, imágenes innecesarias.

## Compromisos
Dónde se eligió calidad sobre peso y por qué.
```
