# CONTENT_INVENTORY.md — Inventario de contenido y tabla de migración

Inventario completo del contenido encontrado en https://gaviotabylia.com/ el 3 de agosto de 2026,
con la decisión de migración para cada elemento.

**Leyenda de estado:**

| Estado | Significado |
|---|---|
| ✅ MIGRAR | Se traslada con edición menor |
| ✏️ REESCRIBIR | La idea sirve, el texto no. Se redacta de nuevo |
| ⚠️ CONFIRMAR | No se migra hasta que la propietaria confirme un dato |
| ❌ DESCARTAR | No se migra |
| 🆕 NUEVO | No existe hoy, se crea en la plataforma nueva |

---

## 1. Páginas de contenido

| Elemento | URL de origen | Contenido encontrado | Estado | ¿Requiere confirmación? | Acción recomendada |
|---|---|---|---|---|---|
| Home | `/` | H1 "Sumérgete en la indulgencia del cuidado de la piel", grid de 8 productos, botón "SHOP NOW" | ✏️ REESCRIBIR | No | Home editorial nueva con 14 secciones. El H1 actual es vago y no menciona la marca ni el beneficio |
| Meta description home | `/` | "Experimenta la indulgencia de la belleza natural con Gaviota by Lia. Descubre nuestra exclusiva línea de productos para la piel, diseñada para nutrir, revitalizar y resaltar tu luminosidad única." | ✅ MIGRAR | No | Es correcta. Acortar a ≤155 caracteres |
| Quiénes somos | `/pages/quienes-somos` | 6 bloques: Inspiración, Ingredientes Naturales, Sostenibilidad, Cuidado Auténtico, Misión, cierre | ⚠️ CONFIRMAR | **Sí** | Ver §1.1. Contiene 3 afirmaciones no verificadas |
| Conoce nuestra fundadora | `/pages/conoce-nuestra-fundadora` | Perfil de **Marlene Dietsch**: Trayectoria, Autenticidad, Empoderamiento, Herencia Dominicana | ⚠️ CONFIRMAR | **Sí** | Nombre y origen dominicano ✅. El resto es genérico y no verificable. Necesita datos reales |
| Contacto | `/pages/contact` | Email, teléfono, "Estados Unidos", formulario (Nombre, Email, Teléfono, Mensaje) | ✅ MIGRAR | Parcial | Migrar datos. Confirmar si el Gmail se sustituye por dominio propio |
| Blog | `/blogs/news` | **Vacío. Cero artículos** | ❌ DESCARTAR | No | Nada que migrar. Crear `/journal` vacío y funcional, o no lanzarlo |
| FAQ | — | **No existe** | 🆕 NUEVO | **Sí** | Ver §4. Dos enlaces del menú se llaman "Preguntas" pero ninguno lleva a preguntas frecuentes |

### 1.1 "Quiénes somos" — afirmaciones a confirmar

| Frase publicada hoy | Por qué requiere confirmación |
|---|---|
| "ingredientes naturales cuidadosamente seleccionados **de la flora dominicana**" | Si los productos se fabrican en EE. UU. con materia prima de proveedor genérico, la frase es falsa |
| "Utilizamos **prácticas sostenibles** en la elaboración de nuestros productos" | Afirmación medioambiental. Sin práctica concreta detrás, es greenwashing |
| "nos comprometemos a **preservar la belleza natural** de la República Dominicana" | Compromiso sin acción asociada |
| "Gaviota by Lia se trata de ofrecer **resultados reales**" / "auténtica y **efectiva**" | Claim de eficacia sin sustento |

**Recomendación:** conservar el posicionamiento dominicano (es real y es el activo de la
marca) y sustituir cada afirmación no verificable por una que sí lo sea. Si la fundadora
es dominicana y la inspiración es dominicana, eso ya es verdad y basta; no hace falta
afirmar que los ingredientes vienen de la isla si no es así.

### 1.2 "Conoce nuestra fundadora" — qué falta

Lo que el texto actual afirma sin concretar:

- "trayectoria inspiradora en la industria del cuidado personal" → ¿cuántos años? ¿en qué?
- "ha dedicado su vida a explorar y comprender" → ¿formación? ¿estudios?
- "conocimiento experto" → ¿de qué tipo? ¿certificado?

**Pregunta abierta clave:** la marca se llama Gaviota by **Lia** y la fundadora es
**Marlene**. El sitio nunca explica quién es Lia. Es lo primero que se pregunta un
visitante y ahora mismo no tiene respuesta en ninguna parte.

---

## 2. Navegación

