---
name: premium-beauty-design
description: Dirección de arte y composición editorial para Gaviota by Lia. Úsala cuando haya que diseñar o rediseñar una página, sección o bloque visual y la pregunta sea "cómo debe verse y sentirse". Se activa con "rediseña la home", "esta sección se ve genérica", "parece plantilla de Shopify", "hazlo más premium", "necesito una sección de X", "mejora la jerarquía visual", "el hero no impacta". NO cubre tokens ni clases (usa design-system-enforcer), ni textos (brand-copy-es-en), ni compresión de imágenes (image-quality-web).
---

# Dirección de arte — Gaviota by Lia

## Objetivo

Que cada pantalla se lea como una marca internacional de skincare y no como una
plantilla de e-commerce. El listón es Aesop, Byredo, Glossier, Rhode: fotografía
grande, tipografía con intención, mucho aire y muy pocos elementos por bloque.

## Contexto del proyecto

- Marca dominicana de cuidado corporal. Fundadora: Marlene Dietsch.
- Fotografía disponible: 17 tomas de estudio de Leslie Estévez, **todas 4:5
  vertical**, sobre ciclorama rosa. Más `GA9.jpg`, un bodegón de catálogo.
- Ubicación: `public/images/gaviota/{hero,editorial,products,community,founder}/`
- Dirección escrita previa: `docs/DESIGN_DIRECTION.md`. Léela antes de proponer.
- Idiomas: es / en, ruta `/[lang]`. Todo diseño debe aguantar los dos.

## Principios innegociables

1. **Ritmo por temperatura.** La página alterna superficies (marfil, blanco
   cálido, rosa empolvado, vino) y **nunca repite la misma dos secciones
   seguidas**. Es lo que evita a la vez el bloque-rosa-plano y la plantilla
   blanca. Antes de añadir una sección, comprueba la de arriba y la de abajo.
2. **Una sola idea por sección.** Si un bloque necesita dos titulares o dos CTA
   primarios, son dos secciones.
3. **La fotografía manda.** El 4:5 vertical es la proporción nativa: respétala.
   Forzar 16:9 recorta el 55 % de la altura y decapita a la modelo o corta los
   productos. Si un formato ancho es imprescindible, usa composición dividida.
4. **Una cursiva por titular.** La firma tipográfica es una palabra en cursiva
   Cormorant dentro de un titular romano. Una, nunca dos.
5. **Dominicana sin cliché.** Nada de palmeras, hojas de monstera, arena,
   degradados turquesa ni iconos de coco. Lo dominicano se expresa con la
   fotografía real, los tonos de piel y una microetiqueta de origen.
6. **Sin espacio vacío gratuito.** Aire sí; secciones de 900 px de alto con un
   titular y nada más, no.

## Procedimiento

### 1. Leer antes de dibujar
- `docs/DESIGN_DIRECTION.md`, `docs/SITEMAP.md`, `docs/IMAGE_USAGE.md`.
- `src/lib/content/sections.ts` — qué copy existe y cuál está en `draft`.
- `src/lib/catalog/products.ts` — qué productos son reales.
- Inventario de fotos en `public/images/gaviota/image-manifest.json`.

### 2. Mapear el recorrido
Escribe la secuencia de secciones con su temperatura antes de tocar JSX:

```
Hero .............. marfil
Beneficios ........ blanco
Colección ......... rosa empolvado
Editorial ......... vino
Ritual 3 pasos .... marfil
Ingredientes ...... blanco
Fundadora ......... marfil
Comunidad ......... vino
Sets .............. rosa empolvado
Newsletter ........ marfil
Footer ............ vino
```

Verifica la regla de no-repetición leyendo la columna de arriba abajo.

### 3. Componer cada sección
- Elige **un** patrón: rejilla, dividido 42/58, banda a sangre, o carrusel.
- Define la jerarquía: eyebrow → titular → subtítulo → contenido → una acción.
- Decide el encuadre de cada foto (`object-position`) mirando la imagen real,
  no a ojo. Rostros y etiquetas de producto no se cortan.
- Comprueba que el bloque funciona sin la imagen (por si falla la carga).

### 4. Validar contra el material real
Nunca diseñes un hueco que no puedas llenar. Si propones "segunda foto al
hover", confirma que existe una segunda foto. Si propones testimonios, confirma
que hay reseñas reales (**hoy no las hay**).

## Checklist

- [ ] Ninguna temperatura se repite en dos secciones consecutivas.
- [ ] Un solo `h1` en la página, y está en el hero.
- [ ] Una sola cursiva de acento por titular.
- [ ] Un solo CTA primario visible por pantalla.
- [ ] Todas las fotos respetan 4:5, o usan composición dividida justificada.
- [ ] Ningún rostro ni etiqueta queda cortado en ningún breakpoint.
- [ ] Ningún texto se superpone a los ojos de la modelo.
- [ ] Los titulares no se parten en sílabas raras a 360 px ni a 1920 px.
- [ ] Cada sección tiene contenido real detrás, o placeholder marcado.
- [ ] La página no depende del rosa para tener personalidad.

## Errores que debe evitar

- **Inventar contenido para llenar un diseño bonito.** Si no hay reseñas, no
  hay sección de reseñas; hay placeholder marcado o no hay sección.
- **Estrellas vacías o "Sin reseñas aún".** Peor que no mostrar nada.
- **Precios tachados sin vigencia real.** Es publicidad engañosa.
- **Badges "Bestseller" sin histórico de ventas.**
- **Copiar el layout de escritorio a móvil** reduciéndolo.
- **Rellenar con iconos** cuando falta contenido.
- **Degradados sobre rostros** para poder poner texto encima: reordena el
  layout en su lugar.
- **Más de dos familias tipográficas.**
- **Animaciones que sustituyen a la composición.**

## Validaciones obligatorias

Antes de dar por buena una propuesta:

1. Renderiza y captura en 390, 768, 1024 y 1440 (ver `visual-qa-playwright`).
2. Verifica el ritmo de temperaturas mirando la captura de página completa.
3. Verifica en **es y en**: el español es ~20 % más largo y rompe titulares.
4. Comprueba contraste de todo par texto/fondo nuevo (ver
   `accessibility-premium-ui`). No lo estimes: mídelo.
5. Confirma que cada imagen nueva tiene resolución suficiente
   (ver `image-quality-web`).

## Formato del informe

```markdown
## Dirección propuesta
Una frase con la intención visual.

## Recorrido de la home
| # | Sección | Temperatura | Patrón | Contenido real |
|---|---------|-------------|--------|----------------|

## Decisiones y por qué
- <decisión> — <razón ligada al material o a la marca>

## Material que falta
- <qué falta> → <qué sección lo bloquea>

## Capturas
Breakpoints revisados y qué se comprobó en cada uno.
```
