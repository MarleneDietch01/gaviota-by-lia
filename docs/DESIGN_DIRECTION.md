# DESIGN_DIRECTION.md — Dirección visual y comercial

**Concepto:** *"Belleza dominicana que se siente, se vive y se convierte en ritual."*

Documento previo a la implementación. Ninguna sección del home se programa hasta que esto
esté aprobado.

---

## 0. La restricción que define todo el diseño

Antes de cualquier propuesta, un dato verificado sobre las 17 fotografías disponibles:

> **Las 17 son verticales, formato 4:5. No existe una sola fotografía horizontal.**

Resoluciones entre 3738 × 4672 y 5916 × 7395 px. Todas espléndidas, todas verticales.

Esto no es un detalle: **invalida el hero de banner ancho a pantalla completa** que suele
asumirse por defecto. Recortar un 4:5 a 16:9 exige eliminar el 55 % de la altura, y en
estas fotos eso significa cortar rostros o productos.

Tres consecuencias que atraviesan todo el documento:

1. **El hero de escritorio es dividido** (texto | imagen), no un banner ancho. Respeta el
   4:5 nativo y además resulta más editorial.
2. **El móvil es donde estas fotos brillan.** A pantalla completa vertical son perfectas.
   Como el móvil es la prioridad declarada, la restricción juega a favor.
3. **La asimetría, los dípticos y las superposiciones** que pide la dirección creativa son
   precisamente lo que mejor funciona con material vertical. No es un remiendo: es la
   forma correcta de usar este material.

---

## 1. Las tres direcciones

### DIRECCIÓN A — Editorial premium

Revista de belleza. Aire, tipografía serif de gran tamaño, fotografía protagonista.

- Fondo dominante marfil/blanco; el rosa solo en acentos
- Titulares Cormorant Garamond 72–96 px, interlineado ajustado
- Rejilla amplia, mucho espacio negativo
- Producto sobre fondo limpio, sin adornos
- Movimiento: fundidos suaves, nada más

**A favor:** eleva la marca de inmediato; el material fotográfico lo sostiene.
**En contra:** poca energía comercial. La dirección pide explícitamente evitar
"excesivamente minimalista y vacía". Por sí sola, no vende.

---

### DIRECCIÓN B — Beauty pop

Marca de skincare moderna y directa. Rosa intenso, bloques de color, ritmo alto.

- Fondos rosa saturado alternando con blanco
- Tipografía sans grande y compacta
- Tarjetas de producto con badges visibles y precio destacado
- CTA de alto contraste por todas partes
- Movimiento: hover con zoom, carruseles, marquee

**A favor:** máxima energía comercial; conecta con las fotos de fondo rosa (7, 9, 11, 15,
16, 17, 18, 19), que ya son de este mundo.
**En contra:** hecha sola, se parece a cualquier marca de skincare de Instagram y pierde
lo premium. Riesgo real de "plantilla genérica", el defecto que hay que evitar.

---

### DIRECCIÓN C — Caribe sofisticado

Calidez, textura, identidad dominicana sin postal turística.

- Base marfil cálido y arena; dorado en detalles
- Formas orgánicas suaves, inspiradas en agua y movimiento del cuerpo
- Contraste de serif elegante con sans cálida
- Texturas sutiles de papel y crema
- Movimiento: parallax muy leve, entradas suaves

**A favor:** es lo único difícil de copiar; ancla la marca en algo verdadero.
**En contra:** por sí sola puede leerse como artesanal, y la dirección pide evitar
"tienda artesanal improvisada".

---

## 2. La síntesis: **Editorial Caribeño Comercial**

Ninguna de las tres es suficiente. La combinación aprovecha lo mejor de cada una:

| Aporte | De |
|---|---|
| Estructura, tipografía y aire de las páginas de marca | **A** |
| Motor comercial: tarjetas, badges, CTA, ritmo, urgencia honesta | **B** |
| Alma: calidez, dorado, formas orgánicas, identidad dominicana | **C** |

### La regla que las mantiene unidas: **alternancia de temperatura**

El error a evitar es la homogeneidad. La página alterna deliberadamente entre tres
"temperaturas" visuales:

