# Código GAVIOTA10

Implementado el 12 de septiembre de 2026.

## Uso

En la bolsa, escribir `GAVIOTA10` en **Código promocional** y pulsar **Aplicar**.
También se valida al pulsar **Ir a pagar** si se escribió el código sin pulsar
Aplicar. Se aceptan minúsculas y espacios al principio o al final. Se puede
quitar el código antes de iniciar el pago.

- Descuento del 10 % sobre todos los productos del pedido, incluidas cantidades múltiples.
- Sin mínimo de compra ni fecha de vencimiento configurados.
- No se descuenta el envío. Su tarifa y la elegibilidad del envío gratis se
  calculan sobre el subtotal de productos antes del descuento, como antes.
- Stripe calcula los impuestos correspondientes y confirma el redondeo final.
- El descuento se muestra en la bolsa, en Stripe, en el pedido del panel y en
  el recibo. El código queda registrado en las notas internas del pedido y en
  los metadatos de la sesión de Stripe.

## Implementación

`src/lib/commerce/promotion.ts` define el código y la estimación compartida.
`/api/checkout` vuelve a validar el código y obtiene los precios del catálogo
del servidor: el navegador no puede fijar el porcentaje ni el importe.

`src/lib/stripe/promotion.ts` reutiliza el cupón `gaviota10-products-v1`. Si no
existe en la cuenta/modo de Stripe, lo crea en el primer checkout con el código.
Es un cupón de porcentaje aplicado por el servidor; no se requiere crear un
Promotion Code adicional en el Dashboard ni configurar nuevas variables de
entorno. El código se introduce en la bolsa de la web.

Si Stripe no permite aplicar el cupón, la compra se detiene con un mensaje;
no se cobra el precio completo silenciosamente. No se modifican precios del
catálogo ni se requieren migraciones de base de datos.

Los eventos de pago actualizan `orders.discount_total`, el impuesto y el total
antes de mandar el recibo. Si `payment_intent.succeeded` llega primero, recupera
el desglose de la sesión de Checkout. También admite la confirmación de un pago
asíncrono. Los errores al guardar los totales provocan un reintento del webhook.

## Validación

Pruebas automáticas de códigos válidos e inválidos, importes, ausencia de
descuento sin código, creación y reutilización del cupón, fallos de Stripe,
reintento de Stripe Tax, recibo y orden de los eventos de pago.

Stripe TEST confirmó, sin cobros ni pedidos reales:

| Productos | Descuento | Envío | Total sin impuestos |
| --- | --- | --- | --- |
| $80.00 | $8.00 | $14.00 | $86.00 |
| $149.85 | $14.99 | $14.00 | $148.86 |

Las sesiones de prueba se cerraron y el cupón temporal se eliminó al terminar.

TypeScript, ESLint, compilación optimizada de Next.js y 60 pruebas seleccionadas
aprobadas. Se comprobó la interfaz compilada con Playwright en español a 390 px
y en inglés a 1440 px: aplicar/quitar, código inválido, envío del código al pago
y ausencia de desbordamiento horizontal. El endpoint de pago se interceptó en
esa prueba para evitar pedidos reales.

Referencia: [descuentos en Stripe Checkout](https://docs.stripe.com/payments/checkout/discounts).
