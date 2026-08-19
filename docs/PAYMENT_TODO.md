# PAYMENT_TODO.md — Configuración de pagos

**No se asume ninguna pasarela.** El MVP se construye y se prueba íntegramente con
`MockPaymentProvider`; la decisión real puede tomarse en paralelo al desarrollo.

---

## 1. Datos requeridos

| Dato | Estado | Por qué |
|---|---|---|
| **País de registro de la empresa** | ❓ | Determina qué pasarelas puede contratar |
| **Nombre legal completo** | ❓ | Obligatorio en el alta |
| **Identificación fiscal** | ❓ | Obligatorio en el alta |
| **Dirección legal** | ❓ | Hoy solo consta "Estados Unidos" |
| **Moneda de cobro** | USD (deducido del sitio) | ✅ Confirmar |
| **Países de los clientes** | ❓ | USPS sugiere EE. UU. doméstico |
| **Cuenta bancaria de liquidación** | ❓ | Debe coincidir con el país de registro |
| **Proveedor seleccionado** | ❓ | Ver §2 |
| **Volumen mensual estimado** | ❓ | Afecta a comisiones y verificación |
| **Ticket medio** | ~$40–120 | Deducido de los precios |

**Bloqueante.** El alta del comercio exige políticas de privacidad, reembolso y términos
válidas y publicadas. Las actuales tienen marcadores sin rellenar
(`LEGAL_TODO.md` L3, L4, L5). **Esto puede hacer que se deniegue la solicitud.**

---

## 2. Opciones de proveedor

Comparativa orientativa. La elección depende de L1 (jurisdicción).

| Proveedor | Ventajas | Inconvenientes |
|---|---|---|
| **Stripe** | Documentación excelente, webhooks robustos, Apple/Google Pay, buen entorno de pruebas | No opera en todos los países |
| **PayPal / Braintree** | Confianza del comprador, ya presente en el sitio actual | Integración más engorrosa, disputas frecuentes |
| **Square** | Bueno si hay venta presencial | Menor alcance internacional |
| **Azul / Cardnet** (RD) | Necesarios si se cobra en RD | Integración local, documentación limitada |

**Recomendación provisional (si la empresa está registrada en EE. UU.): Stripe.** Su
modelo de webhooks encaja directamente con el requisito de idempotencia y firma, y su
entorno de pruebas permite validar el flujo completo antes de activar cobros reales.

**No se contrata nada hasta confirmar L1.**

---

## 3. Arquitectura ya definida

Interfaz implementada desde la fase 5:

```ts
export interface PaymentProvider {
  createPaymentSession(input: CreatePaymentInput): Promise<PaymentSession>;
  verifyPayment(reference: string): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;
  parseWebhook(rawBody: string, signature: string): Promise<PaymentWebhookEvent>;
}
```

Implementaciones:

| Clase | Estado | Uso |
|---|---|---|
| `MockPaymentProvider` | Fase 5 | Desarrollo y pruebas E2E |
| `<Real>PaymentProvider` | Tras decidir | Producción |

Se selecciona con `PAYMENT_PROVIDER`. **Cambiar de proveedor afecta a un solo archivo.**

---

## 4. Requisitos del webhook

El punto más sensible del sistema. Requisitos no negociables:

| Requisito | Implementación |
|---|---|
| **Verificación de firma** | Sobre el **cuerpo crudo**, antes de parsear |
| **Idempotencia** | `unique (provider, provider_event_id)` en `payment_events` |
| **Registro de eventos** | Todo evento se guarda, se procese o no |
| **Respuesta rápida** | 200 en <5 s; el trabajo pesado va después |
| **Reintentos** | Un duplicado devuelve 200 sin reprocesar |
| **HTTPS** | Obligatorio |
| **Sin autenticación de sesión** | La firma es la autenticación |

```
POST /api/webhooks/payments
  1. Leer cuerpo CRUDO (sin parsear)
  2. Verificar firma con PAYMENT_WEBHOOK_SECRET → si falla, 400
  3. INSERT en payment_events → si choca con la clave única, 200 y salir
  4. Procesar: pedido → paid, reserva → salida definitiva
  5. Enviar correos
  6. 200
```

**El paso 3 antes del 4 es deliberado.** Si se procesa primero y se registra después, un
reintento durante el procesamiento descuenta inventario dos veces.

