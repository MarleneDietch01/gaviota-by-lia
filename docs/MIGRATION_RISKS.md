# MIGRATION_RISKS.md — Riesgos de migración

Riesgos identificados al migrar de Shopify a la plataforma propia, ordenados por
severidad. Cada riesgo incluye evidencia, impacto y mitigación.

**Escala:** 🔴 Crítico (bloquea el lanzamiento) · 🟠 Alto · 🟡 Medio · 🟢 Bajo

---

## Índice

| # | Riesgo | Sev. | ¿Bloquea lanzamiento? |
|---|---|---|---|
| R1 | Protector solar sin documentación regulatoria | 🔴 | **Sí** |
| R2 | Políticas legales con marcadores sin rellenar | 🔴 | **Sí** |
| R3 | Claims de medicamento en 6 de 8 productos | 🔴 | **Sí** |
| R4 | Sin proveedor de pago definido | 🔴 | **Sí** |
| R5 | Descuento permanente en todo el catálogo | 🟠 | Sí |
| R6 | Sin datos de inventario real | 🟠 | Sí |
| R7 | Sin pesos ni tarifas de envío | 🟠 | Sí |
| R8 | Pérdida de posicionamiento SEO | 🟠 | No |
| R9 | Migración de clientes y pedidos históricos | 🟠 | No |
| R10 | Sin fotografía de producto profesional | 🟠 | No |
| R11 | Todas las fotos son verticales | 🟠 | No |
| R12 | Contenido contaminado (HTML de ChatGPT, Unicode) | 🟡 | No |
| R13 | Dependencia de apps de terceros | 🟡 | No |
| R14 | Correo transaccional desde Gmail | 🟡 | Sí |
| R15 | Sin analítica histórica | 🟡 | No |
| R16 | La propietaria no es técnica | 🟡 | No |
| R17 | Concurrencia sobre la última unidad | 🟡 | No |
| R18 | Ambigüedad de jurisdicción (EE. UU. / RD) | 🟡 | No |
| R19 | Identidad de marca sin definir ("¿quién es Lia?") | 🟢 | No |
| R20 | Ventana de corte durante el cambio de DNS | 🟢 | No |

---

## 🔴 R1 — Protector solar sin documentación regulatoria

**Evidencia.** La ficha `/products/sunscreen` afirma *"Diseñado para proteger de los
rayos UVA/UVB"* y *"Ayuda a minimizar el fotoenvejecimiento"*, pero **no declara ningún
valor de SPF**. El envase fotografiado en `GA9.jpg` muestra un sello con "50".

**Impacto.** En EE. UU. un protector solar es un medicamento OTC regulado por la FDA, no
un cosmético. Vender uno sin panel *Drug Facts*, ingredientes activos con porcentaje ni
número NDC expone a acción regulatoria y a responsabilidad civil si un cliente sufre una
quemadura confiando en una protección no acreditada. Es el único riesgo del proyecto con
consecuencia legal directa e inmediata.

**Mitigación.**
1. **No publicar el producto en el MVP.** Crearlo en estado `draft` en el panel.
2. Solicitar a la propietaria la ficha técnica del fabricante y el registro FDA.
3. Publicar solo cuando exista documentación; entonces la ficha deberá incluir panel de
   medicamento, no la plantilla de producto cosmético.
4. La plantilla de producto contemplará un tipo `otc_drug` desde el diseño de la base de
   datos para no rehacer el modelo después.

**Responsable:** propietaria. **Estado:** abierto.

---

## 🔴 R2 — Políticas legales con marcadores sin rellenar

**Evidencia.** Publicado hoy en producción:

- Reembolsos: `[dirección de correo electrónico]`, `[número de teléfono]`
- Privacidad: `Last updated: [Date]`, `[INSERT REPRESENTATIVE DETAILS]`,
  `[TOLL FREE TELEPHONE NUMBER IF YOU HAVE A PHYSICAL RETAIL LOCATION]`, `[EEA] [and] [the UK]`
- Privacidad: bloques **"NOTE TO MERCHANT"** (instrucciones internas de Shopify)
- Privacidad: declara `49177a-4.myshopify.com` como sitio, no el dominio real

**Impacto.** Una política de privacidad sin completar no cumple ninguna normativa de
protección de datos. Además, la pasarela de pago exigirá políticas válidas durante el
alta del comercio: **esto puede bloquear la aprobación de la cuenta**, no solo el
lanzamiento.

