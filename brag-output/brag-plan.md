# Brag Plan: Gaviota by Lia

## What is this app?

Una tienda bilingüe (es/en) de cuidado corporal dominicano: seis productos reales, envíos a Estados Unidos, checkout de Stripe y pedidos de verdad entrando. No es una demo — cobra dinero.

## The angle

Esta marca no necesita que se le invente nada, y ahí está el ángulo: **todo lo que sale en el vídeo existe**. La fotografía es de la marca (17 tomas de estudio de Leslie Estévez sobre ciclorama rosa), los productos son los seis que se venden, el precio es el precio, el modo de uso es el que escribió la marca, y el envío de $14 sale de la misma fila de `shipping_rates` que cobra Stripe.

Nada de «streamline your workflow». Nada de métricas inventadas. El vídeo hace lo mismo que hace la tienda: enseñar el producto y decir cuánto cuesta.

## Hook (first 2-3 seconds)

La fotografía del hero a pantalla completa —la modelo sobre el ciclorama rosa, con manos ofreciéndole los productos alrededor— con un empuje lento, y el titular de la casa entrando encima:

> **Tu piel. Tu *ritual*. Tu momento.**

Una sola cursiva en el titular, que es la firma tipográfica de la marca. No hay claim que superar a esa imagen: es la mejor pieza que tiene el proyecto y es suya.

## Key moments (the middle)

- **Los seis productos llegan de uno en uno** sobre rosa empolvado, cada uno con su nombre real: Aceite Anti-Estrías, Exfoliante de Coco, Crema Hidratante, Tónico para Barba. Packshots de estudio reales a 1200×1200.
- **La compra de verdad**: la ficha del Aceite Anti-Estrías con su precio real (`$50.00 · 115 mL`), el modo de uso tal y como lo escribió la marca («…aplicar después del baño, dos veces al día»), y el botón «Añadir a la bolsa» pulsándose.
- **La bolsa cuadra**: «Envío estimado (EE. UU.) $14.00» y «Total estimado $64.00». Es el número que Stripe cobra, no una estimación de mentira.

## Outro / punchline

Crema, el logotipo oficial, y la línea que la propia tienda lleva bajo el hero:

> Hecho en República Dominicana · Envíos en Estados Unidos
> **gaviotabylia.com**

Sin claim final, sin «disponible ya». El nombre y dónde comprarlo. La contención ES el remate para esta marca.

## User flow worth showing

Sí, y es el centro del vídeo:

1. **Entrada** — la colección: seis productos, precio visible.
2. **Acción** — ficha de producto: precio, modo de uso, «Añadir a la bolsa».
3. **Resultado** — la bolsa con subtotal, envío estimado y total estimado, lista para pagar.

Verificado en producción el 21 de septiembre de 2026. Los tres pasos existen y esas cifras son las reales.

## Tone

- **Preset:** `polished`
- **Creative direction:** película de producto silenciosa — la voz de la marca, no un alarde de quien la programó.
- **Interpretación:** pocas escenas, planos largos, entradas rápidas seguidas de reposos largos. La guía de copy de la marca prohíbe *milagroso*, *revolucionario*, *secreto*, *transformación*; el vídeo hereda esa disciplina. Ningún texto afirma un resultado: solo apariencia, uso y precio. Transiciones por fundido suave (0,6–0,8 s), nunca corte duro.

**Idioma:** español, que es la voz primaria de la marca y la del sitio canónico. La tienda es bilingüe y vende en EE. UU. (los pedidos reales llegan a NY y NJ), así que existe argumento para una versión en inglés — pero se hace después, no se mezcla.

## Format: landscape — 1920x1080
## Duration: 21s

## Visual identity (from the project)

