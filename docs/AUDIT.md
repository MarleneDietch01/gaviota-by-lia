# AUDIT.md — Auditoría del sitio actual

**Sitio auditado:** https://gaviotabylia.com/
**Fecha de auditoría:** 3 de agosto de 2026
**Plataforma detectada:** Shopify (tema con crédito "DESIGNED BY GIRLBOSSIMPERIO")
**Moneda:** USD
**Idioma del contenido:** español (con fragmentos en inglés)

Toda la información de este documento fue extraída directamente del sitio en vivo
(`/products.json`, `/sitemap.xml`, `robots.txt`, HTML de las páginas y páginas de políticas).
No se ha inventado ningún dato. Lo que no aparece aquí es porque **no existe** en el sitio actual.

---

## 1. Resumen ejecutivo

El sitio actual es una tienda Shopify pequeña, funcional en lo básico pero
**no publicable como referencia de calidad**. Sostiene la operación comercial, pero
arrastra problemas serios en tres frentes:

1. **Legales y regulatorios.** Políticas publicadas con marcadores de plantilla sin
   rellenar, un producto de protección solar (categoría regulada) descrito sin
   la información obligatoria, y afirmaciones de producto que prometen resultados
   absolutos.
2. **Calidad de contenido.** Descripciones duplicadas literalmente entre productos,
   un producto cuya descripción contiene el HTML de la interfaz de ChatGPT pegado por
   accidente, y títulos con caracteres Unicode decorativos que rompen URLs y búsqueda.
3. **Fundamentos técnicos y de SEO.** `lang="en"` en un sitio en español, cero datos
   estructurados, dominios internos de Shopify filtrados, y un enlace a la política de
   privacidad de una empresa ajena.

Ninguno de estos problemas es difícil de resolver en la plataforma nueva, pero
**varios exigen decisiones de la propietaria antes del lanzamiento** (ver
`LEGAL_TODO.md` y `CONTENT_TODO.md`). El más urgente es el protector solar.

---

## 2. Inventario de URLs encontradas

Extraído de `sitemap.xml` y sus sitemaps hijos.

### Páginas de contenido (3)
| URL | Título actual |
|---|---|
| `/pages/quienes-somos` | `Quienes Somos ?` |
| `/pages/conoce-nuestra-fundadora` | `Conoce Nuestra Fundadora` |
| `/pages/contact` | Contacto |

### Colecciones (3)
| URL | Uso real |
|---|---|
| `/collections/frontpage` | Se usa en el menú con la etiqueta **"Ofertas"** |
| `/collections/productos` | "Productos" |
| `/collections/kits` | "Kits" |
| `/collections/all` | Destino del botón "SHOP NOW" |

### Productos (8)
| URL | Nombre |
|---|---|
| `/products/aceite-anti-estrias` | ACEITE ANTI ESTRIAS |
| `/products/aceite-masculino-anti-estrias` | Aceite Masculino Anti-estrías |
| `/products/new` | **CREMA HIDRATANTE** (handle `new` — URL sin sentido) |
| `/products/exfoliante-de-coco` | EXFOLIANTE DE COCO |
| `/products/sunscreen` | Sunscreen |
| `/products/tonico-para-barba` | Tónico Para Barba |
| `/products/kit-anti-estrias-y-aclaracion` | Kit Anti-Estrías Y Aclaración |
| `/products/%F0%9D%90%88%F0%9D%90%8D...` | 𝐈𝐍𝐆𝐑𝐎𝐖𝐍 𝐇𝐀𝐈𝐑 𝐒𝐄𝐑𝐔𝐌 |

### Blog
| URL | Estado |
|---|---|
| `/blogs/news` | **Existe pero está vacío.** Cero artículos publicados. |

### Políticas (5)
`/policies/shipping-policy`, `/policies/refund-policy`, `/policies/privacy-policy`,
`/policies/terms-of-service`, `/policies/contact-information`

---

## 3. Navegación actual

Etiquetas y destinos reales extraídos del HTML:

| Etiqueta en el menú | Destino real |
|---|---|
| Home | `/` |
| Quienes Somos ? | `/pages/quienes-somos` |
| Conoce Nuestra Fundadora | `/pages/conoce-nuestra-fundadora` |
| Kits | `/collections/kits` |
| Productos | `/collections/productos` |
| Ofertas | `/collections/frontpage` |
| Preguntas? | `/pages/contact` |
| Preguntas ? | `/policies/contact-information` |
| Donde Esta su Pedido? | `https://gaviotabylia.myshopify.com/apps/track123` |

**Problemas de navegación detectados:**

- **Dos elementos distintos se llaman "Preguntas"** y apuntan a destinos diferentes.
  Ninguno de los dos es una página de preguntas frecuentes — **no existe FAQ en el sitio**.
- **"Ofertas" apunta a `frontpage`**, la colección por defecto de Shopify. No es una
  colección de ofertas real; es simplemente la colección destacada del tema.
- **"Donde Esta su Pedido?" sale del dominio principal** hacia
  `gaviotabylia.myshopify.com`, exponiendo el dominio interno de Shopify, y depende de
  una app de terceros (Track123).
- Faltan acentos y hay espacios antes de los signos de interrogación
  ("Quienes Somos ?", "Politica de envios", "Politica de privacidad").
- El signo de apertura `¿` no se usa en ninguna parte.

---

## 4. Catálogo: hallazgos estructurales

Datos extraídos de `/products.json`.

| Producto | Precio | Precio comparativo | SKU | Variantes | Peso | Imágenes |
|---|---|---|---|---|---|---|
| ACEITE ANTI ESTRIAS | $50.00 | $60.00 | — | 1 (Default) | 0 g | 1 |
| Aceite Masculino Anti-estrías | $50.00 | $60.00 | — | 1 (Default) | 0 g | 4 |
| CREMA HIDRATANTE | $40.00 | $50.00 | — | 1 (Default) | 0 g | 1 |
| EXFOLIANTE DE COCO | $40.00 | $50.00 | — | 1 (Default) | 0 g | 1 |
| 𝐈𝐍𝐆𝐑𝐎𝐖𝐍 𝐇𝐀𝐈𝐑 𝐒𝐄𝐑𝐔𝐌 | $40.00 | $50.00 | — | 1 (Default) | 0 g | 1 |
| Sunscreen | $30.00 | $40.00 | — | 1 (Default) | 0 g | 1 |
| Tónico Para Barba | $40.00 | $50.00 | — | 1 (Default) | 0 g | 3 |
| Kit Anti-Estrías Y Aclaración | $120.00 | $130.00 | — | 1 (Default) | 0 g | 1 |

**Hallazgos:**

1. **Ningún producto tiene SKU.** Imposible hacer control de inventario o logística seria.
2. **Ningún producto tiene peso** (`grams: 0`). Imposible calcular envío por peso.
3. **Ningún producto tiene variantes reales.** Todos usan `Default Title`, aunque el
   packaging fotografiado muestra tamaños distintos (2 oz, 4 oz, 8 oz).
4. **Ningún producto tiene `product_type` ni etiquetas.** No hay taxonomía; las
   colecciones se llenan a mano.
5. **Los 8 productos tienen `compare_at_price` activo permanentemente.** Es decir,
   el sitio muestra "descuento" de forma indefinida. Esto no es una promoción: es el
   precio de lista. En varias jurisdicciones (incluida la FTC en EE. UU.) anunciar un
   precio anterior que nunca fue el precio real de venta es publicidad engañosa.
6. **Inconsistencia de vendor:** unos productos usan `"Gaviota by Lia"` y otros
   `"Gaviota by Lia "` (con espacio final).

---

## 5. Calidad del contenido de producto

### 5.1 Descripción con interfaz de ChatGPT pegada — CRÍTICO

La descripción de **EXFOLIANTE DE COCO** no contiene solo texto: contiene el DOM
completo de la interfaz web de ChatGPT, copiado y pegado. Fragmentos literales
presentes ahora mismo en producción:

```html
<div data-testid="conversation-turn-23" class="w-full text-token-text-primary">
<div class="... agent-turn">
<div ... data-message-id="d193ebdd-5938-4e01-89f7-6460c17d49a9"
         data-message-author-role="assistant">
<div class="markdown prose w-full break-words dark:prose-invert light">
...
<form class="stretch mx-2 flex flex-row gap-3 last:mb-2 ...">
```