**Mitigación.**
1. Redactar las cinco políticas de cero con el nombre legal y la dirección reales.
2. Revisión por un profesional legal en la jurisdicción correspondiente.
3. Test automatizado en CI que falle si aparece `[`, `INSERT`, `NOTE TO MERCHANT` o
   `TODO` en cualquier contenido publicado.
4. Las políticas se gestionan desde `content_sections`, editables sin tocar código.

**Responsable:** propietaria + asesoría legal. **Estado:** abierto. Ver `LEGAL_TODO.md`.

---

## 🔴 R3 — Claims de medicamento en 6 de 8 productos

**Evidencia.** *"libre de estrías"*, *"prevenir la formación de estrías"*, *"trabajando
en las capas más internas de la piel"*, *"Estimula, y acelera el crecimiento"*,
*"combate la caida"*, *"eliminando granitos"*, *"Protección contra Radicales Libres"*,
*"RETRASA EL ENVEJECIMIENTO"*, *"ACLARANTE"*.

**Impacto.** Un cosmético que afirma alterar la estructura o función del cuerpo se
reclasifica como medicamento. Riesgo regulatorio y de reclamación por publicidad
engañosa.

**Agravante:** *"ACLARANTE"* y *"RETRASA EL ENVEJECIMIENTO"* están **impresos en el
envase físico**, no solo en la web. La web puede matizar el lenguaje, pero el envase
seguirá en circulación.

**Mitigación.**
1. Reescribir todas las descripciones con lenguaje de apariencia
   (*"ayuda a mejorar la apariencia de"*, *"contribuye a mantener la piel hidratada"*).
2. Añadir el descargo obligatorio en cada ficha: *"Este producto es cosmético y no
   sustituye la evaluación de un profesional de la salud."*
3. Añadir *"Los resultados pueden variar"* donde se describa un resultado.
4. **Usar los claims del envase como fuente de verdad** cuando sean cosméticos: los del
   Aceite (*reafirmante, hidratante, aporta brillo*) están mejor redactados que la web.
5. Lista de términos prohibidos revisada en el test de contenido de CI.

**Responsable:** redacción + validación de la propietaria. **Estado:** abierto.

---

## 🔴 R4 — Sin proveedor de pago definido

**Evidencia.** El sitio actual usa Shopify Payments/PayPal. Al abandonar Shopify, **se
pierde la pasarela**. No hay proveedor decidido para la plataforma nueva.

**Impacto.** Sin pasarela no hay tienda. Además el alta de comercio no es inmediata:
suele requerir verificación de identidad, documentación fiscal, cuenta bancaria y
revisión de las políticas del sitio (ver R2). Puede tardar de días a semanas y **puede
ser denegada**.

**Mitigación.**
1. Arquitectura desacoplada tras la interfaz `PaymentProvider`, con
   `MockPaymentProvider` para desarrollo y pruebas E2E. El MVP se desarrolla y se prueba
   entero sin depender de la decisión.
2. Iniciar el alta del comercio **en paralelo al desarrollo**, no al final.
3. Resolver primero R2 y R18, de los que depende el alta.
4. Nunca confirmar un pago por redirección del navegador: solo por webhook firmado.

**Responsable:** propietaria. **Estado:** abierto. Ver `PAYMENT_TODO.md`.

---

## 🟠 R5 — Descuento permanente en todo el catálogo

**Evidencia.** Los 8 productos tienen `compare_at_price` activo de forma indefinida. La
colección del menú "Ofertas" apunta a `frontpage`, la colección por defecto del tema.

**Impacto.** Anunciar un precio anterior que nunca fue el de venta habitual es publicidad
engañosa (criterio de la FTC en EE. UU.). Además la dirección comercial pide mostrar
"porcentaje de ahorro" — que amplificaría el problema.

**Mitigación.**
1. Decisión de la propietaria: ¿el precio real es el alto o el bajo?
2. `compare_at_price` se modela como **opcional y con vigencia**, no permanente.
3. El `%` de ahorro solo se muestra si hay un precio anterior real con fechas.
4. Si la respuesta es "el precio real es el bajo", se elimina el precio anterior de los
   8 productos y desaparece la sección "Ofertas".

