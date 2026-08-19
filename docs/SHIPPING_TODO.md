# SHIPPING_TODO.md — Configuración de envíos

**No se inventará ninguna tarifa ni transportista.** Todo lo que sigue son datos que debe
aportar la propietaria.

---

## 1. Lo único que sí sabemos

La política de envíos del sitio actual es el **único documento legal con datos operativos
reales**. Extraído literalmente:

| Dato | Valor |
|---|---|
| Tiempo de procesamiento | **2 días hábiles** |
| Transportista | **USPS Priority Mail** |
| Tiempo de entrega | **3–4 días hábiles** |
| Tracking | Se envía por correo tras procesar el pedido |

**Total estimado al cliente: 5–6 días hábiles.** Este dato ya puede usarse en la ficha de
producto y en el checkout para el mensaje de entrega estimada.

---

## 2. Lo que falta

| Dato | Estado | Impacto |
|---|---|---|
| **Tarifa de envío** | ❓ | Sin ella no hay checkout |
| **Umbral de envío gratis** | ❓ | La barra de progreso lo necesita |
| **Países servidos** | ❓ | USPS sugiere solo EE. UU. |
| **¿Se envía a Puerto Rico / territorios?** | ❓ | USPS sí llega; el precio cambia |
| **¿Se envía a República Dominicana?** | ❓ | Marca dominicana, pregunta probable |
| **¿Envío internacional?** | ❓ | Aranceles y aduanas |
| **Recogida local** | ❓ | Requiere dirección física |
| **Entrega local** | ❓ | — |
| **Peso de cada producto** | ❓ | `grams: 0` en los 8 |
| **Dimensiones de la caja** | ❓ | USPS cobra por peso volumétrico |
| **Seguro / valor declarado** | ❓ | — |
| **Responsabilidad por extravío** | ❓ | No consta en la política |
| **Días de envío** | ❓ | ¿Se envía todos los días hábiles? |
| **Festivos y vacaciones** | ❓ | — |

---

## 3. Alcance del MVP

Deliberadamente sencillo. Cubre la operación real sin sobreingeniería:

| Función | MVP | Fase 2 |
|---|---|---|
| Tarifa plana configurable | ✅ | — |
| Envío gratis desde un importe | ✅ | — |
| Tarifa por país/estado | ✅ | — |
| Recogida local | ✅ opcional | — |
| Tracking manual | ✅ | — |
| Tarifas por peso | ❌ | ✅ |
| Tarifas en tiempo real de USPS | ❌ | ✅ |
| Etiquetas automáticas | ❌ | ✅ |
| Seguimiento automático | ❌ | ✅ |
| Multi-almacén | ❌ | ✅ |

**La tarifa plana no requiere los pesos**, así que el MVP no queda bloqueado por C7. Aun
así conviene pesar los productos ya, para la fase 2.

---

## 4. Configuración desde el panel

Tabla `shipping_rates`, editable en `/admin/settings` sin tocar código:

| Campo | Ejemplo | Editable |
|---|---|---|
| Nombre | "USPS Priority Mail" | ✅ |
| País | `US` | ✅ |
| Estado | `null` = todo el país | ✅ |
| Tarifa | ❓ pendiente | ✅ |
| Envío gratis desde | ❓ pendiente | ✅ |
| Días mín. | 5 | ✅ |
| Días máx. | 6 | ✅ |
| Recogida local | falso | ✅ |
| Estado | activo | ✅ |

**Los países no configurados se bloquean en el checkout.** El selector de país solo
ofrece los que tienen tarifa activa: es imposible que entre un pedido a un destino al que
no se envía.

---

## 5. Interfaz preparada

```ts
export interface ShippingProvider {
  getRates(address: CheckoutAddress, items: CheckoutItem[]): Promise<ShippingRate[]>;
  createShipment(orderId: string): Promise<ShipmentResult>;
  getTracking(trackingNumber: string): Promise<TrackingResult>;
}
```

MVP: `FlatRateShippingProvider`, que lee de `shipping_rates`.
Fase 2: `UspsShippingProvider` con tarifas reales. **No cambia nada más.**

---

## 6. Umbral de envío gratis

La dirección comercial pide una barra de progreso hacia el envío gratuito. Es uno de los
mecanismos de aumento de ticket más eficaces, pero **necesita un umbral real**.

Contexto de precios: los productos van de $30 a $50; el kit, $120.

- [ ] ¿Cuál es el umbral? (una referencia habitual es ~1,5 × el ticket medio)
- [ ] ¿Se aplica a todos los países o solo a EE. UU.?
- [ ] ¿Se excluyen los kits?

**Si no hay envío gratis, la barra de progreso no se muestra.** No se inventará un umbral.

---

## 7. Tracking

MVP: **registro manual**. La administradora introduce transportista y número desde
`/admin/orders/[id]`.

| Elemento | Implementación |
|---|---|
| Transportista | Campo libre, con USPS por defecto |
| Número de seguimiento | Texto |
| URL de seguimiento | Se genera para transportistas conocidos |
| Correo automático | Al guardar el número → correo "Pedido enviado" |
| Consulta del cliente | `/track-order` + `/account/orders/[n]` |

**Sustituye a Track123**, la app externa del sitio actual, que además exponía el dominio
`gaviotabylia.myshopify.com` en el menú principal.

- [ ] ¿Se usa solo USPS o también otros transportistas?

---

## 8. Devoluciones

Depende de `LEGAL_TODO.md` L4.

- [ ] ¿Se aceptan devoluciones? (la política actual dice "todas las ventas son finales")
- [ ] ¿Quién paga el envío de retorno?
- [ ] ¿Se facilita etiqueta de retorno?
- [ ] Dirección de devolución
- [ ] ¿Producto abierto o usado?

---

## 9. Texto de la política

La política actual es aprovechable pero incompleta. Debe añadirse:

- [ ] Tarifas y umbral de envío gratis
- [ ] Países servidos, explícitamente
- [ ] Qué ocurre si un paquete se extravía
- [ ] Qué ocurre si llega dañado
- [ ] Qué ocurre con una dirección incorrecta
- [ ] Retrasos en temporada alta
- [ ] Aduanas y aranceles, si hay envío internacional

Se edita desde `/admin/content` → `legal.shipping`, sin desplegar.

---

## 10. Cálculo en el checkout

```
1. El cliente introduce el país
2. Se buscan tarifas activas para ese país (y estado si aplica)
3. Sin tarifas → se bloquea: "No enviamos a este destino todavía"
4. Con tarifas → se muestran las opciones
5. Si el subtotal ≥ free_above → envío = 0 y se indica "Envío gratis"
6. El total se recalcula EN SERVIDOR
```

**El coste de envío nunca se acepta del navegador.** Se recalcula en el servidor al crear
el pedido, igual que todos los demás importes, y la restricción `totals_add_up` de la base
de datos verifica que el total cuadre.

---

## 11. Checklist

- [ ] Tarifa de envío definida
- [ ] Umbral de envío gratis definido (o descartado)
- [ ] Países servidos confirmados
- [ ] ¿Recogida local? Si sí, dirección y horario
- [ ] Política de envíos completa y publicada
- [ ] Tarifas cargadas en el panel
- [ ] Pedido de prueba con envío calculado
- [ ] Pedido de prueba superando el umbral → envío gratis
- [ ] Correo de "pedido enviado" con tracking verificado
- [ ] `/track-order` funcionando con un número real
- [ ] Destino no servido correctamente bloqueado