Incluye incluso un elemento `<form>` vacío y clases de modo oscuro de ChatGPT.
Es visible para cualquiera que inspeccione el código y confirma públicamente que la
descripción fue generada con IA y pegada sin revisar.

### 5.2 Duplicación literal de descripciones

El texto completo del **Aceite Anti-Estrías** aparece **tres veces** idéntico:

- en `ACEITE ANTI ESTRIAS`
- en `Aceite Masculino Anti-estrías` (palabra por palabra, sin una sola adaptación al
  público masculino, pese a que el producto se vende como masculino y el envase real
  usa un color azul distinto)
- dentro de `Kit Anti-Estrías Y Aclaración`

Igualmente, las descripciones de `EXFOLIANTE DE COCO` y `CREMA HIDRATANTE` se repiten
íntegras dentro del Kit. El Kit no es más que la concatenación de tres descripciones.

Para Google esto es contenido duplicado interno; para la clienta, es confuso.

### 5.3 Markdown sin procesar

Las descripciones contienen sintaxis Markdown literal que se renderiza como asteriscos
visibles en pantalla:

```
**Características Destacadas:**
1. **Fórmula Enriquecida:**
```

El texto fue escrito en Markdown y pegado en un editor HTML sin convertir.

### 5.4 Caracteres Unicode decorativos

`𝐈𝐍𝐆𝐑𝐎𝐖𝐍 𝐇𝐀𝐈𝐑 𝐒𝐄𝐑𝐔𝐌` usa caracteres matemáticos Unicode (Mathematical Bold Capital),
no letras normales. Consecuencias reales:

- La URL es `/products/%F0%9D%90%88%F0%9D%90%8D%F0%9D%90%86...` — ilegible y no compartible.
- Los lectores de pantalla la leen carácter por carácter o la omiten.
- No aparece si alguien busca "ingrown hair serum" en el buscador del sitio.
- Google la indexa mal.

Lo mismo ocurre en el cuerpo de esa descripción (`𝐁𝐄𝐍𝐄𝐅𝐈𝐓𝐒`, `𝐌𝐎𝐃𝐎 𝐃𝐄 𝐔𝐒𝐎`).

### 5.5 Mezcla de idiomas sin criterio

- Nombres de producto en inglés en un sitio español: `Sunscreen`, `INGROWN HAIR SERUM`.
- Palabra inglesa dentro de texto español: **"Aroma Soothing"**.
- El `INGROWN HAIR SERUM` y el `Sunscreen` tienen la descripción duplicada en inglés y
  español dentro del mismo campo, separadas por líneas con un punto suelto (`.`).
- Los enlaces de sesión usan `locale=en`.
- El `<html>` declara `lang="en"` en un sitio íntegramente en español.

### 5.6 Descripciones vacías o mínimas

`Tónico Para Barba` tiene 92 caracteres en total:

> Rellena los vacios / Estimula, y acelera el crecimiento. / combate la caida

Sin mayúscula inicial en dos de tres líneas, sin acentos ("vacios", "caida"), sin modo
de uso, sin ingredientes, sin precauciones.

---

## 6. Afirmaciones de producto problemáticas

Estas frases están publicadas hoy y **no deben migrarse tal cual**. La normativa
cosmética (FDA en EE. UU., y equivalentes) distingue entre "cosmético" (altera la
apariencia) y "medicamento" (altera la estructura o función del cuerpo). Varias de
estas frases describen un medicamento.

| Frase publicada actualmente | Producto | Problema |
|---|---|---|
| "una piel suave, radiante y **libre de estrías**" | Aceite Anti-Estrías | Promete eliminación total |
| "Diseñado para **prevenir la formación de estrías**" | Aceite Anti-Estrías | Claim de estructura/función |
| "trabajando en **las capas más internas de la piel**" | Aceite Anti-Estrías | Claim de acción sistémica |
| "Descubre el Secreto de una **Piel Bella y Sin Estrías**" | Aceite Anti-Estrías | Resultado garantizado |
| "**Estimula, y acelera el crecimiento**" / "**combate la caida**" | Tónico Para Barba | Claim de crecimiento capilar = medicamento |
| "Cuida tu piel **eliminando granitos** y vellos encarnados" | Ingrown Hair Serum | Claim antiacné = medicamento |
| "**Protección contra Radicales Libres**", "actúa como un **escudo**" | Crema Hidratante | Claim fisiológico |
| "**ACLARANTE**" / "CLEARING" (en el envase) | Crema Hidratante | Aclarado de piel: categoría regulada |
| "**Aclaración**" (en el nombre del Kit) | Kit | Ídem, en el propio nombre comercial |
| "**RETRASA EL ENVEJECIMIENTO**" (envase) | Crema Hidratante | Claim antiedad fuerte |
| "Ayuda a minimizar el **fotoenvejecimiento**" | Sunscreen | Claim regulado de protector solar |
| "**Diseñado para proteger de los rayos UVA/UVB**" | Sunscreen | Ver sección 6.1 |