- **Background:** `#f7f0ec` (marfil / crema, la superficie por defecto del sitio)
- **Secondary surface:** `#f3e4ee` (blush) y `#e6c6de` (rosa empolvado)
- **Accent:** `#c9a44a` (champán) y `#6a5304` (oro profundo, para texto sobre crema)
- **Text:** `#3d2b26` (espresso) titulares, `#5e4a42` (body) secundario
- **Display font:** Cormorant (serif, con cursiva de acento)
- **Body font:** Manrope
- **Strongest visual element:** el marco de arco asimétrico del hero (esquinas de 6rem en diagonal, planas en la otra) — es el gesto de marca y debe aparecer al menos una vez.

## Share copy (draft)

Una tienda bilingüe de cuidado corporal dominicano, de cero: seis productos, Stripe, envíos a EE. UU. e inventario que se reserva y se libera solo. gaviotabylia.com

## Audio direction

- **Role:** cama cálida y baja. El sonido acompaña, nunca lidera.
- **Music:** `happy-beats-business-moves-vol-10-by-ende-dot-app.mp3` — el tempo más lento del lote (109,96 BPM), que es lo que pide la contención de `polished`.
- **Music treatment:** entra desde 0 s con fundido de entrada de ~0,8 s, volumen bajo y sostenido, fundido de salida en los últimos 1,5 s. Nada de subidas dramáticas.
- **Music cue guidance:** preset leído de `cues/…vol-10.music-cues.json`. **Strong cue en 20,19 s** — ahí debe asentarse el logotipo del cierre. Rejilla de beats ~0,545 s; para los reveals secuenciales de producto usar **un beat sí y otro no (~1,09 s)**, que respeta el suelo de lectura de 0,8 s por etiqueta corta. Ventana de la secuencia de productos: 5,19 → 9,83 s.
- **Audio-reactive treatment:** ninguno. Nada de barras ni pulsos visibles; esta marca no es audio-reactiva.
- **SFX posture:** escaso y acoplado al movimiento. Como mucho: un tick suave por producto que llega, un clic al pulsar «Añadir a la bolsa». Volumen muy por debajo de la música.
- **Audio-coupled moments:** llegada de los cuatro packshots (uno por cada dos beats); pulsación del botón de compra; asentamiento del logotipo en el strong cue de 20,19 s.
- **Restraint rule:** ningún whoosh, ningún impacto cinematográfico, ningún riser. Si un sonido llama la atención sobre sí mismo, sobra. Silencio antes que efecto de más.

## Storyboard

### Scene 1 — El origen — 5.0s

Fotografía del hero (`public/images/gaviota/hero/hero-desktop.jpg`, 2400×3000) ocupando el cuadro, con el marco de arco asimétrico de la marca. Empuje lento (Ken Burns muy contenido, ~4 % en 5 s). Sobre crema.

Entra el antetítulo en versalitas con tracking amplio, `#6a5304`: `CUIDADO CORPORAL INSPIRADO EN LA BELLEZA DOMINICANA`. Medio segundo después, el titular en Cormorant, `#3d2b26`, con **una sola** palabra en cursiva:

> Tu piel. Tu *ritual*. Tu momento.

Reposo del titular: ≥2,5 s asentado (5 palabras → suelo de 1,5 s, se le da de sobra porque es el gancho).

Sequential/interaction: none.
Audio intent: la cama entra sola, sin marcar nada. Que parezca que el vídeo ya estaba sonando.
Audio-coupled idea: none.
Music: cálida, baja, sin acento.
Transition mood: soft (fundido cruzado 0,7 s) → Scene 2

### Scene 2 — La colección — 5.5s

Fondo blush `#f3e4ee`. Cuatro packshots de estudio reales llegan **de uno en uno**, de izquierda a derecha, cada uno con su nombre debajo en Manrope y su precio:

1. Aceite Anti-Estrías — `aceite-anti-estrias-studio.jpg`
2. Exfoliante de Coco — `exfoliante-de-coco-studio.jpg`
3. Crema Hidratante — `crema-hidratante-studio.jpg`
4. Tónico para Barba — `tonico-para-barba-studio.jpg`

