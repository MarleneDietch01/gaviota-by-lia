# Google Search: crecimiento en Estados Unidos

Revisión: 10 de septiembre de 2026. Mercado: Estados Unidos, en inglés y español.

## Estado comprobado

El sitio público responde en `https://www.gaviotabylia.com`. Se comprobaron las páginas `/en`, `/es`, `/robots.txt` y `/sitemap.xml`: todas devolvieron HTTP 200 al seguir la redirección del dominio sin www. Las páginas públicas declaran www como dominio canónico. No se ha accedido a la cuenta de Search Console ni se conocen sus impresiones, clics o páginas indexadas.

Esta revisión implementa las siguientes mejoras:

- Títulos y descripciones de inicio, tienda y categorías más específicos, orientados al catálogo y a envíos en EE. UU.
- Categorías con texto visible que coincide con su descripción para buscadores; inicio y tienda explican que se envía dentro de Estados Unidos.
- Idiomas `en`, `en-US`, `es`, `es-US` y `x-default` coherentes entre páginas y sitemap; cada versión mantiene su propio canonical.
- Sitemap con fotos del producto en cada idioma y políticas comerciales. Sin fechas de modificación inventadas.
- Logo existente, contacto bilingüe e identidad de tienda online en JSON-LD; ofertas con precio USD, stock real, condición, mercado e identidad del vendedor.
- Corrección de `noindex` en bolsa y favoritos: antes el código retornaba antes de llegar a esa condición. Las páginas personales permanecen rastreables para que Google lea `noindex`.
- Diario y kits fuera del sitemap y con `noindex` mientras sus páginas sigan siendo contenido pendiente. Al publicar contenido útil, retirar ese `noindex` y añadirlas de nuevo al sitemap.
- Preguntas frecuentes completas basadas en las políticas y datos ya publicados.
- Soporte opcional de `GOOGLE_SITE_VERIFICATION` para verificación mediante etiqueta HTML.

## Activación en Search Console