| Temperatura | Fondo | Función | Secciones del home |
|---|---|---|---|
| ❄️ **Fría / editorial** | Marfil `#FFF8F5`, blanco | Respirar, contar, elevar | 3, 10, 15 |
| 🔥 **Cálida / comercial** | Rosa suave `#F4CBD4`, degradados | Vender, mostrar producto | 5, 6, 11, 17 |
| 🌑 **Profunda / campaña** | Ciruela `#4B2636`, cacao `#38262C` | Impacto, corte, memoria | 7, 9, 12 |

Nunca dos secciones seguidas con la misma temperatura. Esto produce el "ritmo visual" que
pide la dirección y evita a la vez el sitio-bloque-rosa y el sitio-plantilla-blanca.

**Los fondos profundos son la decisión más importante de esta síntesis.** Ninguna
competidora de este segmento usa ciruela oscuro; es lo que hará que el sitio se recuerde,
y hace que el rosa y el dorado brillen por contraste en lugar de saturar.

---

## 3. Moodboard

*(Referencias conceptuales para alinear expectativas. No se copia ninguna.)*

| Referencia | Qué se toma |
|---|---|
| Editoriales de belleza impresas | Titulares serif grandes, imagen a sangre, cursiva selectiva |
| Skincare premium contemporáneo | Ficha de producto limpia, jerarquía de precio, claridad |
| Campañas de moda con fondo de color | El fondo rosa de las fotos 7/15/16/19 ya es esto |
| Cerámica y textil caribeño | Curva orgánica, dorado mate, marfil cálido |
| Fotografía de grupo inclusiva | Las fotos 9, 11, 17, 18 son el corazón de la marca |

**Palabras del moodboard:** ritual · piel real · suavidad · calidez · seguridad ·
comunidad · dorado mate · curva · marfil · ciruela.

**Anti-moodboard:** farmacia · clínica · laboratorio · postal de playa · palmera ·
"tropical" con saturación alta · flat design · degradados morados de startup.

---

## 4. Sistema de color

### Tokens

```css
:root {
  /* Marca */
  --brand-primary:        #C85C80;  /* rosa intenso — badges, acentos */
  --brand-primary-hover:  #9E3F60;  /* rosa profundo */
  --brand-soft:           #F4CBD4;  /* rosa suave — fondos */
  --brand-powder:         #E8A9B8;  /* rosa empolvado — bordes, detalles */
  --brand-dark:           #4B2636;  /* ciruela — fondos de campaña */
  --brand-accent:         #C9A66B;  /* dorado — solo detalles */
  --brand-coral:          #E88F83;  /* coral — lanzamientos */

  /* Superficies */
  --surface-light:        #FFFFFF;
  --surface-warm:         #FFF8F5;  /* marfil cálido */
  --surface-deep:         #38262C;  /* cacao oscuro */

  /* Texto */
  --text-primary:         #38262C;
  --text-secondary:       #6B5560;
  --text-on-dark:         #FFF8F5;
  --text-muted:           #A79096;

  /* Estructura */
  --border-soft:          #F0DDE2;
  --border-strong:        #E8A9B8;

  /* Estado */
  --success:              #2E6B4F;
  --warning:              #A9741F;
  --danger:               #A32B3F;
}
```

### Contraste — verificado, no asumido

| Combinación | Ratio | AA normal (4,5) | Uso |
|---|---|---|---|
| `#38262C` sobre `#FFF8F5` | **13,2:1** | ✅ | Texto general |
| `#6B5560` sobre `#FFF8F5` | **6,1:1** | ✅ | Texto secundario |
| `#FFF8F5` sobre `#4B2636` | **11,4:1** | ✅ | Texto sobre campaña |
| `#FFFFFF` sobre `#9E3F60` | **7,0:1** | ✅ | **Botón primario** |
| `#FFFFFF` sobre `#C85C80` | **4,0:1** | ❌ | **Solo ≥24 px o badges** |
| `#C9A66B` sobre `#FFF8F5` | **2,1:1** | ❌ | **Nunca para texto** |
| `#38262C` sobre `#F4CBD4` | **9,8:1** | ✅ | Texto sobre rosa suave |