**Responsable:** propietaria. **Estado:** abierto.

---

## 🟠 R6 — Sin datos de inventario real

**Evidencia.** Los 8 productos figuran como `available: true` sin cantidad. No hay
constancia de que Shopify tuviera seguimiento de inventario activo.

**Impacto.** La plataforma nueva se construye sobre inventario por variante con
movimientos y reservas. Sin stock inicial real, el sistema arranca vacío o con datos
inventados — y vender lo que no hay genera cancelaciones y reembolsos.

**Mitigación.**
1. Conteo físico antes del lanzamiento, con carga vía movimiento `initial`.
2. El panel permite ajustar stock con motivo obligatorio.
3. Si no hay conteo, arrancar con `track_inventory = false` por producto (venta sin
   control de stock) y activarlo después. Es preferible a inventar cifras.
4. Alerta de bajo inventario configurable por variante.

**Responsable:** propietaria. **Estado:** abierto.

---

## 🟠 R7 — Sin pesos ni tarifas de envío

**Evidencia.** `grams: 0` en los 8 productos. La política declara USPS Priority Mail,
2 días de proceso y 3–4 de entrega, pero **ninguna tarifa, umbral ni país**.

**Impacto.** No se puede calcular el envío. Y la dirección comercial pide "progreso hacia
envío gratuito", que necesita un umbral que hoy no existe.

**Mitigación.**
1. MVP con **tarifa plana configurable** + umbral de envío gratis configurable, ambos
   desde el panel. No requiere pesos.
2. Interfaz `ShippingProvider` preparada para tarifas por peso/transportista más adelante.
3. Pesar cada producto empaquetado y cargarlo en `product_variants.weight` para la fase 2.
4. Declarar explícitamente los países servidos; bloquear el resto en el checkout.

**Responsable:** propietaria. **Estado:** abierto. Ver `SHIPPING_TODO.md`.

---

## 🟠 R8 — Pérdida de posicionamiento SEO

**Evidencia.** Cambian todas las URLs: `/pages/*`, `/collections/*`, `/policies/*` y dos
handles de producto (`/products/new`, el de caracteres Unicode).

**Impacto.** Sin redirecciones, se pierde el posicionamiento acumulado y los enlaces
compartidos en redes dejan de funcionar.

**Atenuante.** El sitio actual **no tiene datos estructurados, tiene `lang="en"` en
español y el blog vacío**: el posicionamiento a preservar es modesto. El riesgo real es
menor de lo habitual, y la web nueva casi con seguridad posicionará mejor.

**Mitigación.**
1. Las 21 redirecciones 301 de `CONTENT_INVENTORY.md` §8 en `next.config.ts`.
2. Sitemap dinámico y `robots.txt` desde el primer día.
3. JSON-LD `Product`, `Organization`, `BreadcrumbList`, `FAQPage` (hoy: ninguno).
4. `lang="es"` correcto.
5. Registrar el dominio en Search Console **antes** del cambio y vigilar la cobertura las
   4 semanas siguientes.
6. Test E2E que verifique que cada URL antigua responde 301 al destino correcto.

**Responsable:** desarrollo. **Estado:** planificado.

---

## 🟠 R9 — Migración de clientes y pedidos históricos

**Evidencia.** La tienda opera desde diciembre de 2023. Existen clientes con cuenta y un
histórico de pedidos, ambos dentro de Shopify.

**Impacto.** Las contraseñas **no son migrables**: Shopify no las exporta en claro (ni
debe). Todo cliente existente tendrá que restablecer su contraseña. Si el histórico no se
migra, se pierde el "repetir pedido" y el contexto de atención al cliente.

**Mitigación.**
1. Exportar clientes y pedidos desde el admin de Shopify **antes** de cancelar la
   suscripción. Una vez cancelada, el acceso se pierde.
2. Importar clientes a Supabase Auth con contraseña no utilizable, forzando el flujo de
   "recuperar contraseña" en el primer acceso.
3. Comunicar el cambio por correo antes del lanzamiento.
4. Importar los pedidos históricos como `order_status = 'delivered'` en modo solo lectura,
   con `order_number` en formato antiguo preservado, sin recalcular totales.
5. Mantener la suscripción de Shopify activa al menos 30 días tras el lanzamiento.