### 6.1 Protector solar — el riesgo más alto

En Estados Unidos (donde la empresa indica estar radicada, y cuya moneda usa) un
protector solar **no es un cosmético: es un medicamento OTC** regulado por la FDA.
Requiere, entre otras cosas, un panel *Drug Facts*, número NDC, ingredientes activos con
porcentaje, y fabricación en instalación registrada.

Estado actual en el sitio:

- La ficha **no indica el valor de SPF** en ninguna parte del texto.
- El envase fotografiado (`GA9.jpg`) **sí muestra un sello con "50"**, lo que sugiere
  SPF 50, pero eso no está declarado en la web.
- No hay ingredientes activos listados.
- No hay panel de información de medicamento.
- No se declara si es de amplio espectro ni resistencia al agua.

**Recomendación:** no publicar este producto en la plataforma nueva hasta que la
propietaria aporte la documentación regulatoria del fabricante. Ver `LEGAL_TODO.md`.

---

## 7. Contenido de marca existente

### 7.1 Fundadora

**Nombre publicado: Marlene Dietsch.** Aparece en `/pages/conoce-nuestra-fundadora` y
también dentro de la descripción de la Crema Hidratante.

El texto es utilizable como base pero es genérico y no verificable: habla de
"trayectoria inspiradora en la industria del cuidado personal" sin años, formación,
lugar ni hito concreto. Necesita reescritura con datos reales aportados por ella.

**Nota importante:** la marca se llama "Gaviota by **Lia**" pero la fundadora se llama
**Marlene**. El sitio nunca explica quién es Lia ni de dónde viene el nombre. Es una
pregunta obvia del visitante y una oportunidad narrativa desaprovechada.

### 7.2 Quiénes somos

Texto correcto en tono, pero con afirmaciones no verificadas que la nueva web no debe
repetir sin respaldo:

- "ingredientes naturales cuidadosamente seleccionados **de la flora dominicana**"
- "Utilizamos **prácticas sostenibles** en la elaboración"
- "nos comprometemos a **preservar la belleza natural** de la República Dominicana"

Si los productos se fabrican en EE. UU. con ingredientes de proveedor genérico, estas
frases son falsas. Requiere confirmación (ver `CONTENT_TODO.md`).

### 7.3 Contacto

| Dato | Valor actual | Observación |
|---|---|---|
| Email | `gaviotabylia@gmail.com` | Gmail genérico, no dominio propio |
| Teléfono | `401-305-8713` | Prefijo 401 = Rhode Island, EE. UU. |
| Dirección | "Estados Unidos" | Es un país, no una dirección |
| Instagram | `@gaviotabylia` | Única red social |
| Horario | — | No existe |

---

## 8. Políticas legales

| Política | Estado |
|---|---|
| Envíos | Redactada, con datos reales (ver §9) |
| Reembolsos | **Con marcadores sin rellenar publicados** |
| Privacidad | **Plantilla de Shopify sin completar, con notas internas visibles** |
| Términos | Presente, no personalizada |
| Contacto | Usada indebidamente como "Preguntas" |

### 8.1 Política de reembolso

Texto publicado, con marcadores literales visibles al público:

> "[dirección de correo electrónico]"
> "[número de teléfono]"

Contenido: *"Todas las ventas de productos Gaviota by Lia se consideran finales"*, con
excepción de producto defectuoso o dañado reportado en **14 días** con fotos y número
de pedido.

