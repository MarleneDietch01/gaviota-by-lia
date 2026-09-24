# Hyperframes Composition Brief: Gaviota by Lia

## Objective

Crear un vídeo corto de lanzamiento para Gaviota by Lia, una tienda bilingüe de cuidado corporal dominicano que ya vende de verdad.

## Output

- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21s

## Source Material

- **Project root:** `D:/dev/Gaviota By Lia`
- **Primary files read:** `src/app/globals.css` (tokens `@theme`), `src/lib/content/sections.ts` (copy del hero), `src/lib/catalog/products.ts` (productos reales), `src/components/sections/hero.module.css` (el gesto de arco), `public/images/gaviota/image-manifest.json`
- **Product name:** Gaviota by Lia
- **Tagline / strongest claim:** `Tu piel. Tu ritual. Tu momento.`
- **Key UI or visual moment to recreate:** la ficha de producto real — precio, modo de uso y el botón «Añadir a la bolsa» — seguida del resumen de la bolsa con envío y total estimados.

**Copy que debe aparecer literal** (todo está publicado hoy; no inventar nada):

- `CUIDADO CORPORAL INSPIRADO EN LA BELLEZA DOMINICANA`
- `Tu piel. Tu ritual. Tu momento.` — *ritual* en cursiva, una sola cursiva en el titular
- `Aceite Anti-Estrías` / `Exfoliante de Coco` / `Crema Hidratante` / `Tónico para Barba`
- `$50.00 · 115 mL`
- `MODO DE USO`
- `Aplicar en la zona deseada y masajear con movimientos circulares por unos minutos. Para óptimos resultados, aplicar después del baño, dos veces al día.`
- `Añadir a la bolsa`
- `Subtotal estimado $50.00`
- `Envío estimado (EE. UU.) $14.00`
- `Total estimado $64.00`
- `HECHO EN REPÚBLICA DOMINICANA · ENVÍOS EN ESTADOS UNIDOS`
- `gaviotabylia.com`

**Imágenes locales a usar** (rutas relativas al project root):

- `public/images/gaviota/hero/hero-desktop.jpg` (2400×3000) — escena 1
- `public/images/gaviota/products/aceite-anti-estrias-studio.jpg` (1200×1200)
- `public/images/gaviota/products/exfoliante-de-coco-studio.jpg` (1200×1200)
- `public/images/gaviota/products/crema-hidratante-studio.jpg`
- `public/images/gaviota/products/tonico-para-barba-studio.jpg`
- `public/images/gaviota/brand/logo-oficial-transparent.png` — escena 4

Cópialas a `brag-output/composition/assets/img/`. No las recortes a 16:9: la fotografía nativa de esta marca es 4:5 vertical y forzar un panorámico decapita a la modelo. Si hace falta ancho, usa composición dividida o el marco de arco.

## Creative Direction

- **Tone preset:** `polished`
- **Creative direction:** película de producto silenciosa — la voz de la marca, no un alarde de quien la programó.
- **Interpretation:** cuatro escenas, planos largos, entradas rápidas (0,3–0,45 s) seguidas de reposos largos. Transiciones por fundido cruzado suave de 0,6–0,8 s, **nunca corte duro**. Tipografía en caja mixta, peso ligero-medio, tracking generoso.
- **Angle:** esta marca no necesita que se le invente nada. Todo lo que sale en el vídeo existe: la fotografía es suya, los productos son los seis que vende, el precio es el precio, el modo de uso lo escribió ella y el envío de $14 sale de la misma configuración que cobra Stripe. El vídeo hace lo mismo que hace la tienda — enseñar el producto y decir cuánto cuesta.
- **Hook:** la fotografía del hero a pantalla completa con empuje lento y el titular de la casa entrando encima.
- **Outro / punchline:** logotipo, origen y dominio. Sin claim final, sin «disponible ya». La contención es el remate.

**Avoid:**

- Lenguaje SaaS genérico
- Visuales abstractos de relleno
- Rediseñar la marca: la paleta, las tipografías y el gesto de arco son los que hay
- Palabras prohibidas por la guía de la marca: *milagroso*, *revolucionario*, *secreto*, *anti-edad*, *elimina*, *transformación*, *clínicamente probado*
- Cualquier afirmación de resultado. Solo apariencia, uso y precio.
- Estrellas, reseñas o testimonios: **no hay ninguna reseña aprobada en la tienda**, así que inventarla queda descartado
- Palmeras, hojas tropicales, arena o degradados turquesa: lo dominicano se expresa con la fotografía real

## Visual Identity

- **Background:** `#f7f0ec` (marfil)
- **Secondary surfaces:** `#f3e4ee` (blush), `#e6c6de` (rosa empolvado), `#fffaf8` (blanco cálido)
- **Text:** `#3d2b26` (espresso, titulares) · `#5e4a42` (body) · `#6a5304` (oro profundo, antetítulos sobre crema)
- **Accent:** `#c9a44a` (champán — es el color del botón de compra real)
- **Display font:** Cormorant (serif). Fallback: 'Iowan Old Style', Georgia, serif.
- **Body font:** Manrope. Fallback: system-ui, sans-serif.
- **Visual references from the project:**
  - El **marco de arco asimétrico** del hero: esquinas superior-izquierda e inferior-derecha muy redondeadas (6rem), las otras dos casi rectas (2px). Es la firma visual; úsalo al menos una vez.
  - Botones **rectangulares**, radio 2px. La tienda no usa botones píldora para acciones de texto.
  - Antetítulos en versalitas con tracking amplio, en oro profundo.

