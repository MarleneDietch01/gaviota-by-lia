---
name: visual-qa-playwright
description: Instrumentación de QA visual con Playwright — capturar, medir estilos computados, inspeccionar red y comparar antes/después sin falsos negativos. Úsala cuando haga falta VER o MEDIR la página renderizada. Se activa con "haz capturas", "muéstrame cómo se ve", "compara antes y después", "mide el layout", "screenshot", "verifica en el navegador", "arranca el dev server y revisa". NO emite juicios de diseño (premium-beauty-design) ni decide qué breakpoints auditar (responsive-ui-audit): es la herramienta que los demás usan.
---

# QA visual con Playwright — Gaviota by Lia

## Objetivo

Producir evidencia fiable de lo que el navegador realmente renderiza. La mayoría
de los diagnósticos equivocados de este proyecto vinieron de mirar una captura
mal tomada, no de leer mal el código.

## Herramientas del proyecto

- `playwright` y `@playwright/test` ya instalados.
- `scripts/screenshot.mjs` — captura home en 1440 y 390, salida en `.visual-check/`.
  Uso: `node scripts/screenshot.mjs <url> <dir-salida>`
- `npm run test:e2e` — Playwright test runner.
- Servidor: `npm run dev` (puerto 3000; si está ocupado salta al 3001).

Los scripts ad hoc que necesiten `sharp` deben ejecutarse **desde la raíz del
proyecto**, o Node no resolverá el paquete.

## Fallo conocido de `screenshot.mjs`

El script hace scroll a saltos de `innerHeight` cada 100 ms y captura tras
~1200 ms. Las últimas secciones con imágenes `lazy` **no han decodificado
todavía** y salen en blanco. Ha provocado ya un diagnóstico falso ("faltan las
imágenes de comunidad" cuando cargaban perfectamente).

Antes de afirmar que una imagen no carga, **verifica el estado real**:

```js
await p.$$eval('img', els => els.map(i => ({
  src: i.currentSrc, complete: i.complete, w: i.naturalWidth,
})));
```

Si `complete: true` y `naturalWidth > 0`, la imagen carga y el problema es de la
captura. Arregla la espera antes de reportar nada.

Espera robusta:
```js
await p.evaluate(async () => {
  await new Promise(r => { let y = 0;
    const s = () => { scrollBy(0, 400); y += 400;
      y < document.body.scrollHeight ? setTimeout(s, 120) : setTimeout(r, 1500); }; s(); });
});
await p.waitForFunction(() =>
  [...document.images].every(i => i.complete && i.naturalWidth > 0));
await p.waitForTimeout(500);
await p.evaluate(() => scrollTo(0, 0));
```

## Procedimiento

### 1. Levantar el servidor
Comprueba primero si ya hay uno:
```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/es
```
Si lo arrancas tú en segundo plano, **anótalo y ciérralo al terminar**: un dev
server huérfano bloquea el puerto al usuario (`taskkill /PID <pid> /F`).

### 2. Capturar
Contextos separados por viewport y por `deviceScaleFactor`. Guarda en el
directorio de scratchpad de la sesión, no en el repo, salvo que se pida.

### 3. Medir, no adivinar
Playwright sirve sobre todo para **medir**:

```js
// estilos computados — desmonta discusiones sobre qué clase gana
await p.$$eval('.frame-arch', e => e.map(x => getComputedStyle(x).borderRadius));

// geometría — alineación de precios, alturas de sección
await p.$$eval('#collection .tabular', e => e.map(x => Math.round(x.getBoundingClientRect().top)));

// red — qué se descarga de verdad y cuánto pesa
p.on('response', r => { if (r.url().includes('/_next/image')) log(r.url(), r.headers()['content-length']); });

// desbordamiento
await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
```

### 4. Recortes 1:1 para calidad de imagen
Para juzgar nitidez, extrae la misma región de fuente y servido con `sharp`,
amplía con `kernel: 'nearest'` y compáralas. No juzgues nitidez en una captura
de página completa reescalada.

## Checklist

- [ ] Servidor propio cerrado al terminar; puerto liberado.
- [ ] Todas las imágenes con `complete && naturalWidth > 0` antes de capturar.
- [ ] Scroll devuelto a 0 antes del pantallazo del primer viewport.
- [ ] Capturas a DPR 1 y 2 cuando se evalúe nitidez.
- [ ] `/es` y `/en` cuando el cambio afecte a texto.
- [ ] Comprobado `overflow` horizontal en cada viewport capturado.
- [ ] Archivos temporales fuera del repo.
- [ ] Cambios de configuración hechos para medir, **revertidos** y verificado.

## Errores que debe evitar

- Reportar un bug visual sin comprobar que no es artefacto de captura.
- Usar `naturalWidth` para deducir resolución servida: Chromium lo corrige por
  densidad con `srcset` de descriptores `w` y engaña. Decodifica los bytes.
- Capturar antes de que las fuentes web hayan cargado (provoca falsos saltos
  tipográficos). Espera a `document.fonts.ready`.
- Dejar el dev server corriendo en segundo plano al acabar.
- Escribir capturas de depuración dentro de `public/` o del árbol de código.
- Comparar antes/después con distinto viewport, DPR o idioma.
- Suponer que dev y build renderizan igual en rendimiento: para métricas usa
  `npm run build && npm run start`.

## Validaciones obligatorias

1. Cada afirmación visual va acompañada de la medida que la respalda.
2. Antes/después con viewport, DPR, idioma y estado de scroll idénticos.
3. Si se tocó `next.config.ts` o cualquier config para medir, verificar por grep
   que quedó restaurada.
4. Confirmar que no queda ningún proceso `next dev` propio vivo.

## Formato del informe

```markdown
## Cómo se midió
Viewports, DPR, idioma, build (dev o prod), esperas aplicadas.

## Evidencia
| medida | valor | qué demuestra |

## Capturas
Rutas y qué mirar en cada una.

## Limpieza
Servidores cerrados, configs restauradas, temporales eliminados.
```