**Responsable:** propietaria + desarrollo. **Estado:** abierto.

---

## 🟠 R10 — Sin fotografía de producto profesional

**Evidencia.** Las 8 fichas usan fotos de iPhone (`IMG_7072.jpg`, UUIDs de iOS). Seis
tienen una sola imagen. La fotografía profesional disponible es de **campaña y modelo**,
no de producto sobre fondo limpio.

**Impacto.** La dirección creativa pide "primeros planos de producto", "producto flotante
sobre fondos limpios", "imagen secundaria para hover" y "galería grande" en la ficha.
`GA9.jpg` es un bodegón de grupo excelente, pero **no sustituye a un packshot por
producto**.

**Mitigación.**
1. MVP: recortes de alta resolución de `GA9.jpg` (4431 × 5539 px, con margen de sobra)
   para packshots individuales. Los productos aparecen nítidos y bien iluminados.
2. Complementar con las fotos de aplicación (7, 15, 16, 19) como segunda imagen de galería.
3. El hover con imagen secundaria solo se activa donde haya ≥2 imágenes.
4. Recomendar una sesión de packshot antes de la fase 2. Es la mejora de conversión con
   mejor relación coste/beneficio del proyecto.

**Responsable:** desarrollo (MVP) / propietaria (sesión). **Estado:** mitigable.

---

## 🟠 R11 — Todas las fotografías son verticales

**Evidencia.** Verificado sobre los 17 archivos: **todos son 4:5 vertical**, entre
3738 × 4672 y 5916 × 7395 px. **No existe una sola fotografía horizontal.**

**Impacto.** La dirección creativa pide "fotografía de campaña ocupando gran parte de la
pantalla" y "fotografías a pantalla completa". Un hero de escritorio 16:9 a partir de una
foto 4:5 exige recortar ~55 % de la altura, y en las fotos de retrato eso corta cabezas o
productos. Es una restricción estructural, no un detalle.

**Mitigación.** No es un problema si el diseño se construye a partir de él:
1. **Hero de escritorio en composición dividida** (texto ~45 % / imagen ~55 %), que
   respeta el 4:5 nativo sin recortar. Es además más editorial que un banner ancho.
2. **Hero móvil a pantalla completa**: ahí el 4:5 vertical es ideal. La foto funciona
   mejor en móvil que en escritorio, y móvil es la prioridad declarada.
3. Recortes independientes por breakpoint mediante `art direction`, con punto focal
   definido por imagen en `IMAGE_USAGE.md`, nunca `object-fit: cover` a ciegas.
4. Las composiciones asimétricas, dípticos y superposiciones que pide la dirección
   creativa **funcionan especialmente bien con material vertical**.
5. Las fotos 9, 11, 17 y 18 (grupo) son las de composición más ancha: reservarlas para
   las bandas horizontales de comunidad.

**Responsable:** desarrollo. **Estado:** resuelto por diseño. Ver `DESIGN_DIRECTION.md`.

---

## 🟡 R12 — Contenido contaminado

**Evidencia.** DOM de ChatGPT en la descripción del Exfoliante
(`data-message-author-role="assistant"`, `<form>`); caracteres Unicode matemáticos en
título, URL y cuerpo del Sérum; Markdown literal (`**texto**`) en cinco productos;
enlace a `https://seedgrow.net/privacy-policy/`; tres dominios `.myshopify.com` filtrados.

**Impacto.** Si la migración se automatiza, la basura se copia intacta a la base nueva.

**Mitigación.**
1. **No automatizar la migración de contenido.** Con 8 productos, la transcripción manual
   revisada es más rápida y segura que un script.
2. Normalizar los caracteres Unicode a ASCII/latino al transcribir.
3. Sanitizar todo HTML antes de guardarlo; nunca `dangerouslySetInnerHTML` sin sanitizar.
4. Test de CI que rechace `data-message-author-role`, `myshopify.com`, `seedgrow`,
   `\*\*` y rangos Unicode matemáticos en el contenido publicado.

**Responsable:** desarrollo. **Estado:** planificado.

---

## 🟡 R13 — Dependencia de apps de terceros

**Evidencia.** Track123 (seguimiento), widget WhatsApp de SeedGrow, Spur-IT, AdSense,
widget de LinkedIn.

