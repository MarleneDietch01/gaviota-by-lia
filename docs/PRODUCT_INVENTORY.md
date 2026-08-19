# PRODUCT_INVENTORY.md — Inventario de productos

Fuente: `/products.json` del sitio actual + lectura directa de las etiquetas físicas en la
fotografía `GA9.jpg`. Todo dato marcado como "envase" fue leído de la etiqueta real
fotografiada, no inventado.

**Fecha:** 3 de agosto de 2026 · **Moneda:** USD · **Total en venta online:** 8 fichas (7 productos + 1 kit)

---

## 1. Resumen del catálogo

| # | Producto | Precio | "Antes" | Tamaño (envase) | Estado propuesto |
|---|---|---|---|---|---|
| 1 | Aceite Anti-Estrías | $50 | $60 | 4 oz / 115 mL | ✅ Publicar |
| 2 | Aceite Anti-Estrías Masculino | $50 | $60 | 4 oz / 115 mL | ✅ Publicar |
| 3 | Crema Hidratante | $40 | $50 | 8 oz / 236 mL | ⚠️ Revisar claims |
| 4 | Exfoliante de Coco | $40 | $50 | 8 oz / 236 mL | ✅ Publicar |
| 5 | Sérum Vellos Encarnados | $40 | $50 | 2 oz / 59 mL | ⚠️ Revisar claims |
| 6 | Tónico Para Barba | $40 | $50 | no legible | ⚠️ Revisar claims + contenido |
| 7 | Sunscreen | $30 | $40 | 2 oz / 59 mL | 🛑 **Bloqueado** — ver §4 |
| 8 | Kit Anti-Estrías y Aclaración | $120 | $130 | — | ⚠️ Renombrar + recalcular |
| 9 | **Crema Anti-Estrías** | — | — | 8 oz / 236 mL | 🆕 Fotografiado, **no se vende online** |
| 10 | **Producto labial (tarro dorado)** | — | — | pequeño | 🆕 Fotografiado, **no se vende online** |

---

## 2. Fichas detalladas

### 1. Aceite Anti-Estrías
| Campo | Valor |
|---|---|
| Nombre actual | `ACEITE ANTI ESTRIAS` (mayúsculas, sin acento) |
| Nombre propuesto | Aceite Anti-Estrías |
| URL actual | `/products/aceite-anti-estrias` |
| Precio | $50.00 (antes $60.00) |
| SKU | **ninguno** → propuesto `GBL-ACE-115` |
| Peso | **0 g** → pendiente de pesar |
| Imágenes | 1 (`34FEE30F-...jpg`, foto de móvil) |
| **Envase (real)** | 4 oz / 115 mL · Vidrio con gotero · Etiqueta rosa/dorada |
| **Claims del envase** | REAFIRMANTE · HIDRATANTE · APORTA BRILLO / FIRMING · MOISTURIZING · PROVIDES SHINE |
| Ingredientes | **No publicados en web.** El envase sí los lleva impresos → transcribir |
| Modo de uso | No publicado |
| Precauciones | El envase tiene bloque "PRECAUCIONES" → transcribir |