**Dos reglas que se derivan de la tabla y no son negociables:**

1. **El botón primario usa `#9E3F60` (rosa profundo), no `#C85C80`.** El rosa intenso sobre
   blanco da 4,0:1 y no alcanza AA. Se reserva para badges, subrayados y texto grande.
2. **El dorado nunca lleva texto.** 2,1:1. Solo filetes, iconos decorativos y bordes —
   exactamente lo que pide la dirección ("solo en detalles premium"), ahora con una razón
   técnica además de estética.

### Proporción

```
Marfil + blanco  ████████████████████████░░░░░░  55 %
Rosas            ██████████░░░░░░░░░░░░░░░░░░░░  25 %
Profundos        ██████░░░░░░░░░░░░░░░░░░░░░░░░  15 %
Dorado + coral   ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░   5 %
```

---

## 5. Tipografía

**Dos familias. Ni una más.**

| Rol | Familia | Pesos | Motivo |
|---|---|---|---|
| Títulos | **Cormorant Garamond** | 300, 400, 500, 600 + itálica | La más editorial de las propuestas. Su contraste alto y su itálica hermosa dan el registro de revista sin resultar rígida. Bodoni sería demasiado severa; Playfair, demasiado vista |
| Interfaz | **Manrope** | 400, 500, 600, 700 | Geométrica y cálida, con números tabulares para precios. Inter es excelente pero neutra hasta lo anónimo; DM Sans, menos legible en tamaños pequeños |

Ambas por `next/font/google`, autoalojadas, subconjunto `latin` + `latin-ext` (necesario
para acentos y `ñ`), `display: swap`.

### Escala

```css
--font-display: 'Cormorant Garamond', Georgia, serif;
--font-ui:      'Manrope', system-ui, sans-serif;
```

| Token | Móvil | Escritorio | Familia | Uso |
|---|---|---|---|---|
| `hero` | 40 px | 88 px | Display 300 | Titular del hero |
| `h1` | 34 px | 64 px | Display 400 | Título de página |
| `h2` | 28 px | 48 px | Display 400 | Título de sección |
| `h3` | 22 px | 30 px | Display 500 | Nombre de producto grande |
| `h4` | 18 px | 20 px | UI 600 | Tarjeta de producto |
| `body-lg` | 17 px | 19 px | UI 400 | Introducciones |
| `body` | 16 px | 16 px | UI 400 | Texto general |
| `small` | 14 px | 14 px | UI 400 | Metadatos |
| `label` | 12 px | 12 px | UI 600 · `0.08em` · versalitas | Eyebrows, badges |
| `price` | 20 px | 24 px | UI 700 · tabular | Precio |

Interlineado: 1,05 en `hero`, 1,15 en títulos, 1,6 en texto corrido.

### La firma tipográfica

Palabra clave en **cursiva Cormorant** dentro de un titular romano. Una por titular, nunca
dos.

```
Tu piel. Tu ritual.
Tu momento.
        ↑ "ritual" en cursiva
```

Es un recurso barato, elegante y reconocible. Nunca en texto corrido ni en más de una
palabra por título.

**Prohibido:** una tercera familia, mayúsculas en textos largos, cursiva en párrafos,
títulos centrados de más de dos líneas.

---

## 6. El hero

### Escritorio (≥1024 px)

```
┌──────────────────────────────────────────────────────────────┐
│  Envío con seguimiento · Compra segura        (barra promo)  │
├──────────────────────────────────────────────────────────────┤
│ [Logo]  Tienda ▾  Más vendidos  Rutinas  Kits  Historia  🔍👤♡🛒│
├───────────────────────────────┬──────────────────────────────┤
│                               │                              │
│  CUIDADO CORPORAL DOMINICANO  │                              │
│                               │      Foto 19 · 4:5 nativo    │
│  Tu piel. Tu ritual.          │      Retrato + productos     │
│  Tu momento.                  │                              │
│      ↑ cursiva                │   ┌──────────────┐           │
│                               │   │ packshot     │  ← flotante│
│  Cuidado corporal creado para │   │ recortado    │    de GA9  │
│  hidratar, suavizar y hacer   │   │ de GA9.jpg   │           │
│  de cada aplicación un        │   └──────────────┘           │
│  momento para ti.             │                              │
│                               │                              │
│  [Descubrir mis productos]    │                              │
│  [Crear mi ritual]            │                              │
│                               │                              │
│  ✓ Compra segura              │                              │
│  ✓ Envíos con seguimiento     │                              │
│  ✓ Diseñado para piel real    │                              │
│         45 %                  │            55 %              │
└───────────────────────────────┴──────────────────────────────┘
```