| Elemento actual | Destino actual | Estado | Acción recomendada |
|---|---|---|---|
| Home | `/` | ✅ MIGRAR | `/` |
| Quienes Somos ? | `/pages/quienes-somos` | ✏️ REESCRIBIR | `/our-story` — corregir a "Nuestra historia" |
| Conoce Nuestra Fundadora | `/pages/conoce-nuestra-fundadora` | ✅ MIGRAR | `/founder` — "La fundadora" |
| Kits | `/collections/kits` | ✅ MIGRAR | `/kits` |
| Productos | `/collections/productos` | ✅ MIGRAR | `/shop` |
| **Ofertas** | `/collections/frontpage` | ❌ DESCARTAR | No es una colección de ofertas: es la colección por defecto del tema. Ver §5 sobre precios |
| Preguntas? | `/pages/contact` | ✏️ REESCRIBIR | `/contact` |
| **Preguntas ?** (duplicado) | `/policies/contact-information` | ❌ DESCARTAR | Enlace duplicado con el mismo nombre y otro destino |
| Donde Esta su Pedido? | app externa Track123 | ✏️ REESCRIBIR | `/track-order` propio, sin dependencia de terceros ni fuga del dominio myshopify |
| — | — | 🆕 NUEVO | `/routine`, `/ingredients`, `/faq`, `/search`, `/account` |

---

## 3. Políticas legales

| Política | URL de origen | Contenido encontrado | Estado | ¿Requiere confirmación? | Acción recomendada |
|---|---|---|---|---|---|
| Envíos | `/policies/shipping-policy` | Procesamiento 2 días hábiles; USPS Priority Mail; entrega 3–4 días hábiles; tracking por email | ✅ MIGRAR | **Sí** (faltan tarifas) | Único texto de políticas con datos reales. Completar tarifas, países y umbral de envío gratis |
| Reembolsos | `/policies/refund-policy` | "Todas las ventas son finales"; 14 días para defectos con fotos | ⚠️ CONFIRMAR | **Sí** | **Publicado con marcadores sin rellenar:** `[dirección de correo electrónico]`, `[número de teléfono]`. Además "todas las ventas finales" choca con las reglas de PayPal y de las marcas de tarjeta |
| Privacidad | `/policies/privacy-policy` | Plantilla Shopify sin completar | ❌ DESCARTAR | **Sí** | **Publicado con `[Date]`, `[INSERT REPRESENTATIVE DETAILS]`, `[TOLL FREE TELEPHONE NUMBER...]` y bloques "NOTE TO MERCHANT".** Filtra `49177a-4.myshopify.com`. Redactar de cero |
| Términos | `/policies/terms-of-service` | Plantilla no personalizada | ❌ DESCARTAR | **Sí** | Redactar de cero con el nombre legal real |
| Información de contacto | `/policies/contact-information` | Usada como "Preguntas" en el menú | ❌ DESCARTAR | No | Se absorbe en `/contact` |
| Cookies | — | **No existe** | 🆕 NUEVO | **Sí** | Necesaria: hay banner de consentimiento previsto y píxeles planificados |

---

## 4. Contenido que no existe y hay que crear

| Elemento | Por qué | ¿Requiere confirmación? |
|---|---|---|
| Preguntas frecuentes | El menú promete "Preguntas" dos veces y no hay ninguna | **Sí** — la propietaria debe aportar las preguntas reales de sus clientas |
| Ingredientes por producto | Ningún producto lista ingredientes en la web. **Los envases sí los llevan impresos** | **Sí** — fotografiar o transcribir el INCI de cada envase |
| Precauciones por producto | Los envases tienen un bloque "PRECAUCIONES" que nunca se trasladó a la web | **Sí** — transcribir del envase |
| Modo de uso | Solo el Exfoliante y el Ingrown Hair Serum lo tienen | **Sí** |
| Tamaño/contenido neto | No aparece en la web. **Sí aparece en los envases** (2 oz, 4 oz, 8 oz) | No — legible en `GA9.jpg` |
| Peso de envío | `grams: 0` en los 8 productos | **Sí** — pesar cada producto empaquetado |
| SKU | Ninguno tiene | No — se pueden generar |
| Política de cookies | No existe | **Sí** |
| Horario de atención | No existe | **Sí** |
| Testimonios | **No hay ninguno en el sitio actual** | **Sí** — no se inventará ninguno. La sección quedará oculta hasta tener reseñas verificadas |
| Texto de la sección "ritual en 3 pasos" | No existe | **Sí** — requiere que la propietaria defina el orden de uso recomendado |

---

## 5. Precios y promociones

| Elemento | Contenido encontrado | Estado | Acción recomendada |
|---|---|---|---|
| Precios de venta | $30 – $120 USD | ✅ MIGRAR | Confirmar que siguen vigentes |
| **Precios comparativos** | Los 8 productos tienen `compare_at_price` activo de forma permanente | ⚠️ CONFIRMAR | **Decisión requerida.** O el precio de lista real es el alto y esto es una promoción con fecha de fin, o el precio real es el bajo y el "antes" debe eliminarse. Mantenerlo indefinidamente es publicidad engañosa |
| Colección "Ofertas" | Apunta a `frontpage` | ❌ DESCARTAR | Depende de la decisión anterior |
| Moneda | USD | ✅ MIGRAR | Confirmar si se venderá también en RD |