**Riesgo:** una política de "todas las ventas finales" sin derecho de desistimiento es
legalmente cuestionable en venta a distancia en varias jurisdicciones, y además choca
con las reglas de protección al comprador de PayPal y de las marcas de tarjeta, que
prevalecerán sobre la política de la tienda en una disputa.

### 8.2 Política de privacidad

Es la plantilla por defecto de Shopify **sin completar**. Publicados hoy:

> "Last updated: [Date]"
> "[TOLL FREE TELEPHONE NUMBER IF YOU HAVE A PHYSICAL RETAIL LOCATION]"
> "[EEA] [and] [the UK]"
> "[INSERT REPRESENTATIVE DETAILS]"

Además contiene bloques de instrucciones dirigidas al comerciante ("**NOTE TO
MERCHANT**") que nunca debieron publicarse, y el propio documento advierte que es una
plantilla que requiere revisión legal antes de publicarse.

También filtra el dominio interno `49177a-4.myshopify.com` en lugar del dominio real.

---

## 9. Envíos — único dato operativo real

De `/policies/shipping-policy`:

| Dato | Valor |
|---|---|
| Tiempo de procesamiento | 2 días hábiles |
| Transportista | USPS Priority Mail |
| Tiempo de entrega | 3–4 días hábiles |
| Tracking | Se envía por email tras procesar |

**No declarado:** tarifas, umbral de envío gratis, países servidos, envío internacional,
recogida local, responsabilidad por extravío. Como el transportista es USPS y la moneda
es USD, la operación parece ser **doméstica en Estados Unidos**, pero el sitio nunca lo
dice explícitamente. Ver `SHIPPING_TODO.md`.

---

## 10. SEO y datos estructurados

| Elemento | Estado |
|---|---|
| `<html lang>` | **`en`** en un sitio en español — error de accesibilidad y SEO |
| Meta description (home) | Presente y correcta |
| Canonical | Presente |
| `og:title` / `og:description` | Presentes |
| `og:image` | Presente pero servida por **`http://`** (contenido mixto) |
| `og:site_name` | `"Gaviota by Lia "` — con espacio final |
| Twitter Card | Presente |
| **JSON-LD / datos estructurados** | **Ninguno.** Cero `Product`, `Organization`, `FAQPage`, `BreadcrumbList` |
| hreflang | Ninguno |
| Rich snippets de precio/stock en Google | Imposibles hoy |

El botón de compartir en Pinterest apunta a
`no-image-2048-a2addb12_1024x1024.gif`, la imagen "sin imagen" por defecto de Shopify:
al compartir la home en Pinterest no se muestra ninguna imagen de marca.

---

## 11. Terceros, fugas y scripts

### 11.1 Dominios internos filtrados en el HTML público

- `49177a-4.myshopify.com` — dominio original de la tienda
- `gaviotabylia.myshopify.com` — dominio Shopify de la marca
- `girlbossbussinessimperio.myshopify.com` — **tienda de la agencia que construyó el sitio**

El tercero indica que el tema o los assets se sirven parcialmente desde la tienda de la
agencia. Si esa tienda se cierra o cambia, partes del sitio pueden romperse.

### 11.2 Enlace a la política de privacidad de otra empresa — CRÍTICO

El sitio enlaza, con el texto "privacy policy", a:

```
https://seedgrow.net/privacy-policy/
```

`seedgrow.net` es el proveedor del widget de chat de WhatsApp instalado en el sitio.
Un visitante que busque la política de privacidad de Gaviota by Lia puede acabar
leyendo la de una empresa de software sin relación con la marca. Es un problema de
consentimiento y transparencia.

### 11.3 Scripts de terceros cargados

| Host | Qué es |
|---|---|
| `cdn.shopify.com` | Plataforma |
| `shop.app` | Shop Pay |
| `cdn-spurit.com` | App Spur-IT |
| `seedgrow` (widget WhatsApp) | Chat, 14 referencias en el HTML |
| Track123 | Seguimiento de pedidos, app externa |
| **`pagead2.googlesyndication.com`** | **Google AdSense / anuncios** |
| `platform.linkedin.com` | Widget de LinkedIn |

Dos anomalías: **AdSense en una tienda propia** (sirve anuncios de terceros a los
propios clientes, y ralentiza el sitio sin beneficio claro) y un widget de LinkedIn sin
uso visible.

### 11.4 Analítica

**No se detectó ningún script de Google Analytics 4, Meta Pixel, Clarity ni TikTok** en
el HTML de la home. Es posible que exista alguno inyectado vía Shopify Web Pixels, pero
no hay medición identificable desde el HTML público. En la práctica: **la marca
probablemente no está midiendo su embudo de conversión**.

---

## 12. Imágenes del sitio actual

Las imágenes de producto en producción son fotos de móvil con nombres de archivo
automáticos, no fotografía de producto profesional:

`IMG_7072.jpg`, `IMG_7074.jpg`, `IMG-2771.jpg`,
`211A9C66-5C04-4614-B35D-BF9496CE754A.jpg`,
`34FEE30F-12C2-40BE-9AA6-8266BBCA3FE8.jpg`,
`5062BA48-F1BF-4A9B-8557-8DF5A04AAC12.jpg`,
`925D2161-2A99-4D0C-A8EF-6FB3FD4DE9A4.png`,
`C0E01A8C-1EEF-45B0-9782-114106BDCE83.png`

Son UUIDs de iOS y nombres `IMG_####`: fotos tomadas con iPhone y subidas directamente.
Seis de los ocho productos tienen **una sola imagen**. Ninguna tiene texto alternativo
descriptivo.

**Las fotografías profesionales de Leslie Estévez suministradas para este proyecto no
se están usando en el sitio actual.** Es el activo más valioso de la marca y está
completamente desaprovechado.

---

## 13. Qué funciona y debe conservarse

No todo está mal. Se conserva:

- **El posicionamiento.** "Belleza dominicana" es un ángulo diferenciador real y honesto.
- **La inclusividad, y es genuina.** Las fotografías muestran mujeres de distintos tonos
  de piel, texturas de cabello y tallas. No es marketing: está en el material.
- **El catálogo enfocado.** 7–9 productos en cuidado corporal es un catálogo manejable y
  coherente, no un bazar.
- **La estructura de precios.** Rango $30–$50 con un kit a $120: es consistente.
- **La política de envíos**, que sí contiene datos operativos reales y verificados.
- **La identidad cromática rosa/dorado**, ya presente en el packaging físico. La paleta
  propuesta para la web nace del envase real, no de una plantilla.
- **El nombre de la fundadora y la narrativa dominicana**, como base a reescribir.

---

## 14. Hallazgos ordenados por gravedad

### Bloqueantes para el lanzamiento
1. Protector solar sin información regulatoria (§6.1)
2. Política de privacidad con marcadores y notas internas publicadas (§8.2)
3. Política de reembolso con marcadores publicados (§8.1)
4. Afirmaciones de tipo medicamento en 6 de 8 productos (§6)
5. Enlace a la política de privacidad de un tercero ajeno (§11.2)

### Altos
6. HTML de ChatGPT en una descripción de producto (§5.1)
7. `compare_at_price` permanente en el 100 % del catálogo (§4)
8. Ausencia total de SKU y peso (§4)
9. Descripciones duplicadas literalmente (§5.2)
10. Ausencia total de datos estructurados (§10)

### Medios
11. Caracteres Unicode decorativos en título y URL (§5.4)
12. `lang="en"` en sitio español (§10)
13. Handle `/products/new` para la Crema Hidratante (§2)
14. Sin FAQ pese a tener dos enlaces "Preguntas" (§3)
15. Blog creado y vacío (§2)
16. Fotografía profesional sin usar (§12)
17. AdSense en la tienda propia (§11.3)

### Bajos
18. Faltas de ortografía y acentuación en el menú y las descripciones
19. `og:image` por `http://`, sin imagen social útil
20. Inconsistencia de vendor con espacio final
21. Dominios internos de Shopify filtrados

---

## 15. Documentos relacionados

- `CONTENT_INVENTORY.md` — inventario página por página con decisión de migración
- `PRODUCT_INVENTORY.md` — inventario producto por producto
- `MIGRATION_RISKS.md` — riesgos y mitigaciones
- `LEGAL_TODO.md` — decisiones legales pendientes
- `CONTENT_TODO.md` — contenido que debe aportar la propietaria