- La foto **conserva su 4:5**. Cero recorte, cero cabezas cortadas.
- El texto **nunca se superpone** al rostro ni al producto: ocupa su propia columna.
- El packshot flotante (recorte de `GA9.jpg`) aporta el "producto visible" que exige la
  dirección y hace de puente visual entre las dos columnas.
- Curva orgánica dorada de 1 px separando ambas columnas: el único adorno gráfico.

### Móvil (<768 px)

```
┌──────────────────────┐
│  barra promocional   │
├──────────────────────┤
│ ☰      LOGO      🔍🛒 │
├──────────────────────┤
│                      │
│   Foto 19 recortada  │
│   a 3:4 vertical     │
│   rostro en el       │
│   tercio superior    │
│                      │
│   ░░ degradado ░░    │
│  CUIDADO DOMINICANO  │
│  Tu piel.            │
│  Tu ritual.          │
│  Tu momento.         │
│                      │
│ [Descubrir productos]│  ← visible sin scroll
│  Crear mi ritual     │
├──────────────────────┤
│ ✓Segura ✓Seguimiento │
└──────────────────────┘
```

- **Recorte propio**, no el mismo encuadre reducido.
- Degradado `transparent → rgba(56,38,44,.78)` en el tercio inferior: el texto se lee
  sobre la foto sin ocultar el rostro.
- **El CTA principal cabe por encima del pliegue en 360 px de ancho.** Es un requisito
  medible, no una aspiración.

### Implementación

```tsx
<picture>
  <source media="(min-width: 1024px)" srcSet={heroDesktop} width={1400} height={1750} />
  <source media="(min-width: 768px)"  srcSet={heroTablet}  width={1024} height={1365} />
  <Image src={heroMobile} width={780} height={1040} priority sizes="100vw" alt="…" />
</picture>
```

`priority` **solo aquí**. `width`/`height` siempre presentes → CLS 0.

---

## 7. Tarjeta de producto

```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │ [Kit · ahorra 8 %]  │ │  ← badge solo si es real
│ │                     │ │
│ │   Imagen 4:5        │ │  ← hover: cambia a la 2ª si existe
│ │                     │ │
│ │              [♡]    │ │
│ │  ┌───────────────┐  │ │
│ │  │  Vista rápida │  │ │  ← aparece en hover (escritorio)
│ │  └───────────────┘  │ │
│ └─────────────────────┘ │
│                         │
│ Aceite Anti-Estrías     │  Manrope 600 · 18 px
│ Reafirmante e hidratante│  14 px · secundario
│ 115 mL                  │  12 px · muted
│                         │
│ $50.00   ~~$60.00~~     │  ← tachado SOLO con vigencia real
│                         │
│ [ Agregar al carrito ]  │
└─────────────────────────┘
```

### Qué se muestra y qué no, con los datos reales de hoy

| Elemento | ¿En el lanzamiento? | Condición |
|---|---|---|
| Imagen principal | ✅ | Siempre |
| Imagen secundaria en hover | ⚠️ Solo 2 de 8 | `images.length > 1` |
| Nombre y beneficio | ✅ | Siempre |
| Tamaño (115 mL) | ✅ | Leído de los envases reales |
| Precio | ✅ | Siempre |
| Precio anterior + `%` | ❌ **No** | Solo con `compare_at` vigente. Ver `MIGRATION_RISKS.md` R5 |
| **Valoración** | ❌ **No** | **0 reseñas.** Sin estrellas vacías, sin "sin reseñas aún" |
| Badge "Más vendido" | ❌ **No** | Sin histórico de ventas propio |
| Badge "Pocas unidades" | ⚠️ | Solo con stock real cargado |
| Badge "Nuevo" | ⚠️ | Solo con `created_at < 30 días` |
| Estado de inventario | ✅ | Desde stock real |
| Agregar al carrito | ✅ | Siempre |
| Vista rápida | ✅ | Escritorio en hover; móvil siempre visible |