**Impacto.** Al salir de Shopify, todas dejan de funcionar. El enlace "Donde Esta su
Pedido?" del menú principal se rompe.

**Mitigación.**
1. `/track-order` propio, con token público seguro + verificación de correo. Elimina la
   dependencia y además cierra el riesgo de enumeración de pedidos.
2. WhatsApp: enlace directo `wa.me`, sin script de terceros ni la política de privacidad
   ajena que arrastraba.
3. **AdSense y LinkedIn no se migran.** Servir anuncios de terceros dentro de la propia
   tienda perjudica la conversión y la percepción de marca.
4. La analítica se implementa con consentimiento, no vía apps.

**Responsable:** desarrollo. **Estado:** planificado.

---

## 🟡 R14 — Correo transaccional desde Gmail

**Evidencia.** El contacto publicado es `gaviotabylia@gmail.com`.

**Impacto.** Resend **no puede enviar correo autenticado desde un dominio gmail.com** que
no se controla. Sin SPF/DKIM/DMARC sobre dominio propio, las confirmaciones de pedido irán
a spam. Un cliente que paga y no recibe confirmación es una incidencia de atención directa.

**Mitigación.**
1. Verificar `gaviotabylia.com` en Resend y configurar los registros DNS. **Pendiente — sin esto RESEND_API_KEY no manda nada real.**
2. Enviar desde `pedidos@gaviotabylia.com`; responder-a puede seguir siendo el Gmail. ✅ hecho — `EMAIL_FROM` en `.env.example`, `replyTo` fijado en `src/lib/email/resend.ts`.
3. Configurar DMARC en modo monitor antes del lanzamiento. Pendiente (DNS).
4. Prueba de entrega real a Gmail, Outlook y iCloud antes de abrir la tienda. Pendiente — solo posible una vez configurado el DNS.
5. Registrar cada envío en base de datos para poder reenviar manualmente desde el panel. ✅ hecho — `email_log` (ya existía) + botón "Reenviar recibo" en `/admin/orders/[id]`.

**Estado del código (2026-09-04):** el recibo de compra a la clienta y la notificación de venta a la propietaria ya están implementados y enganchados a los tres webhooks de pago (`src/lib/email/order-confirmation.ts`). Sin `RESEND_API_KEY` ni `EMAIL_FROM`/`ADMIN_EMAIL` configurados con valores reales, el envío se omite en silencio (se registra en `email_log` como `not_configured`) — un pedido pagado nunca falla por esto, pero tampoco sale ningún correo hasta que se complete el punto 1.

**Responsable:** propietaria (DNS, punto 1 y 3) + desarrollo (hecho: 2, 5). **Estado:** parcialmente resuelto — bloqueado en DNS.

---

## 🟡 R15 — Sin analítica histórica

**Evidencia.** No se detectó GA4, Meta Pixel, Clarity ni TikTok en el HTML de la home.
Solo AdSense, que no mide conversión propia.

**Impacto.** No hay línea base: al lanzar no se podrá saber si la web nueva rinde mejor.
Tampoco existen datos de producto más vendido para el badge correspondiente.

**Mitigación.**
1. Exportar del admin de Shopify lo que exista de analítica **antes** de cancelar.
2. Instalar GA4 y Search Console desde el primer día con eventos de comercio completos.
3. Aceptar que el lanzamiento fija una línea base nueva; documentarlo para no comparar
   contra datos inexistentes.
4. El badge "Más vendido" arranca desactivado y se activa cuando haya ventas propias.

**Responsable:** propietaria + desarrollo. **Estado:** abierto.

---

## 🟡 R16 — La propietaria no es técnica

**Evidencia.** El sitio actual lo construyó una agencia externa; el contenido tiene HTML
pegado por error, lo que indica falta de herramientas seguras de edición.

**Impacto.** Si el panel es difícil, la web se quedará desactualizada o se pedirá ayuda
técnica para cada cambio — exactamente lo que este proyecto busca evitar.

**Mitigación.**
1. Panel en español, con etiquetas del negocio, no técnicas.
2. Editor de contenido que **no acepte HTML pegado**: entrada en texto plano o editor
   controlado que sanitiza. Esto habría evitado el incidente del Exfoliante.
3. Vista previa antes de publicar.
4. Estados `draft` / `active` para publicar sin miedo.
5. `ADMIN_GUIDE.md` con capturas y flujos completos.
6. Auditoría de acciones: cualquier cambio es reversible porque se guarda el dato anterior.