---

## 6. Datos de contacto e identidad

| Dato | Valor actual | Estado | Acción recomendada |
|---|---|---|---|
| Email | `gaviotabylia@gmail.com` | ⚠️ CONFIRMAR | Recomendado migrar a `hola@gaviotabylia.com`. Resend requiere dominio verificado para enviar correo transaccional |
| Teléfono | `401-305-8713` | ✅ MIGRAR | Prefijo 401 = Rhode Island, EE. UU. Confirmar si es público y si es WhatsApp |
| Dirección | "Estados Unidos" | ⚠️ CONFIRMAR | Es un país, no una dirección. Se necesita una dirección real para las políticas y para el remitente de correo |
| Instagram | `@gaviotabylia` | ✅ MIGRAR | Única red social existente |
| Nombre legal | **No aparece** | ⚠️ CONFIRMAR | Imprescindible para términos, privacidad y pasarela de pago |
| Otras redes | No existen | — | Confirmar si hay TikTok/Facebook |

---

## 7. Elementos técnicos que NO se migran

| Elemento | Motivo |
|---|---|
| HTML de la interfaz de ChatGPT en la descripción del Exfoliante | Código pegado por error (`data-message-author-role="assistant"`, `<form>`) |
| Marcadores `[dirección de correo electrónico]`, `[Date]`, `[INSERT...]` | Plantillas sin rellenar |
| Bloques "NOTE TO MERCHANT" | Instrucciones internas de Shopify publicadas |
| Enlace a `https://seedgrow.net/privacy-policy/` | Política de privacidad de una empresa ajena |
| Referencias a `49177a-4.myshopify.com`, `gaviotabylia.myshopify.com`, `girlbossbussinessimperio.myshopify.com` | Dominios internos filtrados |
| Script de `pagead2.googlesyndication.com` (AdSense) | Sirve anuncios de terceros a los propios clientes |
| Widget de `platform.linkedin.com` | Sin uso identificable |
| Widget de WhatsApp de SeedGrow | Se reemplaza por enlace directo si la propietaria lo desea |
| App Track123 | Se reemplaza por `/track-order` propio |
| Sintaxis Markdown literal (`**texto**`) | Nunca se convirtió a HTML |
| Caracteres Unicode matemáticos (`𝐈𝐍𝐆𝐑𝐎𝐖𝐍`) | Rompen URL, búsqueda y lectores de pantalla |
| Crédito "DESIGNED BY GIRLBOSSIMPERIO" | Crédito de la agencia anterior |
| Imágenes `IMG_7072.jpg`, UUIDs de iOS | Fotos de móvil. Se sustituyen por la fotografía profesional |

---

## 8. Redirecciones 301 a configurar

Preservan el posicionamiento existente. Se implementan en `next.config.ts`.

| URL antigua | URL nueva |
|---|---|
| `/pages/quienes-somos` | `/our-story` |
| `/pages/conoce-nuestra-fundadora` | `/founder` |
| `/pages/contact` | `/contact` |
| `/collections/all` | `/shop` |
| `/collections/productos` | `/shop` |
| `/collections/kits` | `/kits` |
| `/collections/frontpage` | `/shop` |
| `/policies/shipping-policy` | `/shipping-policy` |
| `/policies/refund-policy` | `/refund-policy` |
| `/policies/privacy-policy` | `/privacy-policy` |
| `/policies/terms-of-service` | `/terms` |
| `/policies/contact-information` | `/contact` |
| `/blogs/news` | `/journal` |
| `/products/new` | `/products/crema-hidratante` |
| `/products/aceite-anti-estrias` | `/products/aceite-anti-estrias` |
| `/products/aceite-masculino-anti-estrias` | `/products/aceite-anti-estrias-masculino` |
| `/products/exfoliante-de-coco` | `/products/exfoliante-de-coco` |
| `/products/sunscreen` | pendiente — ver `LEGAL_TODO.md` |
| `/products/tonico-para-barba` | `/products/tonico-para-barba` |
| `/products/kit-anti-estrias-y-aclaracion` | pendiente — depende del renombrado del kit |
| `/products/%F0%9D%90%88%F0%9D%90%8D...` (Unicode) | `/products/serum-vellos-encarnados` |

---

## 9. Resumen cuantitativo

| Categoría | ✅ | ✏️ | ⚠️ | ❌ | 🆕 |
|---|---|---|---|---|---|
| Páginas | 2 | 2 | 2 | 1 | 1 |
| Navegación | 4 | 3 | 0 | 2 | 5 |
| Políticas | 1 | 0 | 1 | 3 | 1 |
| Contacto | 2 | 0 | 3 | 0 | 0 |
| **Total** | **9** | **5** | **6** | **6** | **7** |

**11 de 33 elementos requieren confirmación o creación por parte de la propietaria
antes de poder lanzar.** Están consolidados en `CONTENT_TODO.md` y `LEGAL_TODO.md`.
