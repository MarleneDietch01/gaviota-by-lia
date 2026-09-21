import { type Locale } from '@/lib/i18n';

/**
 * Qué formas de pago se le anuncian a quien compra.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ ESTO NO VA SUELTO EN EL JSX
 * -----------------------------------------------------------------------------
 * Vivía incrustado dos veces en `saved-list.tsx` y decía "Aceptamos tarjeta,
 * Apple Pay y Google Pay donde estén disponibles". Para cuando se revisó (21 de
 * septiembre de 2026, contra la cuenta en vivo), Stripe tenía activos además
 * Klarna, Afterpay, Affirm, Cash App y Amazon Pay: quien llegaba a pagar se
 * encontraba con más opciones de las que se le habían anunciado.
 *
 * Nadie escribió mal ese texto — se quedó atrás. La lista real NO vive en este
 * repositorio: vive en la configuración de métodos de pago de Stripe
 * (`pmc_1U7GnVCCoFpKoAEkD9C8AfLi`), se cambia desde el panel y no deja ningún
 * rastro en el código. Es decir, esto puede volver a desincronizarse sin que
 * ningún despliegue lo delate.
 *
 * Dos defensas, y la segunda importa más que la primera:
 *
 *   1. El texto está aquí, en un módulo, y no repetido en el JSX. Se corrige
 *      en un sitio.
 *
 *   2. La frase se cierra remitiendo a la pantalla de pago. Aunque esta lista
 *      envejezca, lo que se afirma sigue siendo cierto: la pantalla de pago es
 *      la que manda. No es una coletilla de relleno, es lo que impide que el
 *      texto se convierta en una promesa falsa el día que alguien active o
 *      apague un método desde el panel.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ NO SE ENUMERAN LOS NUEVE
 * -----------------------------------------------------------------------------
 * · Link (el monedero de Stripe) se omite a propósito: no es una forma de pago
 *   que nadie elija por su nombre, es un acelerador para tarjetas ya guardadas
 *   y aparece solo. Nombrarlo confunde sin informar.
 *
 * · Klarna, Afterpay y Affirm se agrupan como "pago aplazado" en vez de
 *   prometer plazos concretos. El importe y la elegibilidad los decide cada
 *   proveedor en el momento: anunciar "paga en 4 plazos" sería afirmar algo
 *   que no se cumple para todos los carritos.
 * -----------------------------------------------------------------------------
 */
/* La coletilla dice "al pagar" / "when you pay", no "en el checkout": la frase
   de impuestos que la precede ya usa "checkout", y repetir la palabra dos veces
   en el mismo párrafo se lee como un descuido. "Ir a pagar" es además el texto
   del propio botón que hay justo debajo, así que remite a algo que se ve. */
const PAYMENT_METHODS = {
  en: "We accept card, Apple Pay, Google Pay, Amazon Pay and Cash App, plus pay-over-time with Klarna, Afterpay or Affirm. You'll see which ones are available to you when you pay.",
  es: 'Aceptamos tarjeta, Apple Pay, Google Pay, Amazon Pay y Cash App, además de pago aplazado con Klarna, Afterpay o Affirm. Verás cuáles están disponibles para ti al pagar.',
} as const;

/**
 * Qué se calcula todavía en el checkout.
 *
 * Dos versiones porque la bolsa ya no siempre pospone el envío: cuando hay
 * tarifa configurada muestra una estimación real, y entonces lo único
 * pendiente es el impuesto. Prometer que "el envío se calcula en el checkout"
 * justo debajo de una línea que ya dice "Envío estimado $14.00" se lee como si
 * la cifra de arriba no fuera de fiar.
 */
const PENDING_AT_CHECKOUT = {
  withShippingEstimate: {
    en: 'Sales tax is calculated at checkout from your shipping address.',
    es: 'El impuesto sobre la venta se calcula en el checkout según tu dirección de envío.',
  },
  withoutShippingEstimate: {
    en: 'Taxes and shipping are calculated at checkout.',
    es: 'Impuestos y envío se calculan en el checkout.',
  },
} as const;

/**
 * La nota completa bajo el resumen de la bolsa.
 *
 * `hasShippingEstimate` viene de si el servidor pudo leer la tarifa de
 * `shipping_rates`; ver `saved-list.tsx`.
 */
export function checkoutSummaryNote(locale: Locale, hasShippingEstimate: boolean): string {
  const pending = hasShippingEstimate
    ? PENDING_AT_CHECKOUT.withShippingEstimate
    : PENDING_AT_CHECKOUT.withoutShippingEstimate;

  return `${pending[locale]} ${PAYMENT_METHODS[locale]}`;
}
