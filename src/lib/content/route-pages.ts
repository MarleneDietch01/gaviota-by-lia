import type { Locale } from '@/lib/i18n';

type Copy = { en: string; es: string };
export interface RoutePage {
  eyebrow: Copy;
  title: Copy;
  body: readonly Copy[];
  links?: readonly { href: string; label: Copy }[];
  /**
   * Imagen de cabecera opcional. SOLO para páginas cuyo activo visual ya está
   * publicado y aprobado en otro punto del sitio, o cuya fotografía llegó
   * directamente de la propietaria de la marca para ese uso — nunca para
   * introducir una imagen que implique una decisión de contenido aún no
   * tomada (ver `journal`, que se queda sin `hero` a propósito: no hay
   * fotografía editorial todavía).
   */
  hero?: { src: string; alt: Copy; focal: string; fit?: 'cover' | 'contain' };
  /**
   * Secciones con encabezado, para páginas largas.
   *
   * `body` se pinta en `text-lead` y sin jerarquía: sirve para una o dos
   * frases, no para una política de privacidad. Las legales necesitan que una
   * clienta pueda barrer la página y encontrar "¿cuánto tiempo tengo para
   * devolver?" sin leerlo todo. `body[0]` sigue siendo la entradilla y la
   * descripción de `generateMetadata`; esto va debajo.
   */
  sections?: readonly { heading: Copy; body: readonly Copy[] }[];
  /** Fecha de última revisión, para las páginas legales. */
  updated?: Copy;
}

