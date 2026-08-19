---
name: responsive-ui-audit
description: Auditoría de integridad del layout en toda la escala de breakpoints (360→1920), con foco en el hueco de tablet. Úsala cuando haya que comprobar que el diseño aguanta en todos los anchos. Se activa con "revisa el responsive", "se rompe en móvil", "en tablet se ve raro", "hay scroll horizontal", "el botón se desborda", "prueba todos los breakpoints", "se corta el título". NO cubre cómo capturar pantallazos (usa visual-qa-playwright), ni contraste/teclado (accessibility-premium-ui), ni criterio estético (premium-beauty-design).
---

# Auditoría responsive — Gaviota by Lia

## Objetivo

Que el layout no se rompa en ningún ancho entre 360 y 1920 px, con atención
especial al rango 640-1023 px, que es donde este proyecto ha fallado siempre.

## Anchos obligatorios

| px | por qué |
|------|-----------------------------------------------|
| 360 | Android pequeño. El titular más largo debe caber. |
| 390 | iPhone base. Referencia de móvil. |
| 430 | iPhone Pro Max. DPR 3 — presupuesto de imagen. |
| 768 | iPad vertical. **Zona de riesgo.** |
| 1024| iPad horizontal / portátil pequeño. **Frontera `lg`.** |
| 1280| Portátil estándar. |
| 1440| Escritorio de referencia del diseño. |
| 1920| Monitor grande. Comprobar que el contenido no se disuelve. |

Prueba además **1023 px**: un píxel por debajo de `lg`, donde se acumulan los
fallos de este proyecto.

## El hueco de tablet — antipatrón recurrente aquí

Tailwind salta de `sm` (640) a `lg` (1024). Un componente escrito solo con
`base` + `lg:` entrega a 1023 px el diseño pensado para 390 px, estirado. Casos
reales detectados en este repo:

- Un CTA con `w-full` pensado para móvil medía **983 px de ancho** en tablet.
- El recorte 3:4 del hero móvil se estiraba a 1023×702 y destruía la composición.
- El texto de propuesta de valor solo existía en la rama `lg:`, así que por
  debajo de 1024 px la página no decía qué vendía la marca.
- La barra de confianza era `hidden lg:block`: invisible para todo el tráfico
  móvil, que es la mayoría.

**Regla:** todo componente con salto de layout necesita un estado intermedio
explícito en `sm:` o `md:`, o una justificación escrita de por qué no.

## Procedimiento

### 1. Barrido automático
Recorre los anchos y recoge, por cada uno:

```js
{
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  // elementos que sobresalen del viewport
  wide: [...document.querySelectorAll('*')]
    .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
    .map(el => el.className),
  // objetivos táctiles por debajo de 44px
  small: [...document.querySelectorAll('a,button,[role=button],input,select')]
    .filter(el => { const r = el.getBoundingClientRect();
                    return r.width && (r.height < 44 || r.width < 44); })
    .map(el => el.textContent?.trim().slice(0,30) || el.getAttribute('aria-label')),
}
```

### 2. Revisión visual por ancho
Captura y mira. El barrido no detecta fealdad.

### 3. Revisión en los dos idiomas
`/es` y `/en`. El español es ~20 % más largo: "Preguntas frecuentes" vs "FAQ",
"Cuidado corporal inspirado en la belleza dominicana" vs su versión corta. Los
titulares se rompen antes en español.

## Qué inspeccionar en cada ancho

**Estructura**
- [ ] `scrollWidth === clientWidth` (cero scroll horizontal).
- [ ] Márgenes laterales consistentes entre secciones (mismo `Container`).
- [ ] Ninguna sección con altura desproporcionada y sin contenido.
- [ ] Rejillas sin huérfanos feos (5 ítems en 2 columnas deja uno suelto).

**Tipografía**
- [ ] Titulares sin cortes en sílabas raras ni palabras partidas.
- [ ] Ningún `clamp()` que a 1920 dispare el tamaño hasta ser grotesco.
- [ ] Líneas de texto entre 45 y 75 caracteres.

**Controles**
- [ ] Objetivos táctiles ≥ 44×44 px.
- [ ] Botones que no desbordan su contenedor ni se estiran a todo el ancho en
      tablet o escritorio.
- [ ] Carruseles con `snap` que no cortan la última tarjeta.

**Imágenes**
- [ ] Encuadre correcto: rostros y etiquetas completos.
- [ ] Sin deformación (comprobar relación de aspecto renderizada).
- [ ] La variante de art direction correcta activa en cada rango.

**Navegación**
- [ ] Header legible sobre lo que tenga debajo en todos los anchos.
- [ ] El drawer solo aparece donde debe; la nav de escritorio, idem.
- [ ] Nada del header se solapa con el contenido al hacer scroll.

## Errores que debe evitar

- Probar solo un móvil y un escritorio.
- Usar `dvh`/`svh` sin comprobar el efecto con la barra del navegador móvil.
- Resolver un desbordamiento con `overflow-hidden` en un ancestro: eso oculta el
  síntoma y suele recortar sombras y foco.
- Ocultar contenido en móvil (`hidden lg:block`) en vez de rediseñarlo. Si algo
  importa en escritorio, importa más en móvil.
- Confiar en que `container` de Tailwind resuelve los márgenes: aquí se usa el
  componente `Container`, que es la única fuente de verdad del padding lateral.
- Dar por bueno un breakpoint sin mirar la captura.

## Validaciones obligatorias

1. Los 8 anchos + 1023 px, en `/es` y `/en` = 18 combinaciones.
2. Cero `overflow` horizontal en todas.
3. Cero objetivos táctiles < 44 px.
4. Capturas de página completa revisadas a ojo, no solo el primer viewport.
5. Con `prefers-reduced-motion: reduce` activo, el layout no cambia.

## Formato del informe

```markdown
## Resumen
| ancho | overflow | táctiles <44 | titulares | veredicto |
|-------|----------|--------------|-----------|-----------|
| 360   | ✅ 0     | ✅ 0         | ✅        | ok        |

## Fallos encontrados
### <ancho> — <componente>
- Síntoma:
- Causa (archivo:línea):
- Corrección:

## Zona de tablet
Estado explícito del rango 640-1023.

## Diferencias es / en
Dónde el español rompe algo que el inglés no.
```