**Un pedido nunca pasa a `paid` por una redirección del navegador.** Un usuario puede
navegar directamente a la URL de confirmación sin haber pagado; el pedido seguirá en
`pending_payment`.

---

## 5. Estados de pago

```
pending ──> authorized ──> paid ──> refunded
   │                        │   └──> partially_refunded
   ├──> failed              │
   └──> cancelled           └──> (se confirma la salida de inventario)
```

| Estado | Efecto |
|---|---|
| `pending` | Pedido creado, inventario **reservado** |
| `authorized` | Autorizado sin capturar |
| `paid` | **Reserva → salida definitiva.** Se envían correos |
| `failed` | **Reserva liberada.** Correo de pago rechazado |
| `cancelled` | Reserva liberada |
| `refunded` | Devolución total. Reposición de stock manual |
| `partially_refunded` | Devolución parcial |

Los reembolsos automáticos avanzados quedan **fuera del MVP**: la propietaria marca el
reembolso manualmente desde el panel tras procesarlo en la pasarela.

---

## 6. Seguridad

**Nunca se almacena:**
- Número completo de tarjeta
- CVV / CVC
- Fecha de caducidad
- Banda magnética o PIN

**Sí se almacena:** marca y últimos cuatro dígitos (`visa ****4242`), tal como los
devuelve el proveedor, y el identificador de pago del proveedor.

Los datos de tarjeta **nunca tocan el servidor**: se introducen en el formulario alojado o
en el componente embebido del proveedor. Esto mantiene el alcance PCI en el nivel mínimo
(SAQ A).

| Medida | Estado |
|---|---|
| Claves solo en variables de entorno | ✅ Planificado |
| `PAYMENT_SECRET_KEY` sin `NEXT_PUBLIC_` | ✅ |
| Firma de webhook verificada | ✅ |
| Importes recalculados en servidor | ✅ |
| Idempotencia | ✅ |
| Rate limiting en creación de sesión | ✅ |
| Registro de todo evento | ✅ |

---

## 7. Política de reembolso

Depende de `LEGAL_TODO.md` L4. La política actual dice *"todas las ventas son finales"*,
lo que **no evita un contracargo**: PayPal y las marcas de tarjeta aplican sus propias
reglas de protección al comprador con independencia de lo que diga la tienda.

- [ ] Plazo de devolución
- [ ] ¿Producto abierto o usado?
- [ ] ¿Quién paga el envío de retorno?
- [ ] Plazo de reembolso tras recibir la devolución
- [ ] ¿Reembolso total o parcial?
- [ ] Procedimiento ante contracargos

---

## 8. Variables de entorno

```bash
PAYMENT_PROVIDER=mock          # mock | stripe | paypal | ...
PAYMENT_PUBLIC_KEY=            # publicable
PAYMENT_SECRET_KEY=            # SECRETO — nunca NEXT_PUBLIC_
PAYMENT_WEBHOOK_SECRET=        # SECRETO — verificación de firma
```

`.env.example` no contiene valores reales.

---

## 9. Pruebas antes de activar

- [ ] Compra correcta con tarjeta de prueba
- [ ] Pago rechazado → reserva liberada
- [ ] **Webhook duplicado ×5 → un solo procesamiento**
- [ ] Webhook con firma inválida → 400
- [ ] Webhook con retraso → correcto
- [ ] Pedido con cupón → totales correctos
- [ ] Envío gratis por umbral → total correcto
- [ ] Reembolso desde el panel
- [ ] Correos entregados en Gmail, Outlook, iCloud
- [ ] **Compra real con tarjeta propia** antes de abrir al público
- [ ] Verificar el ingreso en la cuenta bancaria

---

## 10. Checklist de activación

- [ ] L1 resuelto (nombre legal y jurisdicción)
- [ ] L3, L4, L5 publicadas (privacidad, reembolso, términos)
- [ ] Proveedor elegido
- [ ] Cuenta de comercio aprobada
- [ ] Cuenta bancaria verificada
- [ ] Claves de producción en Vercel
- [ ] Webhook registrado con la URL de producción
- [ ] Firma del webhook verificada en producción
- [ ] Pruebas de §9 superadas
- [ ] Compra real completada y cobrada
- [ ] `PAYMENT_PROVIDER` distinto de `mock` ✅

**El último punto se comprueba automáticamente:** el despliegue de producción falla si
`PAYMENT_PROVIDER=mock`. Es la garantía técnica de la regla "no publicar mocks en
producción".