const c = (en: string, es: string): Copy => ({ en, es });
export const ROUTE_PAGES: Readonly<Record<string, RoutePage>> = {
  rituals: { eyebrow: c('Find your ritual', 'Encuentra tu ritual'), title: c('What would you like to care for today?', '¿Qué quieres cuidar hoy?'), body: [c('Choose a care goal to explore products whose confirmed descriptions match that need. Recommendations use transparent rules, not diagnoses or artificial intelligence.', 'Elige un objetivo de cuidado para explorar productos cuyas descripciones confirmadas coinciden con esa necesidad. Las recomendaciones usan reglas transparentes, no diagnósticos ni inteligencia artificial.')], links: [{ href: '/shop?need=hidratacion', label: c('Hydration', 'Hidratación') }, { href: '/shop?need=textura', label: c('Texture', 'Textura') }, { href: '/shop?need=post-depilacion', label: c('Post-hair-removal care', 'Cuidado post-depilación') }] },
  sets: { eyebrow: c('Gaviota routines', 'Rutinas Gaviota'), title: c('Sets, built on real value', 'Kits basados en valor real'), body: [c('Set composition and pricing are awaiting commercial approval. We will not publish invented savings. In the meantime, build your own ritual from the verified catalog.', 'La composición y los precios de los kits esperan aprobación comercial. No publicaremos ahorros inventados. Mientras tanto, crea tu propio ritual desde el catálogo verificado.')], links: [{ href: '/rituals', label: c('Build a ritual', 'Crear un ritual') }], hero: { src: '/images/gaviota/editorial/coleccion-completa.jpg', focal: '50% 52%', fit: 'contain', alt: c('Gaviota by Lia products grouped as a complete routine set', 'Productos Gaviota by Lia agrupados como kit de rutina completa') } },
  ingredients: { eyebrow: c('Ingredient education', 'Educación de ingredientes'), title: c('Transparency before claims', 'Transparencia antes que promesas'), body: [c('Each product’s full ingredient list is published here exactly as the manufacturer confirms it — nothing added, nothing implied.', 'La lista completa de ingredientes de cada producto se publica aquí tal como la confirma el fabricante: sin añadir ni insinuar nada.')], links: [{ href: '/contact', label: c('Ask about a product', 'Consultar sobre un producto') }], hero: { src: '/images/gaviota/editorial/coleccion-completa.jpg', focal: '50% 45%', alt: c('The complete Gaviota by Lia product line arranged together', 'La línea completa de productos Gaviota by Lia dispuesta en conjunto') } },
  'our-story': { eyebrow: c('Our story', 'Nuestra historia'), title: c('Body care made as a moment of your own', 'Cuidado corporal como un momento propio'), body: [c('Gaviota by Lia is a Dominican-inspired body-care brand focused on intentional routines, warm sensoriality and clear product education.', 'Gaviota by Lia es una marca de cuidado corporal de inspiración dominicana, enfocada en rituales intencionales, sensorialidad cálida y educación clara sobre cada producto.')], links: [{ href: '/founder', label: c('Meet the founder', 'Conocer a la fundadora') }, { href: '/shop', label: c('Explore the collection', 'Explorar la colección') }], hero: { src: '/images/gaviota/editorial/story-fundadora.jpg', focal: '50% 28%', alt: c('Portrait of Marlene Dietsch, founder of Gaviota by Lia', 'Retrato de Marlene Dietsch, fundadora de Gaviota by Lia') } },
  founder: { eyebrow: c('The founder', 'La fundadora'), title: c('A personal vision of everyday care', 'Una visión personal del cuidado diario'), body: [c('Marlene Dietsch founded Gaviota by Lia out of a deep love for the natural beauty of her native Dominican Republic. With a background in the personal-care industry, she has spent her career exploring what Dominican nature has to offer for skin care.', 'Marlene Dietsch fundó Gaviota by Lia con un amor profundo por la belleza natural de su República Dominicana natal. Con una trayectoria en la industria del cuidado personal, ha dedicado su carrera a explorar lo que la naturaleza dominicana tiene para ofrecer al cuidado de la piel.'), c('Her focus is authenticity, quality and sustainability: every product aims to reflect the diversity and vitality of the island, and to turn a daily skin-care routine into a genuine moment of self-care.', 'Su enfoque es la autenticidad, la calidad y la sostenibilidad: cada producto busca reflejar la diversidad y la vitalidad de la isla, y convertir el cuidado diario de la piel en un momento genuino de amor propio.')], hero: { src: '/images/gaviota/founder/fundadora-6.jpg', focal: '50% 22%', alt: c('Marlene Dietsch, founder of Gaviota by Lia', 'Marlene Dietsch, fundadora de Gaviota by Lia') } },
  journal: { eyebrow: c('Beauty Notes', 'Beauty Notes'), title: c('Care, routines and ingredients', 'Cuidado, rituales e ingredientes'), body: [c('No articles are published yet. The journal will open with reviewed educational content rather than placeholder posts.', 'Aún no hay artículos publicados. El diario se abrirá con contenido educativo revisado, no con publicaciones de relleno.')] },
  faq: { eyebrow: c('Help', 'Ayuda'), title: c('Frequently asked questions', 'Preguntas frecuentes'), body: [c('Product, payment, shipping and return answers depend on approved business policies. Send us your question while those policies are finalized.', 'Las respuestas sobre productos, pagos, envíos y devoluciones dependen de políticas comerciales aprobadas. Envíanos tu consulta mientras se finalizan.')], links: [{ href: '/contact', label: c('Contact us', 'Contáctanos') }] },
  contact: { eyebrow: c('Customer care', 'Atención al cliente'), title: c('How can we help?', '¿Cómo podemos ayudarte?'), body: [c('Send us your question and our team will reply within 1–2 business days.', 'Envíanos tu consulta y nuestro equipo responderá en un plazo de 1–2 días laborables.'), c('Phone / WhatsApp: 401-305-8713 · Email: gaviotabylia@gmail.com', 'Teléfono / WhatsApp: 401-305-8713 · Correo: gaviotabylia@gmail.com'), c('Gaviota By Lia LLC — 5 Rangeley Avenue, Providence, RI 02908, United States.', 'Gaviota By Lia LLC — 5 Rangeley Avenue, Providence, RI 02908, Estados Unidos.')], links: [{ href: 'https://api.whatsapp.com/send?phone=14013058713', label: c('Message on WhatsApp', 'Escribir por WhatsApp') }, { href: 'https://www.instagram.com/gaviotabylia/', label: c('Message on Instagram', 'Escribir por Instagram') }] },
  'track-order': { eyebrow: c('Orders', 'Pedidos'), title: c('Track your order', 'Seguir mi pedido'), body: [c('Order lookup will be enabled with rate limiting and a generic response once the order service is connected. It is not exposed prematurely because that could leak customer information.', 'La consulta de pedidos se habilitará con rate limiting y respuesta genérica cuando se conecte el servicio de órdenes. No se expone antes porque podría filtrar información de clientes.')], links: [{ href: '/contact', label: c('Get help', 'Obtener ayuda') }] },
  'shipping-policy': { eyebrow: c('Policies', 'Políticas'), title: c('Shipping policy', 'Política de envíos'), body: [c('Orders are processed within 2 business days of purchase.', 'Los pedidos se procesan en un plazo de 2 días hábiles desde la compra.'), c('We ship via USPS Priority Mail. Once processed, delivery typically takes 3–4 business days.', 'Enviamos por USPS Priority Mail. Una vez procesado, la entrega suele tardar de 3 a 4 días hábiles.'), c('Shipping is $14.00 on U.S. orders. Orders of $100 or more ship free.', 'El envío cuesta $14.00 en pedidos dentro de EE. UU. Los pedidos de $100 o más tienen envío gratis.'), c('You will receive an email confirmation with a tracking number once your order ships.', 'Recibirás una confirmación por correo electrónico con número de seguimiento en cuanto se envíe tu pedido.')], updated: c('Last updated: 10 September 2026.', 'Última actualización: 10 de septiembre de 2026.') },
  'refund-policy': {
    eyebrow: c("Policies", "Políticas"),
    title: c("Return and refund policy", "Política de devoluciones y reembolsos"),
    body: [c("You have 30 days from delivery to return an unopened product. If something arrived damaged or wrong, we fix it at our expense.", "Tienes 30 días desde la entrega para devolver un producto sin abrir. Si algo llegó dañado o equivocado, lo resolvemos nosotros y sin coste para ti.")],
    sections: [
      { heading: c("Window and condition", "Plazo y estado del producto"), body: [
        c("You have 30 calendar days from the delivery date to request a return.", "Tienes 30 días naturales desde la fecha de entrega para solicitar una devolución."),
        c("The product must be unopened, with its seal intact and in its original packaging. These are body-care cosmetics: for hygiene reasons we cannot accept an opened or used product, because it cannot be sold to anyone else. The only exception is a defective, damaged or incorrect item, covered further down.", "El producto debe estar sin abrir, con el precinto intacto y en su empaque original. Son cosméticos de cuidado corporal: por higiene no podemos aceptar un producto abierto o usado, porque ya no puede venderse a nadie más. La única excepción es un artículo defectuoso, dañado o equivocado, que se cubre más abajo."),
      ] },
      { heading: c("How to start a return", "Cómo iniciar una devolución"), body: [
        c("Contact us first with your order number — it looks like GV-2026-000037 and appears on your receipt. Write to gaviotabylia@gmail.com or message us on WhatsApp at +1 401 305 8713.", "Escríbenos primero con tu número de pedido: tiene la forma GV-2026-000037 y aparece en tu recibo. Escríbenos a gaviotabylia@gmail.com o por WhatsApp al +1 401 305 8713."),
        c("Wait for our confirmation before shipping anything back. A package that arrives without us expecting it can go astray, and we cannot refund what we cannot identify.", "Espera nuestra confirmación antes de enviar nada de vuelta. Un paquete que llega sin que lo estemos esperando puede extraviarse, y no podemos reembolsar lo que no logramos identificar."),
      ] },
      { heading: c("Who pays for return shipping", "Quién paga el envío de la devolución"), body: [
        c("For a change of mind, return shipping is at your expense. Use a service with tracking and keep the receipt: without proof of delivery we have no way to confirm the package reached us.", "Si la devolución es por arrepentimiento, el envío de vuelta corre por tu cuenta. Usa un servicio con seguimiento y guarda el comprobante: sin prueba de entrega no tenemos forma de confirmar que el paquete llegó."),
        c("The original shipping charge is not refunded on a change-of-mind return, since that service was already provided.", "El costo del envío original no se reembolsa en una devolución por arrepentimiento, porque ese servicio ya se prestó."),
      ] },
      { heading: c("Damaged, defective or incorrect items", "Producto dañado, defectuoso o equivocado"), body: [
        c("This is on us. Tell us within 7 days of delivery and send a photo of the product and the packaging. We pay the return shipping and you choose: a replacement or a full refund, including the original shipping charge.", "Esto corre por nuestra cuenta. Avísanos dentro de los 7 días siguientes a la entrega y envíanos una foto del producto y del empaque. Nosotros pagamos el envío de vuelta y tú eliges: reposición o reembolso completo, incluido el costo del envío original."),
      ] },
      { heading: c("Refunds", "Reembolsos"), body: [
        c("Refunds are issued to the original payment method through Stripe, within 5 business days of us receiving and checking the return. We cannot refund to a different card or account.", "Los reembolsos se emiten al método de pago original a través de Stripe, dentro de los 5 días hábiles siguientes a que recibamos y revisemos la devolución. No podemos reembolsar a una tarjeta o cuenta distinta."),
        c("Once issued, your bank may take another 5 to 10 business days to show it. That part is out of our hands.", "Una vez emitido, tu banco puede tardar de 5 a 10 días hábiles adicionales en reflejarlo. Esa parte ya no depende de nosotros."),
      ] },
      { heading: c("Cancelling an order", "Cancelar un pedido"), body: [
        c("If your order has not shipped yet, we cancel it and refund it in full. Orders are processed within 2 business days, so tell us as soon as you can. Once it has shipped, the return process above applies.", "Si tu pedido todavía no se ha enviado, lo cancelamos y lo reembolsamos íntegramente. Los pedidos se procesan en un plazo de 2 días hábiles, así que avísanos cuanto antes. Una vez enviado, aplica el proceso de devolución de arriba."),
      ] },
    ],
    links: [{ href: '/contact', label: c("Contact us", "Escríbenos") }, { href: '/shipping-policy', label: c("Shipping policy", "Política de envíos") }],
    updated: c("Last updated: 10 September 2026.", "Última actualización: 10 de septiembre de 2026."),
  },
  'privacy-policy': {
    eyebrow: c("Policies", "Políticas"),
    title: c("Privacy policy", "Política de privacidad"),
    body: [c("We collect the minimum needed to get your order to you. No analytics, no advertising pixels, no tracking, and we never sell your data.", "Recogemos lo mínimo necesario para hacerte llegar tu pedido. Sin analítica, sin píxeles publicitarios, sin rastreo, y nunca vendemos tus datos.")],
    sections: [
      { heading: c("Who is responsible", "Quién es responsable"), body: [
        c("Gaviota By Lia LLC, a limited liability company formed in Rhode Island, United States, operates this store and is responsible for the data described here. Write to gaviotabylia@gmail.com or message us on WhatsApp at +1 401 305 8713.", "Gaviota By Lia LLC, sociedad de responsabilidad limitada constituida en Rhode Island, Estados Unidos, opera esta tienda y es responsable de los datos que se describen aquí. Escríbenos a gaviotabylia@gmail.com o por WhatsApp al +1 401 305 8713."),
      ] },
      { heading: c("What we collect", "Qué datos recogemos"), body: [
        c("When you buy: your name, email address, phone number and shipping address. We need all four to charge the order and deliver it.", "Cuando compras: tu nombre, correo electrónico, teléfono y dirección de envío. Necesitamos los cuatro para cobrar el pedido y entregarlo."),
        c("We never see your card. Payment happens entirely on Stripe: your card details do not pass through our servers and are not stored in our database at any point.", "Nunca vemos tu tarjeta. El pago ocurre íntegramente en Stripe: los datos de tu tarjeta no pasan por nuestros servidores ni se guardan en nuestra base de datos en ningún momento."),
        c("If you create an account, which is optional: your email address and a password. The password is handled by our authentication provider and is stored hashed — we cannot see it or recover it for you.", "Si creas una cuenta, que es opcional: tu correo y una contraseña. La contraseña la gestiona nuestro proveedor de autenticación y se guarda cifrada — no podemos verla ni recuperarla por ti."),
        c("If you write to us through the contact form: your name, email, phone, subject and message. If you leave a review: your rating and the text you write.", "Si nos escribes por el formulario de contacto: tu nombre, correo, teléfono, asunto y mensaje. Si dejas una reseña: tu calificación y el texto que escribas."),
      ] },
      { heading: c("What we use it for", "Para qué los usamos"), body: [
        c("To process and ship your order, to send you the receipt and the tracking number, to answer you when you write to us, and to publish your review if you leave one and it is approved.", "Para procesar y enviar tu pedido, mandarte el recibo y el número de seguimiento, responderte cuando nos escribes, y publicar tu reseña si dejas una y se aprueba."),
        c("We do not send marketing email. Every email this store sends today is transactional: it is about an order you placed.", "No enviamos correo comercial. Todos los correos que manda esta tienda hoy son transaccionales: se refieren a un pedido que hiciste."),
      ] },
      { heading: c("Who we share it with", "Con quién los compartimos"), body: [
        c("Only with the services needed for your order to exist and arrive: Stripe processes the payment, Supabase hosts the database and accounts, Resend delivers our emails, Vercel hosts the site, and USPS delivers the parcel. Each one only receives what its job requires.", "Solo con los servicios necesarios para que tu pedido exista y llegue: Stripe procesa el pago, Supabase aloja la base de datos y las cuentas, Resend entrega nuestros correos, Vercel aloja el sitio y USPS entrega el paquete. Cada uno recibe únicamente lo que su función requiere."),
        c("We do not sell, rent or trade your data, and we do not share it for advertising purposes with anyone.", "No vendemos, alquilamos ni intercambiamos tus datos, y no los compartimos con nadie con fines publicitarios."),
      ] },
      { heading: c("How long we keep it", "Cuánto tiempo los guardamos"), body: [
        c("Orders and their receipts are kept for as long as tax and accounting obligations require. Contact messages and account data are kept until you ask us to delete them.", "Los pedidos y sus recibos se conservan durante el tiempo que exijan las obligaciones fiscales y contables. Los mensajes de contacto y los datos de la cuenta se conservan hasta que nos pidas eliminarlos."),
      ] },
      { heading: c("Your rights", "Tus derechos"), body: [
        c("You can ask us for a copy of your data, for a correction, or for its deletion. Write to gaviotabylia@gmail.com and we will answer within 30 days.", "Puedes pedirnos una copia de tus datos, su corrección o su eliminación. Escribe a gaviotabylia@gmail.com y te respondemos en un plazo de 30 días."),
        c("Deleting your account does not erase orders already invoiced: we are required to keep those records. It does remove your login and everything not tied to a completed sale.", "Eliminar tu cuenta no borra los pedidos ya facturados: estamos obligados a conservar esos registros. Sí elimina tu acceso y todo lo que no esté ligado a una venta completada."),
      ] },
      { heading: c("Minors", "Menores de edad"), body: [
        c("This store is not directed at people under 18 and we do not knowingly collect their data. If you believe a minor has given us data, write to us and we will delete it.", "Esta tienda no está dirigida a menores de 18 años y no recogemos sus datos a sabiendas. Si crees que un menor nos ha facilitado datos, escríbenos y los eliminaremos."),
      ] },
      { heading: c("Changes to this policy", "Cambios en esta política"), body: [
        c("If anything material changes, we update this page and the date at the bottom. The version published when you buy is the one that governs your purchase.", "Si algo relevante cambia, actualizamos esta página y la fecha del pie. La versión publicada en el momento de tu compra es la que rige esa compra."),
      ] },
    ],
    links: [{ href: '/cookies', label: c("Cookie policy", "Política de cookies") }, { href: '/contact', label: c("Contact us", "Escríbenos") }],
    updated: c("Last updated: 10 September 2026.", "Última actualización: 10 de septiembre de 2026."),
  },
  terms: {
    eyebrow: c("Policies", "Políticas"),
    title: c("Terms and conditions", "Términos y condiciones"),
    body: [c("These terms govern purchases on gaviotabylia.com, operated by Gaviota By Lia LLC in Rhode Island, United States.", "Estas condiciones rigen las compras en gaviotabylia.com, tienda operada por Gaviota By Lia LLC en Rhode Island, Estados Unidos.")],
    sections: [
      { heading: c("Who we are", "Quiénes somos"), body: [
        c("Gaviota By Lia LLC, a limited liability company formed in Rhode Island, United States. Write to gaviotabylia@gmail.com or message us on WhatsApp at +1 401 305 8713.", "Gaviota By Lia LLC, sociedad de responsabilidad limitada constituida en Rhode Island, Estados Unidos. Escríbenos a gaviotabylia@gmail.com o por WhatsApp al +1 401 305 8713."),
      ] },
      { heading: c("Who can buy, and where we ship", "Quién puede comprar y a dónde enviamos"), body: [
        c("You must be 18 or older to place an order. We currently ship within the United States only — checkout will not accept an address outside the country.", "Debes tener 18 años o más para hacer un pedido. Por ahora enviamos únicamente dentro de Estados Unidos: el proceso de pago no admite una dirección fuera del país."),
      ] },
      { heading: c("Prices and payment", "Precios y pago"), body: [
        c("All prices are in United States dollars (USD). The total shown before you confirm is the total that gets charged.", "Todos los precios están en dólares estadounidenses (USD). El total que ves antes de confirmar es el que se cobra."),
        c("Payment is processed by Stripe. We accept Visa, Mastercard, American Express and Discover. The charge is made when you confirm the order.", "El pago lo procesa Stripe. Aceptamos Visa, Mastercard, American Express y Discover. El cargo se realiza al confirmar el pedido."),
      ] },
      { heading: c("Availability", "Disponibilidad"), body: [
        c("Everything is made in small batches. If a product runs out before we can ship yours, we tell you and refund that item in full — we will not substitute it for something else without asking you.", "Todo se elabora en lotes pequeños. Si un producto se agota antes de que podamos enviarte el tuyo, te avisamos y te reembolsamos ese artículo íntegramente: no lo sustituimos por otro sin preguntarte."),
      ] },
      { heading: c("Shipping and returns", "Envíos y devoluciones"), body: [
        c("Shipping is $14.00 within the United States, free on orders of $100 or more, sent by USPS Priority Mail after up to 2 business days of processing. Returns are accepted for 30 days on unopened products. Both policies are set out in full on their own pages, linked below, and form part of these terms.", "El envío cuesta $14.00 dentro de Estados Unidos, gratis en pedidos de $100 o más, por USPS Priority Mail tras un procesamiento de hasta 2 días hábiles. Las devoluciones se aceptan durante 30 días para productos sin abrir. Ambas políticas se detallan en sus propias páginas, enlazadas abajo, y forman parte de estas condiciones."),
      ] },
      { heading: c("What our products are", "Qué son nuestros productos"), body: [
        c("They are body-care cosmetics. They are not medicines: they do not diagnose, treat, cure or prevent any disease, and they do not replace the advice of a healthcare professional.", "Son cosméticos de cuidado corporal. No son medicamentos: no diagnostican, tratan, curan ni previenen ninguna enfermedad, y no sustituyen el consejo de un profesional sanitario."),
        c("Patch-test on a small area before first use and stop if irritation appears. Each product page lists its ingredients (INCI) and its precautions — read them, especially if you are pregnant, breastfeeding or have sensitive skin.", "Haz una prueba en una zona pequeña antes del primer uso y suspende si aparece irritación. Cada ficha de producto indica sus ingredientes (INCI) y sus precauciones: léelas, sobre todo si estás embarazada, en lactancia o tienes la piel sensible."),
      ] },
      { heading: c("Reviews", "Reseñas"), body: [
        c("Only someone who received an order containing the product can review it. We read every review before publishing it and we never edit your words: we either approve it or we do not.", "Solo quien recibió un pedido que contenía el producto puede reseñarlo. Leemos cada reseña antes de publicarla y nunca editamos tus palabras: la aprobamos o no la aprobamos."),
        c("We decline reviews that contain other people personal data, insults, or medical claims about what a product cures — the last one because we are not allowed to publish them, not because we disagree.", "Rechazamos las reseñas que contengan datos personales de terceros, insultos o afirmaciones médicas sobre lo que un producto cura; esto último porque no nos está permitido publicarlas, no porque no estemos de acuerdo."),
      ] },
      { heading: c("Site content", "Contenido del sitio"), body: [
        c("The text, photographs, designs and brand marks on this site belong to Gaviota By Lia LLC and may not be reproduced commercially without written permission.", "Los textos, fotografías, diseños y signos de marca de este sitio pertenecen a Gaviota By Lia LLC y no pueden reproducirse con fines comerciales sin autorización por escrito."),
      ] },
      { heading: c("Governing law", "Ley aplicable"), body: [
        c("These terms are governed by the laws of the State of Rhode Island, United States.", "Estas condiciones se rigen por las leyes del estado de Rhode Island, Estados Unidos."),
      ] },
      { heading: c("Changes", "Cambios"), body: [
        c("We may update these terms. The version published at the time of your purchase is the one that applies to it.", "Podemos actualizar estas condiciones. La versión publicada en el momento de tu compra es la que se aplica a esa compra."),
      ] },
    ],
    links: [{ href: '/shipping-policy', label: c("Shipping policy", "Política de envíos") }, { href: '/refund-policy', label: c("Return policy", "Política de devoluciones") }, { href: '/privacy-policy', label: c("Privacy policy", "Política de privacidad") }],
    updated: c("Last updated: 10 September 2026.", "Última actualización: 10 de septiembre de 2026."),
  },
  cookies: {
    eyebrow: c("Privacy choices", "Opciones de privacidad"),
    title: c("Cookie policy", "Política de cookies"),
    body: [c("We use no advertising or analytics cookies. Only the storage this store needs to keep your bag and your session working.", "No usamos cookies publicitarias ni de analítica. Solo el almacenamiento imprescindible para que tu bolsa y tu sesión funcionen.")],
    sections: [
      { heading: c("What we store in your browser", "Lo que guardamos en tu navegador"), body: [
        c("Your bag and your saved favourites are kept in your browser local storage. They never travel to our servers or to anyone else: they live on your device, and clearing the site data removes them.", "Tu bolsa y tus favoritos se guardan en el almacenamiento local de tu navegador. Nunca viajan a nuestros servidores ni a nadie más: viven en tu dispositivo, y al borrar los datos del sitio desaparecen."),
      ] },
      { heading: c("Session cookie", "Cookie de sesión"), body: [
        c("If you sign in, a cookie keeps your session open so you do not have to log in on every page. It is strictly necessary for the account to work and it goes away when you sign out.", "Si inicias sesión, una cookie mantiene tu sesión abierta para que no tengas que identificarte en cada página. Es estrictamente necesaria para que la cuenta funcione y desaparece al cerrar sesión."),
      ] },
      { heading: c("What we do not use", "Lo que no usamos"), body: [
        c("No Google Analytics, no Meta pixel, no TikTok pixel, no advertising networks, no cross-site tracking. This is why the site does not ask you for cookie consent: there is nothing optional to consent to.", "Sin Google Analytics, sin píxel de Meta, sin píxel de TikTok, sin redes publicitarias, sin rastreo entre sitios. Por eso esta web no te pide consentimiento de cookies: no hay nada opcional que consentir."),
        c("If that ever changes, we will ask you before setting anything, and this page will say so.", "Si eso llegara a cambiar, te lo preguntaremos antes de instalar nada, y esta página lo dirá."),
      ] },
      { heading: c("During payment", "Durante el pago"), body: [
        c("Checkout takes place on Stripe. Stripe sets its own cookies there, mainly to prevent fraud, and those are governed by Stripe privacy policy, not by this one.", "El pago se realiza en Stripe. Allí Stripe instala sus propias cookies, sobre todo para prevenir el fraude, y se rigen por la política de privacidad de Stripe, no por esta."),
      ] },
      { heading: c("How to remove them", "Cómo borrarlos"), body: [
        c("Any browser lets you clear a site data from its settings. You will lose your bag and you will need to sign in again. Nothing else is affected.", "Cualquier navegador permite borrar los datos de un sitio desde sus ajustes. Perderás tu bolsa y tendrás que iniciar sesión de nuevo. Nada más se ve afectado."),
      ] },
    ],
    links: [{ href: '/privacy-policy', label: c("Privacy policy", "Política de privacidad") }],
    updated: c("Last updated: 10 September 2026.", "Última actualización: 10 de septiembre de 2026."),
  },
};

export const localizedCopy = (copy: Copy, locale: Locale) => copy[locale];
