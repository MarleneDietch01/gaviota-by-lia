# Auditoría de diseño — 20 de septiembre de 2026

La identidad visual es coherente y merece conservarse. Las mejoras de mayor impacto están en la jerarquía comercial, el recorrido móvil y la adaptación a tablet.

## Alcance y evidencia

Revisión de la aplicación local con su catálogo conectado, en Chromium. Portada a 390, 768, 1440 y 1920 px; tienda a 390 px; ficha de Aceite Anti-Estrías a 390 y 1440 px; carrito con un producto a 390 px. Se revisó además el código de los componentes y el contenido vigente. Los documentos históricos del proyecto no se tomaron como evidencia del estado actual.

Capturas y mediciones: [artifacts/design-audit-2026-09-20](../artifacts/design-audit-2026-09-20/). Las capturas `audit-*` incluyen la oferta automática; las capturas `home-*`, `shop-*` y `product-*` permiten revisar las páginas con la oferta cerrada. El icono «N» que aparece en algunas capturas pertenece al entorno de desarrollo.

No se modificó la interfaz. No se realizó ningún pago, envío de formulario ni cambio de datos de negocio. Las cifras de altura son observaciones de esta sesión, no métricas de rendimiento ni resultados de conversión. Esta revisión no certifica accesibilidad completa ni otros navegadores.

## Lo que conviene conservar

- Paleta crema, champán, espresso y rosa, consistente entre portada, producto y carrito.
- Composición de escritorio del hero, combinación de tipografías y fotografía de marca.
- Fotografías de producto completas, precios legibles y acciones alineadas en las tarjetas.
- Barra de compra móvil con nombre, precio y botón; evita perder la acción al desplazarse.
- Menú móvil, favoritos, acordeones de información y progreso textual hacia envío gratis ya existentes.

## Cambios prioritarios

| Prioridad | Hallazgo observado | Cambio propuesto |
| --- | --- | --- |
| Alta | En tienda móvil el primer producto empieza aproximadamente en y=925 px, fuera de la primera pantalla de 844 px. Introducción y filtros ocupan toda la vista. | Acortar la introducción y agrupar categoría/orden en un panel «Filtrar y ordenar». Mantener búsqueda compacta y subir los productos. |
| Alta | La portada de tablet mide aproximadamente 21.747 px. «¿Qué quieres cuidar hoy?» ocupa 5.419 px y los tres pasos 3.473 px. Ambas secciones conservan una sola columna hasta 1024 px. | Introducir una composición de tablet: dos columnas para necesidades, primera tarjeta destacada y pasos más compactos. Reducir la altura de las imágenes en móvil. |
| Alta | Hay cinco productos destacados en una cuadrícula de cuatro columnas. El quinto queda solo en una segunda fila; la sección ocupa aproximadamente 1.681 px a 1440 px. | Seleccionar cuatro destacados para esta portada o definir una composición equilibrada para cinco. Conservar el acceso al catálogo completo. |
| Alta | La oferta abre un diálogo modal tras 1,4 segundos. Ya existe una barra superior con el mismo descuento. | Conservar la barra y mostrar el cupón a petición del visitante, o probar un disparador posterior a una interacción significativa. Evitar interrumpir la lectura inicial y la compra. |
| Media | En el hero móvil la fotografía empieza cerca de y=686 px. El botón principal sí es visible, pero la foto queda mayormente bajo el primer pliegue. | Compactar antetítulo, márgenes y texto secundario para mostrar más fotografía manteniendo visible la acción de compra. |
| Media | El WhatsApp flotante coincide con el área de «Ordenar por» en tienda móvil y con la zona de cupón/resumen del carrito. | Ajustar su posición por ruta o integrarlo como enlace de ayuda en el carrito. Verificar superposiciones durante el desplazamiento, no solo en la parte superior. |
| Media | La ficha móvil coloca galería y miniaturas antes del título; el título empieza aproximadamente en y=777 px. | Colocar nombre y beneficio breve antes de la galería, conservando la barra inferior de compra. |
| Media | En el carrito de un artículo de $50 aparece el subtotal y la distancia al envío gratis, pero el importe de envío se pospone al checkout. La política publicada sí declara una tarifa. | Mostrar una estimación de envío para EE. UU. usando la misma fuente de configuración que checkout, junto al subtotal. Identificar impuestos pendientes sin presentar un total incompleto como definitivo. |