Sequential/interaction: **sí** — llegan uno a uno alineados a un beat sí y otro no (~1,09 s: 5,19 / 6,28 / 7,35 / 8,73 s), cada uno con entrada rápida (~0,35 s) y luego quieto. Los cuatro se quedan en pantalla juntos ~1,3 s antes del corte. Nada se va antes de poder leerse.
Audio intent: cada llegada se nota, pero apenas.
Audio-coupled idea: tick de interfaz muy suave por producto, cuatro en total.
Music: sigue la cama, sin cambio.
Transition mood: soft → Scene 3

### Scene 3 — La compra — 5.5s

El producto haciendo su trabajo, no describiéndolo. Recreación de la ficha real sobre blanco cálido `#fffaf8`:

- `Aceite Anti-Estrías` en Cormorant
- `$50.00 · 115 mL`
- Antetítulo `MODO DE USO` en oro profundo y, debajo, el texto real de la marca: «Aplicar en la zona deseada y masajear con movimientos circulares por unos minutos. Para óptimos resultados, aplicar después del baño, dos veces al día.»
- Botón `Añadir a la bolsa` en champán `#c9a44a`, rectangular (radio 2 px — es el sistema real de la tienda)

Sequential/interaction: **sí** — un cursor entra, pulsa el botón (el botón se hunde un 2 %), y el bloque se sustituye por el resumen de la bolsa: `Subtotal estimado $50.00` → `Envío estimado (EE. UU.) $14.00` → **`Total estimado $64.00`** en grande.

Reposo: el modo de uso son ~30 palabras; a 0,3 s/palabra no cabe leerlo entero, y no hace falta — se lee como textura y la línea que importa («dos veces al día») va destacada en peso. El total se queda ≥1,2 s.
Audio intent: un clic seco y limpio. Es el único momento del vídeo con un sonido que se identifica.
Audio-coupled idea: clic de interfaz al pulsar; nada al aparecer el total.
Music: sin cambio.
Transition mood: soft → Scene 4

### Scene 4 — La firma — 5.0s

Crema `#f7f0ec` limpia. El logotipo oficial (`public/images/gaviota/brand/logo-oficial-transparent.png`) entra en fundido y escala muy corta, y **se asienta en el strong cue de 20,19 s**.

Debajo, en Manrope pequeño y espaciado:

> HECHO EN REPÚBLICA DOMINICANA · ENVÍOS EN ESTADOS UNIDOS
> **gaviotabylia.com**

Sequential/interaction: none.
Audio intent: la música se retira sola. El último segundo casi en silencio.
Audio-coupled idea: none. Ningún golpe de logotipo — sería exactamente el gesto que esta marca no hace.
Music: fundido de salida de 1,5 s hasta cero.
Transition mood: fin.

**Music mood for this video:** cálida y contenida — presente, nunca protagonista.
**Audio summary:** una cama baja y constante que entra sin anunciarse, marca apenas la llegada de los cuatro productos y un solo clic de compra, y se retira en el cierre para dejar el logotipo en silencio.

---

## Reglas que este vídeo no rompe

- **Ninguna cifra inventada.** Precio, tamaño, envío, total y modo de uso son los de producción, verificados el 21 de septiembre de 2026.
- **Ningún dato de cliente.** Durante la sesión se vieron nombres, correos y direcciones reales de compradoras en Stripe. Nada de eso entra aquí, ni como ejemplo ni disfrazado.
- **Ninguna afirmación cosmética nueva.** El único texto de producto es el modo de uso que ya está publicado. Nada de resultados, porcentajes ni plazos.
- **Ninguna reseña ni testimonio.** No hay reseñas aprobadas en la tienda; inventar una para el vídeo sería justo lo que la guía de la marca prohíbe.
- **Una sola cursiva por titular**, según la firma tipográfica de la marca.