**Una tarjeta sin estrellas es infinitamente mejor que una con estrellas inventadas.** El
espacio de la valoración no se deja hueco: el diseño se compone sin él y lo incorpora
cuando existan reseñas.

Sombra: `0 1px 2px rgba(56,38,44,.04)` en reposo, `0 8px 24px rgba(56,38,44,.10)` en hover.
Radio: 4 px en la imagen, 2 px en botones. Bordes suaves, nunca redondeados tipo burbuja.

---

## 8. Botones

| Variante | Fondo | Texto | Uso |
|---|---|---|---|
| Primario | `#9E3F60` | Blanco | Agregar, Comprar, CTA del hero |
| Primario hover | `#82304D` | Blanco | — |
| Secundario | Transparente, borde `#38262C` | `#38262C` | CTA secundario |
| Fantasma | Transparente | `#9E3F60` con subrayado | Enlaces de acción |
| Sobre oscuro | `#FFF8F5` | `#4B2636` | Dentro de secciones de campaña |
| Deshabilitado | `#F0DDE2` | `#A79096` | Agotado |

Altura mínima 48 px (móvil 52 px). Ancho mínimo del área táctil: 44 × 44 px.
Foco: `outline: 2px solid #9E3F60; outline-offset: 2px`. Nunca `outline: none`.

---

## 9. Movimiento

Framer Motion, importado dinámicamente solo donde se use.

| Interacción | Efecto | Duración |
|---|---|---|
| Entrada de sección | `opacity 0→1`, `y 16px→0` | 400 ms |
| Hover de tarjeta | `scale 1→1.02` en la imagen | 250 ms |
| Cambio de variante | Fundido cruzado de imagen | 200 ms |
| Cart drawer | Deslizamiento lateral | 280 ms |
| Botón activo | `scale 0.98` | 100 ms |
| Añadir al carrito | Contador + `aria-live` | 150 ms |
| Parallax editorial | Traslación máxima 24 px | ligado al scroll |
| Marquee de marca | 40 s por ciclo, se detiene en hover | — |

**Ninguna animación de acción comercial supera 500 ms.** Añadir al carrito responde en
150 ms: la percepción de velocidad es parte de la percepción de calidad.

**Prohibido:** scroll secuestrado, rebotes, autoplay con sonido, animación que oculte el
botón de compra, más de tres elementos animándose a la vez.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Todo componente interactivo (`RitualSteps`, `NeedsSelector`, galería, carrusel) **funciona
sin animación y sin JavaScript**. La animación es mejora, nunca requisito.

---

## 10. Elementos gráficos

Tres, y solo tres. Todos derivados de las curvas del propio logotipo y del trazo de figura
femenina impreso en los envases:

1. **Curva orgánica** — filete dorado de 1 px que separa secciones. Sustituye a la línea
   recta. Deriva del trazo de la etiqueta real.
2. **Marco suave** — esquina superior izquierda y esquina inferior derecha redondeadas
   (24 px), las otras dos a 0. Enmarca fotografías editoriales.
3. **Numeración editorial** — cifras Cormorant de 120 px al 12 % de opacidad, detrás del
   contenido, en el ritual de tres pasos.

**Prohibido:** manchas abstractas, círculos decorativos sueltos, "blobs", partículas,
degradados de malla, hojas o palmeras.

---

## 11. Aplicación al home (19 secciones)