**Problemas:** descripción con Markdown literal (`**Fórmula Enriquecida:**`), claims de
medicamento ("prevenir la formación de estrías", "libre de estrías", "capas más internas
de la piel"), y el texto está duplicado en otros dos productos.

**Nota positiva:** los claims impresos en el envase (*reafirmante, hidratante, aporta
brillo*) son cosméticos y correctos. **El envase está mejor redactado que la web.**
Usar el envase como fuente de verdad.

---

### 2. Aceite Anti-Estrías Masculino
| Campo | Valor |
|---|---|
| Nombre actual | `Aceite Masculino Anti-estrías` |
| URL actual | `/products/aceite-masculino-anti-estrias` |
| Precio | $50.00 (antes $60.00) |
| SKU | ninguno → propuesto `GBL-ACM-115` |
| Imágenes | 4 (el mejor surtido del catálogo) |
| **Envase (real)** | 4 oz / 115 mL · gotero · **acento AZUL** (frente al rosa de la versión femenina) |

**Problema principal:** su descripción es **copia literal palabra por palabra** de la
versión femenina, incluyendo *"Úsalo durante y después del embarazo"*. Es incoherente en
un producto comercializado como masculino.

**Decisión pendiente:** ¿son dos fórmulas distintas o el mismo producto con otra
etiqueta? Si es lo segundo, lo correcto es **un producto con variante de presentación**,
no dos fichas. Ver `CONTENT_TODO.md`.

---

### 3. Crema Hidratante
| Campo | Valor |
|---|---|
| Nombre actual | `CREMA HIDRATANTE` |
| **URL actual** | **`/products/new`** ← handle sin sentido |
| URL propuesta | `/products/crema-hidratante` |
| Precio | $40.00 (antes $50.00) |
| SKU | ninguno → propuesto `GBL-CRH-236` |
| **Envase (real)** | 8 oz / 236 mL · tarro blanco, tapa dorada · bandera de RD impresa |
| **Claims del envase** | HIDRATACIÓN · **ACLARANTE** · **RETRASA EL ENVEJECIMIENTO** / HYDRATION · CLEARING · DELAYS THE AGING |

**Riesgo:** "aclarante" es una categoría regulada; "retrasa el envejecimiento" es un
claim antiedad fuerte. Ambos están impresos en el envase físico, no solo en la web, lo
que limita las opciones. La web puede matizar el lenguaje aunque el envase no cambie.

La descripción web añade *"Protección contra Radicales Libres"* y *"actúa como un
escudo"* — reformular.

Menciona a la fundadora por nombre ("Marlene Dietsch"), único producto que lo hace.

---

### 4. Exfoliante de Coco
| Campo | Valor |
|---|---|
| URL | `/products/exfoliante-de-coco` |
| Precio | $40.00 (antes $50.00) |
| SKU | ninguno → propuesto `GBL-EXF-236` |
| **Envase (real)** | 8 oz / 236 mL · tarro transparente · "COCONUT SCRUB" |
| Modo de uso | ✅ **Sí existe:** piel húmeda, movimientos circulares, enjuagar con agua tibia, 2–3 veces/semana |

**🛑 Problema crítico:** su descripción HTML contiene **el DOM de la interfaz de
ChatGPT** pegado por error: `data-testid="conversation-turn-23"`,
`data-message-author-role="assistant"`, `react-scroll-to-bottom`, clases `dark:prose-invert`
y un `<form>` vacío. Está en producción ahora mismo.

**Es, aun así, el producto mejor documentado:** los claims son cosméticos y correctos
(experiencia sensorial, exfoliación, hidratación, limpieza) y tiene modo de uso con
frecuencia. Solo hay que extraer el texto y descartar el envoltorio.

---

### 5. Sérum Vellos Encarnados
| Campo | Valor |
|---|---|
| Nombre actual | `𝐈𝐍𝐆𝐑𝐎𝐖𝐍 𝐇𝐀𝐈𝐑 𝐒𝐄𝐑𝐔𝐌` (Unicode matemático) |
| Nombre propuesto | Sérum Vellos Encarnados |
| **URL actual** | `/products/%F0%9D%90%88%F0%9D%90%8D%F0%9D%90%86...` |
| URL propuesta | `/products/serum-vellos-encarnados` |
| Precio | $40.00 (antes $50.00) |
| SKU | ninguno → propuesto `GBL-SVE-059` |
| **Envase (real)** | 2 oz / 59 mL · vidrio transparente · **bilingüe: "INGROWN HAIR SERUM / Sérum Vellos encarnados"** |

**El envase ya resuelve el nombre.** La etiqueta física es correctamente bilingüe; solo
la web lo hizo mal.

**Problema de claims:** *"eliminando granitos y vellos encarnados"* — "eliminar granitos"
es un claim antiacné, categoría de medicamento. Reformular a *"ayuda a reducir la
apariencia de..."*.

Todo el texto (título, cuerpo, encabezados) usa caracteres Unicode decorativos que rompen
URL, buscador interno y lectores de pantalla.

---

### 6. Tónico Para Barba
| Campo | Valor |
|---|---|
| URL | `/products/tonico-para-barba` |
| Precio | $40.00 (antes $50.00) |
| SKU | ninguno → propuesto `GBL-TNB-000` |
| Imágenes | 3 |
| Publicado | 11 de mayo de 2026 — **el producto más reciente** |
| Tamaño | **No legible**, no aparece en `GA9.jpg` |

**Descripción completa actual (92 caracteres, íntegra):**
> Rellena los vacios
> Estimula, y acelera el crecimiento.
> combate la caida

**Problemas:** el producto con peor documentación del catálogo. Sin acentos ("vacios",
"caida"), sin mayúscula inicial en dos de tres líneas, sin ingredientes, sin modo de uso,
sin precauciones. Y los tres claims son de crecimiento capilar, es decir, **claims de
medicamento**, no cosméticos.

Además es el único producto claramente masculino en un catálogo y una web dirigidos a
mujeres — no encaja con la navegación ni con la fotografía disponible (no hay ni una
sola foto masculina en el material suministrado).

**Decisión pendiente:** ¿se mantiene en el MVP? Si sí, necesita contenido desde cero y
fotografía propia.

---

### 7. Sunscreen — 🛑 BLOQUEADO
| Campo | Valor |
|---|---|
| URL | `/products/sunscreen` |
| Precio | $30.00 (antes $40.00) — el más barato |
| **Envase (real)** | 2 oz / 59 mL · frasco con dosificador · **sello circular con "50"** (sugiere SPF 50) |
| **Claims del envase** | HIDRATANTE / MOISTURIZING |
| **SPF declarado en la web** | **ninguno** |

En Estados Unidos un protector solar **no es cosmético: es medicamento OTC** regulado por
la FDA. Exige panel *Drug Facts*, ingredientes activos con porcentaje, número NDC, y
fabricación en instalación registrada.

Falta en la ficha actual: valor de SPF, ingredientes activos, amplio espectro,
resistencia al agua, panel de información, advertencias obligatorias.

**Recomendación: no publicar en el MVP** hasta que la propietaria aporte la documentación
del fabricante. Es el único riesgo del proyecto con consecuencia regulatoria directa.
El producto puede quedar creado en `draft` en el panel. Ver `LEGAL_TODO.md`.

---

### 8. Kit Anti-Estrías y Aclaración
| Campo | Valor |
|---|---|
| URL | `/products/kit-anti-estrias-y-aclaracion` |
| Precio | $120.00 (antes $130.00) |
| Composición declarada | Aceite Anti-Estrías + Exfoliante de Coco + Crema Hidratante |

**Problema de precio — el ahorro anunciado es casi inexistente:**

| Concepto | Importe |
|---|---|
| Aceite Anti-Estrías | $50 |
| Exfoliante de Coco | $40 |
| Crema Hidratante | $40 |
| **Suma individual** | **$130** |
| Precio del kit | $120 |
| **Ahorro real** | **$10 (7,7 %)** |

El "antes" de $130 del kit es exactamente la suma de los precios individuales, no un
precio anterior. La dirección comercial pide mostrar "ahorro real" calculado en servidor:
**con estos números el kit no es un argumento de venta.** Un kit con 7,7 % de descuento
no incentiva la compra agrupada. Requiere decisión de precio.

**Nombre:** contiene "Aclaración" (blanqueamiento), categoría regulada, en el propio
nombre comercial. Renombrar.

**Contenido:** su descripción es la concatenación literal de las tres descripciones
individuales, con la del Aceite repetida por tercera vez en el catálogo.

---

### 9. Crema Anti-Estrías — 🆕 no está a la venta
Visible en `GA9.jpg`: tarro blanco de 8 oz, etiqueta *"...RIAS ... cream"*, junto a la
Crema Hidratante. Por el formato y el texto es **"Crema Anti-Estrías / Anti stretch mark
cream"**.

**No existe ficha en la web.** Está fabricado, etiquetado y fotografiado, pero no se
vende online. Confirmar si debe incorporarse.

---

### 10. Producto labial — 🆕 no está a la venta
Tarro pequeño con tapa dorada visible en `GA9.jpg` y, aplicado, en la fotografía 16
(cuidado labial). No hay ficha en la web.

La dirección creativa pide "Cuidado labial" como una de las 8 opciones del selector
"¿Qué quieres cuidar hoy?" — **pero ese producto no está a la venta.** O se publica, o
esa opción del selector debe eliminarse. Ver §5.

---

## 3. Problemas transversales

| Problema | Alcance | Impacto |
|---|---|---|
| Sin SKU | 8/8 | Sin control de inventario ni logística |
| Sin peso (`grams: 0`) | 8/8 | Imposible calcular envío por peso |
| Sin variantes reales | 8/8 | Todos `Default Title` |
| Sin ingredientes publicados | 8/8 | Exigible en cosmética; el dato existe en el envase |
| Sin precauciones publicadas | 8/8 | Los envases sí las llevan |
| Sin `product_type` ni tags | 8/8 | Sin taxonomía para filtros |
| `compare_at_price` permanente | 8/8 | Descuento perpetuo = publicidad engañosa |
| Descripciones duplicadas | 4/8 | Contenido duplicado interno |
| Claims de medicamento | 6/8 | Riesgo regulatorio |
| Fotografía de móvil | 8/8 | 6 productos con una sola imagen |
| **Reseñas** | **0** | No hay ninguna reseña en todo el sitio |

---

## 4. Conflictos con la dirección comercial solicitada

La dirección creativa pide elementos que **el catálogo actual no puede sostener sin
inventar datos**, lo cual está expresamente prohibido. Resolución propuesta:

| Elemento pedido | Realidad | Resolución |
|---|---|---|
| "Valoración real" y "rating" en cada tarjeta | **0 reseñas en el sitio** | El componente se construye, pero **no se renderiza** si `review_count = 0`. Sin estrellas vacías ni "Sin reseñas aún" |
| "Porcentaje de ahorro cuando corresponda" | Los 8 productos tienen descuento permanente | Mostrar `%` **solo** si `compare_at_price` es un precio real anterior con vigencia. Requiere la decisión de precios de `CONTENT_TODO.md` |
| Badge "Más vendido" | Sin histórico de ventas en la plataforma nueva | Se calcula desde `order_items` reales. **En el lanzamiento no se muestra en ningún producto** |
| Badge "Pocas unidades" | Inventario real desconocido | Solo si `stock_quantity <= low_stock_threshold` con stock real cargado |
| "Testimonios verificados" y UGC | No existen | Sección oculta en producción (`status != 'active'`) |
| Selector: opción "Cuidado labial" | Producto no está a la venta | Eliminar la opción, o publicar el producto (§10) |
| Selector: opción "Protección solar" | Producto bloqueado legalmente | Eliminar la opción del MVP |
| Selector: 8 opciones | 7 productos publicables (6 sin el Sunscreen) | Reducir a **5 opciones** reales: Hidratación · Apariencia de estrías · Exfoliación y textura · Vellos encarnados · Rutina completa |
| "Imagen secundaria para hover" | 6 de 8 productos tienen 1 sola imagen | Solo en los 2 que tienen varias, hasta que haya fotografía de producto nueva |
| Kit con "ahorro real" | Ahorro de 7,7 % | Requiere decisión de precio (§8) |

**Ninguno de estos elementos se elimina del sistema.** Todos se construyen y quedan
listos; simplemente no se muestran hasta que existan datos reales que los respalden.
Es exactamente la regla que fija la propia dirección: *"No inventar badges ni escasez"*.

---

## 5. SKU propuestos

Formato: `GBL-<3 letras producto>-<mL>`

| Producto | SKU |
|---|---|
| Aceite Anti-Estrías | `GBL-ACE-115` |
| Aceite Anti-Estrías Masculino | `GBL-ACM-115` |
| Crema Hidratante | `GBL-CRH-236` |
| Exfoliante de Coco | `GBL-EXF-236` |
| Sérum Vellos Encarnados | `GBL-SVE-059` |
| Tónico Para Barba | `GBL-TNB-000` (mL pendiente) |
| Sunscreen | `GBL-SUN-059` (en `draft`) |
| Crema Anti-Estrías | `GBL-CRA-236` (si se publica) |
| Kit | `GBL-KIT-001` |

---

## 6. Categorías propuestas

Hoy no existe taxonomía. Propuesta basada en los productos reales:

| Categoría | Slug | Productos |
|---|---|---|
| Aceites y sérums | `aceites-y-serums` | Aceite Anti-Estrías, Aceite Masculino, Sérum Vellos Encarnados |
| Cremas e hidratación | `cremas-e-hidratacion` | Crema Hidratante, Crema Anti-Estrías |
| Exfoliación | `exfoliacion` | Exfoliante de Coco |
| Kits | `kits` | Kit |
| Cuidado masculino | `cuidado-masculino` | Tónico Para Barba, Aceite Masculino |

`Cuidado masculino` solo se activa si se confirma que el Tónico Para Barba permanece en
el catálogo.