## Storyboard

La contrata creativa es el storyboard de `brag-output/brag-plan.md`. Resumen:

1. **El origen** — 5,0 s — foto del hero con arco y empuje lento; antetítulo de origen; titular `Tu piel. Tu *ritual*. Tu momento.` con reposo ≥2,5 s.
2. **La colección** — 5,5 s — cuatro packshots reales llegan de uno en uno sobre blush, cada uno con su nombre; los cuatro se quedan juntos ~1,3 s.
3. **La compra** — 5,5 s — ficha real (precio, modo de uso, botón champán); cursor pulsa; se sustituye por el resumen de bolsa hasta `Total estimado $64.00`.
4. **La firma** — 5,0 s — logotipo oficial asentándose, origen y dominio sobre crema.

## Audio

- **Audio role:** cama cálida y baja. Acompaña, nunca lidera.
- **Audio arc:** entra sin anunciarse, marca apenas las cuatro llegadas de producto y un único clic de compra, y se retira en el cierre para dejar el logotipo casi en silencio.
- **Music:** `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` (109,96 BPM — el más lento del lote, que es lo que pide la contención).
- **Music treatment:** entra en 0 s con fundido de ~0,8 s, volumen bajo y constante, fundido de salida de 1,5 s al final. Sin subidas dramáticas.
- **Music cue guidance:** preset en `<skill-dir>/assets/music/cues/happy-beats-business-moves-vol-10-by-ende-dot-app.music-cues.json`.
  - **Strong cue en 20,19 s** → ahí debe asentarse el logotipo (escena 4). Es el único lock obligatorio.
  - Rejilla de beats ~0,545 s. Para la secuencia de productos usa **un beat sí y otro no** (~1,09 s): 5,19 / 6,28 / 7,35 / 8,73 s. A cada beat sería 0,545 s y no da tiempo a leer el nombre.
- **Audio-reactive treatment:** **sutil**. Solo la calidez del fondo y la presencia (sombra/vignette) de la foto del hero responden al RMS, con amplitud muy baja — que respire, no que pulse. Prohibido: barras de espectro, ondas, partículas, notas musicales, estroboscopia.
- **SFX posture:** escaso y acoplado al movimiento.
- **Audio-coupled moments:**
  - Escena 2, llegada de cada packshot — tick de interfaz muy suave, cuatro en total, al mismo timestamp que el visual
  - Escena 3, pulsación de `Añadir a la bolsa` — un clic seco. Es el único sonido del vídeo que se identifica como tal.
  - Escena 4, asentamiento del logotipo — **ningún golpe**. Esta marca no hace ese gesto.
- **SFX selection guidance:** prefiere `ui/` e `interface/`. Nada de whooshes, impactos cinematográficos ni risers. Si un sonido llama la atención sobre sí mismo, sobra.
- **SFX analysis guidance:** `<skill-dir>/assets/sfx/sfx-analysis.md`. Elige ficheros de bajo riesgo en altas frecuencias: los cuatro ticks son repetidos y el acabado es premium.
- **Exact SFX choice:** decídela tú después de que exista la animación.
- **Audio files:** copia la música y los SFX elegidos a `brag-output/composition/assets/`.

## Hyperframes Instructions

Carga las skills de dominio — `hyperframes-core`, `hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`. **No entres en la entrevista de intención del punto de entrada `hyperframes` ni en su workflow genérico de promo/launch.** Prefiere las convenciones nativas de Hyperframes sobre cualquier cosa de `/brag`.

Requisitos:

- Mostrar al menos un elemento real de UI, copy o visual del proyecto — aquí son varios, y son el centro.
- Todo el texto legible en el render final. Respeta los suelos de lectura del plan.
- Duración total 15–25 s (objetivo 21 s).
- Incluir la capa de música y SFX descrita.
- Las notas de audio de `/brag` son guía, no una hoja de cues cerrada.
- Los cues de música son pistas opcionales de timing: ignóralos donde perjudiquen la legibilidad o el ritmo.
- Un solo strong-cue lock obligatorio (logotipo en 20,19 s, ±0,15 s). Los reveals de producto al beat grid (±0,10 s).
- Usa assets locales para audio y runtime.
- Ejecuta `hyperframes check` antes de renderizar — es la única puerta de `/brag`.

## Restricción de privacidad (no negociable)

Durante la sesión que produjo este brief se consultó la cuenta de Stripe en vivo y se vieron **nombres, correos y direcciones reales de compradoras**. Nada de eso entra en el vídeo, ni literal ni disfrazado ni como «ejemplo verosímil». Los únicos datos que aparecen son de catálogo y de política pública: nombres de producto, precios, tamaño, tarifa de envío y el dominio.