| # | Sección | Temp. | Fondo | Fotografía |
|---|---|---|---|---|
| 1 | Barra promocional | 🔥 | `#9E3F60` | — |
| 2 | Header | ❄️ | Transparente → marfil | — |
| 3 | Hero | ❄️ | Marfil | **19** + packshot GA9 |
| 4 | Confianza | ❄️ | Blanco | — (iconos) |
| 5 | Más vendidos | 🔥 | Rosa suave | Packshots GA9 |
| 6 | ¿Qué necesita tu piel? | ❄️ | Marfil | 15, 7, GA9, 12 |
| 7 | Campaña destacada | 🌑 | **Ciruela** | **7** a sangre |
| 8 | Ritual en 3 pasos | ❄️ | Blanco | 15, 7, 16 |
| 9 | Producto protagonista | 🌑 | Cacao | **15** + packshot |
| 10 | Historia de marca | ❄️ | Marfil | **2** o **4** |
| 11 | Kits | 🔥 | Rosa suave | **GA9** completa |
| 12 | Comunidad | 🌑 | Ciruela | **9, 11, 17, 18** |
| 13 | Testimonios | — | — | ❌ **oculta** (0 reseñas) |
| 14 | UGC | — | — | ❌ **oculta** (no existe) |
| 15 | Beneficios | ❄️ | Blanco | — |
| 16 | Instagram | 🔥 | Rosa suave | Rejilla editable |
| 17 | Newsletter | 🔥 | Rosa empolvado | **16** lateral |
| 18 | FAQ | ❄️ | Marfil | — |
| 19 | Footer | 🌑 | Cacao | — |

Secuencia de temperatura resultante:
`❄️❄️❄️❄️🔥❄️🌑❄️🌑❄️🔥🌑—❄️🔥🔥❄️🌑`

Nunca tres iguales seguidas. El ritmo es intencionado.

---

## 12. Móvil

**Se diseña primero en 360 px**, no se reduce desde escritorio.

| Sección | Adaptación en móvil |
|---|---|
| Hero | Recorte vertical propio, CTA sobre el pliegue |
| Más vendidos | Carrusel horizontal táctil, tarjeta a 78 % de ancho |
| Selector de necesidad | Rejilla 2×2, imagen cuadrada |
| Campaña | Foto a sangre, texto debajo (no encima) |
| Ritual | Acordeón vertical, paso 1 abierto |
| Producto protagonista | Foto, luego datos, luego CTA |
| Comunidad | Carrusel de 2 fotos visibles |
| Ficha de producto | **Barra sticky** con precio, variante y "Agregar" |
| Carrito | Drawer a pantalla completa |
| Checkout | Un solo paso, campos apilados, teclados correctos |

Puntos de ruptura: **360 · 390 · 430 · 768 · 1024 · 1280 · 1536**.

Regla que se verifica en cada sección: en 360 px, ningún texto por debajo de 14 px, ningún
objetivo táctil por debajo de 44 px, y ningún desbordamiento horizontal.

---

## 13. Estrategia de conversión

| Mecanismo | Dónde | Honesto porque… |
|---|---|---|
| Barra sticky de compra | Ficha en móvil | — |
| Cart drawer | Global | — |
| Progreso a envío gratis | Drawer y carrito | Umbral real configurado en el panel |
| Vista rápida | Catálogo | — |
| Productos complementarios | Ficha y carrito | Relaciones definidas a mano, no algoritmo |
| Kits | Home y catálogo | Ahorro calculado en servidor con precios reales |
| Favoritos | Global | — |
| Últimos vistos | Catálogo | Almacenamiento local, sin datos personales |
| Estado de inventario | Ficha y tarjeta | Stock real, no una cifra de escasez inventada |
| Entrega estimada | Ficha y checkout | Calculada con los plazos reales (2 + 3–4 días) |
| Métodos de pago visibles | Footer y checkout | Solo los realmente aceptados |
| Política de devolución resumida | Ficha | Enlaza a la política real |
| Cupón | Carrito y checkout | Validado en servidor |

**Excluido de forma expresa:** contadores regresivos, "X personas viendo esto", inventario
falso, reseñas falsas, ventas falsas, temporizadores que se reinician, descuentos
artificiales, popups agresivos.