**Responsable:** desarrollo. **Estado:** planificado.

---

## 🟡 R17 — Concurrencia sobre la última unidad

**Riesgo.** Dos clientes compran a la vez la última unidad y el stock queda negativo.

**Mitigación.**
1. Reserva de inventario en función PostgreSQL con `SELECT ... FOR UPDATE`, en transacción.
2. `CHECK (stock_quantity >= 0)` a nivel de tabla: la base de datos rechaza el negativo
   aunque falle la lógica de aplicación.
3. Reserva temporal al iniciar el pago, con expiración automática vía tarea programada.
4. Liberación de la reserva si el pago falla o expira.
5. Prueba unitaria con dos transacciones concurrentes sobre una unidad.

**Responsable:** desarrollo. **Estado:** planificado.

---

## 🟡 R18 — Ambigüedad de jurisdicción

**Evidencia.** Moneda USD, teléfono con prefijo 401 (Rhode Island, EE. UU.), transportista
USPS, dirección publicada literalmente "Estados Unidos". Marca, fundadora e identidad,
dominicanas. Nombre legal: **no aparece en ninguna parte del sitio**.

**Impacto.** Determina la normativa cosmética aplicable, el tratamiento fiscal, la
pasarela contratable y el contenido de las políticas. **Bloquea R2 y R4.**

**Mitigación.**
1. Confirmar el país de registro de la empresa y su nombre legal.
2. Confirmar si se vende también en República Dominicana (afectaría a moneda, envíos e
   impuestos) o solo en EE. UU.
3. El MVP se construye con **una sola moneda y un solo país de venta**. Multimoneda queda
   fuera de alcance.

**Responsable:** propietaria. **Estado:** abierto.

---

## 🟢 R19 — Identidad de marca sin definir

**Evidencia.** La marca se llama Gaviota by **Lia**; la fundadora publicada es **Marlene
Dietsch**. El sitio nunca explica quién es Lia.

**Impacto.** Bajo comercialmente, alto narrativamente. La dirección creativa exige una
historia de marca fuerte, y falta la pieza que todo visitante se pregunta. También afecta
al `Schema Organization` (`founder`, `legalName`).

**Mitigación.** Preguntar a la propietaria. Si Lia es una hija, una madre o un apodo, esa
es probablemente la mejor línea de apertura de `/our-story` — y ahora mismo no está escrita
en ningún sitio.

**Responsable:** propietaria. **Estado:** abierto.

---

## 🟢 R20 — Ventana de corte durante el cambio de DNS

**Riesgo.** Durante la propagación de DNS pueden coexistir ambos sitios; un pedido podría
entrar en Shopify tras haber migrado.

**Mitigación.**
1. Cambio en horario de bajo tráfico.
2. TTL del DNS reducido a 300 s con 48 h de antelación.
3. Poner Shopify en modo contraseña justo antes del cambio.
4. Vigilar el admin de Shopify 72 h por si entra algún pedido rezagado.
5. Plan de reversión documentado en `DEPLOYMENT.md`: mantener Shopify pagado y operativo
   30 días.

**Responsable:** desarrollo + propietaria. **Estado:** planificado.

---

## Resumen: qué bloquea el lanzamiento

Siete asuntos impiden abrir la tienda, y **seis dependen de la propietaria, no del
desarrollo**:

| # | Bloqueante | Responsable |
|---|---|---|
| R1 | Documentación del protector solar (o retirarlo) | Propietaria |
| R2 | Políticas legales redactadas y revisadas | Propietaria + legal |
| R3 | Claims de producto aprobados | Propietaria |
| R4 | Pasarela de pago contratada y operativa | Propietaria |
| R5 | Decisión sobre la estructura de precios | Propietaria |
| R6/R7 | Inventario contado y tarifa de envío definida | Propietaria |
| R14 | DNS del dominio para el correo transaccional | Propietaria |

**El desarrollo no está bloqueado por ninguno.** Todo el MVP se construye y se prueba con
`MockPaymentProvider`, datos seed y tarifa plana de ejemplo. Estas decisiones se necesitan
para *lanzar*, no para *construir* — por eso conviene arrancarlas ya, en paralelo, y no
al final.