1. Publicar los cambios con `NEXT_PUBLIC_SITE_URL=https://www.gaviotabylia.com`. Mantener protegidos de indexación los despliegues de prueba. La configuración local de desarrollo no debe copiarse a producción.
2. Entrar con la cuenta de Google propietaria. Revisar primero si ya existe la propiedad para conservar el historial.
3. Preferiblemente verificar una propiedad de **Dominio** para `gaviotabylia.com`, añadiendo en el proveedor DNS el TXT exacto que entregue Google. Esto cubre www, el dominio sin www y los protocolos. No reemplazar otros TXT existentes. [Documentación de propiedades](https://support.google.com/webmasters/answer/34592?hl=es).
4. Si se elige una propiedad de **Prefijo de URL**, usar `https://www.gaviotabylia.com/`. Como alternativa DNS, copiar solo el valor `content` de la etiqueta de verificación a `GOOGLE_SITE_VERIFICATION` en el entorno de producción, redesplegar y verificar. Esta variable no verifica una propiedad de Dominio.
5. En Sitemaps, enviar `https://www.gaviotabylia.com/sitemap.xml` y comprobar que Google lo procesa correctamente. [Informe de sitemaps](https://support.google.com/webmasters/answer/7451001?hl=es).
6. Usar Inspección de URLs y la prueba en directo con `/en`, `/es`, ambas tiendas y las fichas de producto principales. Comprobar canonical, acceso e indexabilidad. Solicitar indexación de esas páginas tras publicar. [Inspección de URLs](https://support.google.com/webmasters/answer/9012289?hl=es).
7. Probar una ficha real en [Rich Results Test](https://search.google.com/test/rich-results). Revisar que el precio, la moneda, la disponibilidad y las imágenes coincidan con la página. No declarar reseñas, GTIN, certificaciones ni resultados cosméticos que no existan.

Search Console permite medir y diagnosticar la presencia en Google. Enviar el sitemap o solicitar indexación no garantiza posiciones ni ventas.

## Google Merchant Center

Para dar visibilidad al catálogo, configurar Merchant Center y sus fichas gratuitas. Estas pueden mostrar productos en Google Search, Shopping y otras superficies; la aparición depende de elegibilidad y relevancia. En Estados Unidos se requiere información de envío. [Fichas gratuitas: documentación de Google](https://support.google.com/merchants/answer/13889434?hl=es).

- Revisar si quedó una cuenta o fuente de productos del Shopify anterior. Actualizar URLs y evitar fuentes duplicadas con precios antiguos.
- Verificar y reclamar el dominio real, completar los datos de la empresa, elegir Estados Unidos y USD, y configurar envío y devoluciones según las políticas vigentes y el checkout.
- Añadir los productos publicados mediante una fuente admitida o la detección del sitio, si la cuenta la ofrece. El sitemap SEO no es un feed de Merchant Center; esta revisión no creó ni conectó un feed.
- Mantener el idioma de cada producto, su destino y sus imágenes alineados. Los datos estructurados ayudan a interpretar las fichas, pero no sustituyen la configuración de la cuenta.

## Contenido que puede atraer nuevas compradoras

Hipótesis basadas en el catálogo, no volúmenes de búsqueda medidos:

| Intención | Inglés | Español | Destino |
| --- | --- | --- | --- |
| Marca y origen | Dominican body care USA | cuidado corporal dominicano en Estados Unidos | Inicio y tienda |
| Exfoliación corporal | coconut body scrub | exfoliante corporal de coco | Categoría de exfoliación y producto |
| Hidratación | hydrating body cream | crema hidratante corporal | Categoría de hidratación y producto |
| Aceite corporal | stretch mark body oil | aceite corporal para estrías | Aceites y ficha correspondiente |
| Después de depilar | ingrown hair serum | sérum post-depilación | Aceites/sérums y ficha correspondiente |

Ampliar primero las fichas con ingredientes, instrucciones, tamaño, fotografías propias y traducciones revisadas. Después publicar en el diario guías originales de uso de los productos, basadas en sus etiquetas, y enlazar a las fichas pertinentes. Mantener expectativas cosméticas ajustadas a los datos confirmados. No crear páginas repetidas por ciudad sin contenido o servicio local específico.

## Medición durante los primeros 90 días

1. **Antes de publicar:** guardar en Search Console una referencia de los últimos 28 días, si hay datos, separando búsquedas de marca y otras búsquedas, idioma de la URL y país Estados Unidos.
2. **Cada semana del primer mes:** revisar páginas indexadas, errores de rastreo, canonical elegido, problemas de producto y experiencia móvil. Comparar páginas excluidas con las exclusiones intencionales de este documento.
3. **Cada mes:** comparar periodos de 28 días en clics, impresiones y CTR de EE. UU.; buscar consultas con impresiones y pocos clics para mejorar sus páginas. Medir ventas orgánicas cuando haya atribución configurada. Search Console por sí solo no atribuye ingresos a pedidos.
4. **Días 30–90:** priorizar las guías y mejoras de producto según consultas reales. Aprovechar reseñas auténticas y enlaces editoriales relevantes; evaluar campañas pagadas por separado si se desea alcance inmediato y existe presupuesto aprobado.

No se instalaron rastreadores ni campañas. Esta revisión tampoco cambia precios, inventario, pagos o condiciones comerciales.

## Publicación

La vía de producción existente es `master` del remoto `marlene`
(`MarleneDietch01/gaviota-by-lia`), conectado al proyecto Vercel `gaviota-by-lia`
del equipo `marlene5`. El remoto `origin` (`gfelix01/gaviota-by-lia`) se mantiene
sincronizado. Publicar mediante Git conserva las variables y comprobaciones del
entorno de producción. Confirmar el estado del despliegue asociado al commit en
GitHub y comprobar después el dominio público.

## Validación

Validación local de esta revisión: TypeScript, ESLint y 13 pruebas de SEO, catálogo y navegación aprobadas; compilación optimizada de Next.js completada. Comprobación HTTP del resultado compilado: FAQ en ambos idiomas, favoritos, diario, kits y robots responden 200; se verificaron los cinco enlaces de idioma y el `noindex` de las páginas excluidas.

La compilación se comprobó directamente con `next build` usando el entorno local. El control previo de producción (`scripts/check-env.mjs`) rechaza ese entorno porque conserva localhost, pagos y secretos de desarrollo, y no tiene `ADMIN_EMAIL`. Esto no describe las variables del sitio público, que no se inspeccionaron. Para desplegar, utilizar el entorno de producción y pasar su control previo completo.

## Referencias técnicas

- [Versiones localizadas y hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions).
- [Creación de sitemaps y uso de lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- [Datos estructurados para fichas de comerciante](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).
- [SEO para comercio electrónico](https://developers.google.com/search/docs/specialty/ecommerce).