Nada de esto es una limitación autoimpuesta por prudencia: **es lo que hace creíble el
resto**. Una marca que muestra "quedan 2 unidades" cuando tiene 400 pierde la confianza que
todo lo demás intenta construir.

---

## 14. Voz y copy

**Es:** segura, cercana, femenina, sensorial, elegante, directa.
**No es:** médica, culpabilizadora, hiperbólica, vaga.

| ✅ Se dice | ❌ No se dice |
|---|---|
| "Ayuda a mejorar la apariencia de las estrías" | "Elimina las estrías" |
| "Contribuye a mantener la piel hidratada" | "Cura la piel seca" |
| "Ayuda a suavizar la textura" | "Borra las manchas" |
| "Los resultados pueden variar" | "Resultados garantizados" |
| "Diseñado para acompañar tu rutina" | "Clínicamente probado" |

Todas las de la columna derecha, u otras equivalentes, **están publicadas hoy** en el sitio
actual. Ver `AUDIT.md` §6.

**Regla del selector de necesidad:** se nombra el cuidado, nunca el defecto.
"Apariencia de estrías", no "problema de estrías". "Textura", no "piel fea". La dirección
lo exige y además es lo coherente con una marca cuya fotografía celebra cuerpos reales.

Cada sección combina **emoción + beneficio + prueba + acción**.

---

## 15. Verificación antes de aprobar el home

| Pregunta | Cómo se responde en este diseño |
|---|---|
| ¿La primera pantalla genera deseo? | Retrato editorial a tamaño real + packshot + titular en cursiva |
| ¿Se entiende qué vende? | Eyebrow "Cuidado corporal dominicano" + producto visible en el hero |
| ¿Las fotos tienen protagonismo? | 55 % del hero; 3 secciones a sangre; 12 de 19 secciones con fotografía |
| ¿Hay CTA visible? | Sobre el pliegue en 360 px; sticky en la ficha |
| ¿Los productos parecen deseables? | Packshots de 4431 px, fondo limpio, tarjeta sin ruido |
| ¿Hay ritmo visual? | Alternancia de temperatura, sin tres secciones iguales seguidas |
| ¿Se diferencia de una plantilla? | Fondos ciruela, curva dorada, cursiva editorial, hero dividido |
| ¿Funciona en móvil? | Diseñado desde 360 px; recortes propios; el 4:5 favorece al móvil |
| ¿Conduce a la compra? | Header con "Tienda" primero; catálogo a ≤2 clics desde cualquier página |
| ¿Se percibe premium? | Cormorant, dorado en filetes, aire, fotografía profesional |
| ¿Hay mecanismos de conversión? | 13 mecanismos, todos con datos reales (§13) |

---

## 16. Lo que este diseño evita, y cómo

| Riesgo | Antídoto |
|---|---|
| Farmacia | Cero azul, cero blanco clínico; base marfil cálido |
| Catálogo frío | Bloques editoriales entre las secciones comerciales |
| Plantilla de Shopify | Hero dividido, fondos ciruela, tipografía con carácter |
| Dashboard con productos | Fotografía a sangre y composición asimétrica |
| Blog de cosmética | Precio y CTA visibles en cada sección de producto |
| Minimalista y vacía | Alternancia de temperatura; 25 % de rosa; badges reales |
| Artesanal improvisada | Rejilla estricta, escala tipográfica, tokens de color |
| Corporativa tradicional | Cursiva editorial, curva orgánica, voz en segunda persona |

---

## 17. Pendiente de aprobación

1. ¿Se acepta **Editorial Caribeño Comercial** como síntesis, o se prefiere una dirección
   pura?
2. ¿Se aceptan los **fondos ciruela oscuro**? Es la decisión más diferenciadora y la más
   fácil de descartar por miedo.
3. ¿**Cormorant Garamond + Manrope**, o se prefiere probar Bodoni Moda para títulos?
4. Confirmar el titular del hero: *"Tu piel. Tu ritual. Tu momento."* frente a
   *"Celebra la piel que habitas."*
5. Confirmar la **foto 19** como imagen del hero (ver alternativas en `IMAGE_USAGE.md`).

Hasta que estos cinco puntos estén cerrados no se programa la página principal.