Evidencia visual: [tienda móvil](../artifacts/design-audit-2026-09-20/shop-mobile-fold.jpg), [cuadrícula de destacados](../artifacts/design-audit-2026-09-20/collection-desktop.jpg), [cupón](../artifacts/design-audit-2026-09-20/audit-390-fold.jpg), [ficha móvil](../artifacts/design-audit-2026-09-20/product-mobile-fold.jpg), [carrito](../artifacts/design-audit-2026-09-20/cart-mobile.jpg).

En la captura aislada de la cuadrícula, el encabezado adhesivo aparece cruzando la sección por el procedimiento de captura; no se considera un fallo de maquetación. El hallazgo es la segunda fila con un solo producto.

## Qué añadir o completar

1. **Preguntas frecuentes breves en portada.** La ruta `/es/faq` ya contiene respuestas sobre envíos, seguimiento, devoluciones e ingredientes. El componente de portada sigue devolviendo cero preguntas. Reutilizar el contenido vigente desde una fuente compartida y activar tres o cuatro respuestas cerca del cierre comercial.
2. **Un siguiente paso después de añadir.** El botón confirma «Añadido» y cambia el contador, pero podría ofrecer un enlace inmediato «Ver bolsa» y «Seguir comprando» sin obligar a buscar el icono superior. No hace falta un nuevo modal.
3. **Más información útil junto al precio.** Dos o tres datos por producto —uso, textura y momento de aplicación— a partir de contenido confirmado. Priorizar estos datos sobre nuevos bloques genéricos sobre el ritual.

El sistema de reseñas ya existe y las de portada se condicionan a reseñas aprobadas. No hace falta construirlo de nuevo: cuando haya contenido real, colocarlo cerca de productos o kits. La selección por necesidad también existe; primero conviene compactarla antes de añadir un cuestionario.

## Ajustes de acabado

- Revisar los textos de 10–11 px del hero, leyendas y metadatos; aumentar los que comuniquen información de compra.
- Mantener una familia de formas coherente: el hero usa curvas grandes y botones tipo píldora, mientras que otros controles son casi rectos. Es una decisión estética secundaria, no un bloqueo.
- Acortar el recorrido editorial: necesidades, campaña, beneficios y pasos repiten la idea del ritual. Conservar las piezas que aporten información distinta y acercar el kit a los productos.
- La navegación incluye «Diario» sin artículos y «Seguir mi pedido» con texto sobre una función futura. Completar su utilidad o sustituir esos accesos por destinos útiles antes de destacarlos. Evitar mostrar explicaciones internas como «rate limiting» al cliente.

## Referencias de implementación

- `src/components/catalog/catalog-page.tsx`: introducción, filtros y rejilla móvil.
- `src/components/sections/build-ritual.tsx:52` y `ritual-steps.tsx:35`: columnas solo a partir de `lg`.
- `src/components/sections/collection.tsx:100`: cuatro columnas; `getFeaturedProducts` devuelve todos los marcados como destacados.
- `src/components/layout/promo-coupon.tsx:30`: temporizador de 1.400 ms.
- `src/components/contact/whatsapp-button.tsx:43`: posición flotante compartida.
- `src/lib/content/faq-items.ts:19`: lista vacía; las respuestas actuales están en `src/lib/content/route-pages.ts`.
- `src/components/commerce/saved-list.tsx`: resumen de compra y mensaje sobre envío.

## Verificaciones realizadas

- Sin desbordamiento horizontal del documento en los cuatro anchos revisados de portada, ni en tienda/ficha a los anchos comprobados.
- Menú móvil abre y cierra con Escape.
- Cierre del cupón permite continuar la interacción.
- Añadir el aceite actualiza la bolsa: una unidad y subtotal de $50 en la sesión local.
- Barra de compra móvil visible; galería, precio y llamada a la acción legibles en escritorio.

Orden recomendado: tienda móvil y tablet; cuadrícula y longitud de portada; cupón y controles flotantes; FAQ e información previa al pago; acabados tipográficos.
