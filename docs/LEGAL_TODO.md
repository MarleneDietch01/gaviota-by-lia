# LEGAL_TODO.md — Decisiones legales pendientes

Ninguno de estos datos se inventará. Todos requieren respuesta de la propietaria o de su
asesoría legal.

**Prioridad:** 🔴 bloquea el lanzamiento · 🟠 alta · 🟡 media

---

## ✅ L1 — Nombre legal y jurisdicción — RESUELTO (2026-08-21)

Confirmado con el EIN emitido por el IRS (CP 575 G, notificado 20-02-2025) y las
Articles of Organization presentadas ante el Secretary of State de Rhode Island
(Filing Number 202565164450, 19-02-2025).

| Dato | Valor |
|---|---|
| Nombre legal completo | Gaviota By Lia LLC |
| Forma jurídica | LLC (elige tributar como corporación — Article III) |
| País y estado de registro | Estados Unidos, Rhode Island |
| EIN | 33-3534338 |
| Dirección del agente registrado / oficina principal | 5 Rangeley Avenue, Providence, RI 02908 |
| Miembro único / agente registrado | Marlene I Dietsch |
| Duración | Perpetua |

**Pendiente, ahora que la identidad está resuelta:** ¿se publica esta dirección
completa como dirección de contacto/legal en el sitio (footer, política de
privacidad, términos), o se usa una dirección comercial/apartado distinta? Es la
dirección del agente registrado en la presentación estatal — puede ser una
dirección particular de la propietaria, así que la decisión de publicarla tal
cual en un sitio público le corresponde a ella, no se asume aquí.

---

## 🔴 L2 — Protector solar: documentación regulatoria

El riesgo más alto del proyecto.

En EE. UU. un protector solar **no es cosmético: es un medicamento OTC** regulado por la
FDA.

| Requisito | Estado |
|---|---|
| Valor de SPF | El envase muestra "50"; **la web no lo declara** |
| Amplio espectro (UVA + UVB) | ❓ |
| Ingredientes activos con porcentaje | ❓ |
| Panel *Drug Facts* | ❓ |
| Número NDC | ❓ |
| Fabricante registrado en la FDA | ❓ |
| Pruebas de SPF (informe de laboratorio) | ❓ |
| Resistencia al agua | ❓ |

**Frases publicadas hoy sin respaldo:** *"Diseñado para proteger de los rayos UVA/UVB"*,
*"Ayuda a minimizar el fotoenvejecimiento"*.

**Recomendación:** no publicar el producto en el MVP. Queda creado en estado `draft` y se
activa cuando exista documentación. Si esta no puede obtenerse del fabricante, la opción
correcta es retirarlo definitivamente de la venta.

**Decisión requerida:**
- [ ] Obtener la documentación y publicarlo con panel de medicamento
- [ ] Mantenerlo en `draft` indefinidamente
- [ ] Retirarlo del catálogo

---

## 🔴 L3 — Política de privacidad

La actual es la plantilla por defecto de Shopify **sin completar**, publicada con:

```
Last updated: [Date]
[TOLL FREE TELEPHONE NUMBER IF YOU HAVE A PHYSICAL RETAIL LOCATION]
[EEA] [and] [the UK]
[INSERT REPRESENTATIVE DETAILS]
```

Y bloques **"NOTE TO MERCHANT"** — instrucciones internas de Shopify visibles al público.
Además declara `49177a-4.myshopify.com` como sitio web, no el dominio real.

**Se redacta de cero.** Datos necesarios:

- [ ] Nombre legal y dirección (L1)
- [ ] Responsable del tratamiento y correo de contacto
- [ ] Categorías de datos recogidos
- [ ] Base legal del tratamiento
- [ ] Plazos de conservación
- [ ] Encargados: Supabase, Vercel, Resend, la pasarela, la analítica
- [ ] Transferencias internacionales
- [ ] Derechos y cómo ejercerlos
- [ ] ¿Se venden datos con fines publicitarios? (la actual dice que sí)
- [ ] ¿Aplica RGPD? Depende de si se vende a la UE
- [ ] ¿Aplica CCPA/CPRA? Depende de si se vende a California

---

## 🔴 L4 — Política de reembolso

Publicada hoy con marcadores literales visibles:

```
[dirección de correo electrónico]
[número de teléfono]
```

**Contenido problemático.** Dice *"Todas las ventas se consideran finales"*, con excepción
de producto defectuoso reportado en 14 días con fotos.

Dos conflictos reales:

1. **Prevalecen las reglas del medio de pago.** PayPal y las marcas de tarjeta aplican sus
   propias políticas de protección al comprador en una disputa, con independencia de lo que
   diga la tienda. Una política de "todas las ventas finales" no evita un contracargo; solo
   hace que la marca lo pierda con peor imagen.
2. **Venta a distancia.** Varias jurisdicciones reconocen derecho de desistimiento en
   compras en línea.

**Decisiones:**
- [ ] ¿Se mantiene "todas las ventas finales" o se admite devolución? (recomendado:
      admitir, con excepción razonada por higiene en productos abiertos)
- [ ] Plazo de devolución
- [ ] ¿Quién paga el envío de retorno?
- [ ] ¿Producto abierto o usado?
- [ ] Plazo de reembolso tras recibir la devolución
- [ ] Correo y teléfono reales (sustituyen los marcadores)

---

## 🔴 L5 — Términos y condiciones

Plantilla de Shopify sin personalizar.

- [ ] Nombre legal y jurisdicción (L1)
- [ ] Ley aplicable y tribunales competentes
- [ ] Condiciones de venta y formación del contrato
- [ ] Precios e impuestos
- [ ] Limitación de responsabilidad
- [ ] Uso del sitio y cuentas
- [ ] Propiedad intelectual

---

## 🔴 L6 — Autorizaciones de imagen de las modelos

Aparecen personas identificables en **nueve fotografías**: 7, 9, 11, 12, 15, 16, 17, 18 y
19of19.

- [ ] ¿Existe autorización de imagen firmada por cada modelo?
- [ ] ¿El alcance cubre web, redes y publicidad de pago?
- [ ] ¿Tiene límite temporal?
- [ ] ¿Alguna modelo ha revocado su autorización?

**Es un riesgo distinto del de derechos de autor de la fotografía** (L7): la fotógrafa
puede haber cedido los derechos de la imagen sin que exista autorización de las personas
retratadas.

**Estas fotografías son el centro de la dirección visual.** Si alguna no puede usarse, el
diseño debe reasignarse antes de programar, no después.

---

## 🟠 L7 — Derechos sobre las fotografías

Autoría deducida del nombre de los archivos: **Leslie Estévez Photography**.

- [ ] ¿Se adquirieron los derechos o hay licencia de uso?
- [ ] Alcance: ¿web, redes, publicidad de pago, impresión?
- [ ] ¿Duración?
- [ ] ¿Exige crédito visible?
- [ ] ¿Exclusividad?

Si se requiere crédito, se añade en el pie de `/our-story` y `/founder`.

---

## 🔴 L8 — Claims de producto

Seis de ocho productos publican claims que describen un medicamento, no un cosmético.

| Frase publicada | Producto |
|---|---|
| "libre de estrías" / "prevenir la formación de estrías" | Aceite Anti-Estrías |
| "trabajando en las capas más internas de la piel" | Aceite Anti-Estrías |
| "Estimula, y acelera el crecimiento" / "combate la caida" | Tónico Para Barba |
| "eliminando granitos y vellos encarnados" | Sérum |
| "Protección contra Radicales Libres" / "actúa como un escudo" | Crema Hidratante |
| "ACLARANTE" · "RETRASA EL ENVEJECIMIENTO" | Crema Hidratante (**envase**) |
| "Aclaración" | Kit (**nombre comercial**) |

**Agravante:** *"ACLARANTE"* y *"RETRASA EL ENVEJECIMIENTO"* están **impresos en el envase
físico**. La web puede matizar, pero el envase seguirá circulando.

**Decisiones:**
- [ ] ¿Hay estudios o documentación que respalde algún claim?
- [ ] ¿Se aprueba reescribir todo con lenguaje de apariencia?
- [ ] ¿Se renombra el Kit para eliminar "Aclaración"?
- [ ] ¿Se prevé rediseñar el envase de la Crema Hidratante?
- [ ] ¿Se acepta el descargo cosmético en todas las fichas?

**Nota constructiva:** los claims impresos en el envase del **Aceite** (*reafirmante,
hidratante, aporta brillo*) son cosméticos y están **mejor redactados que la web**. Sirven
de modelo para el resto.

---

## 🔴 L13 — Claims de antes/después en los flyers de campaña

La sección "Resultados reales" del home usaba dos imágenes de flyer (`campana-flyer-mujer.jpg`,
`campana-flyer-hombre.jpg`) con fotos de antes/después incrustadas en el propio píxel. Se
reconstruyó la sección con maquetación real (bullets como texto, en `home-data.ts`), pero
el contenido de antes/después que llevaban esos flyers **no se republicó** — queda fuera
hasta que exista aprobación explícita.

| Contenido bloqueado | Motivo |
|---|---|
| Fotos de antes/después de estrías | Claim de resultado sobre la piel — no verificado |
| "Underarm Brightener" | Claim de aclarado de piel — mismo problema que L8 (Crema Hidratante) |
| "Beard growth" / crecimiento de barba | Mismo claim ya bloqueado en L8 (Tónico Para Barba) |
| Código QR | No apunta a ningún destino confirmado en el sitio actual |
| ~~WhatsApp +1 401 305 8713~~ | ✅ Verificado (2026-08-22) — confirmado en la tienda Shopify real (`/pages/contact`), agregado a `route-pages.ts` (`contact`) como canal real |
| @gaviotabylia dentro de la imagen | Redundante con el link real del footer, pero congelado en un píxel no editable |
| www.gaviotabylia.com | Confirmado como el dominio final (tienda Shopify actual). Pendiente migrar el DNS a este proyecto — ver siguiente punto |

**Decisiones:**
- [x] ¿Hay autorización de las clientas en las fotos de antes/después para publicarlas? — sin
      resolver, siguen bloqueadas
- [ ] ¿Hay estudio o respaldo para "Underarm Brightener" y el crecimiento de barba? (ver L8)
- [ ] ¿A dónde debe apuntar el QR? ¿Existe ya ese destino?
- [x] ¿El WhatsApp +1 401 305 8713 es un canal real de la marca? — **Sí**, confirmado
- [ ] Migrar `gaviotabylia.com` (hoy en Shopify) al DNS de este proyecto en Vercel y actualizar
      `NEXT_PUBLIC_SITE_URL` antes de publicarlo en cualquier parte del sitio.

Los archivos de imagen originales (`campana-flyer-*.jpg`) siguen en `public/images/gaviota/editorial/`
por si se necesita extraer algo puntual, pero ya no están enlazados desde ningún componente.

---

## 🟠 L9 — Política de cookies y consentimiento

No existe hoy. Se planifican GA4, Meta Pixel, Clarity y TikTok Pixel.

- [ ] ¿Qué herramientas se usarán realmente?
- [ ] ¿Banner de consentimiento con rechazo o solo informativo?
- [ ] ¿Se bloquean los scripts hasta aceptar? (recomendado: sí)

**Antecedente a corregir:** el sitio actual enlaza como "privacy policy" a
`https://seedgrow.net/privacy-policy/`, la política de una empresa de software ajena. No se
migra.

---

## 🟠 L10 — Impuestos

- [ ] ¿Se cobra impuesto sobre las ventas?
- [ ] ¿En qué estados hay nexo fiscal?
- [ ] ¿Los precios publicados incluyen impuesto?
- [ ] ¿Se vende fuera de EE. UU.? Aranceles y aduanas

El esquema contempla `tax_total` en `orders`. **En el MVP se fija a 0 salvo instrucción
contraria**, y en tal caso se declarará explícitamente en el checkout.

---

## 🟡 L11 — Correo y comunicaciones

- [ ] ¿Se cuenta con consentimiento de los suscriptores actuales de la newsletter?
- [ ] Dirección física en el pie de los correos comerciales (exigida por CAN-SPAM)
- [ ] Enlace de baja funcional (implementado con token)

---

## 🟡 L12 — Accesibilidad

WCAG 2.2 AA es el objetivo técnico del proyecto y reduce además el riesgo de reclamación
por accesibilidad, frecuente en comercio electrónico en EE. UU.

- [ ] ¿Se desea publicar una declaración de accesibilidad?

---

## Resumen

| # | Asunto | Prioridad | Bloquea lanzamiento |
|---|---|---|---|
| L1 | Nombre legal y jurisdicción | ✅ Resuelto | — |
| L2 | Documentación del protector solar | 🔴 | **Sí** |
| L3 | Política de privacidad | 🔴 | **Sí** |
| L4 | Política de reembolso | 🔴 | **Sí** |
| L5 | Términos y condiciones | 🔴 | **Sí** |
| L6 | Autorizaciones de imagen | 🔴 | **Sí** |
| L8 | Claims de producto | 🔴 | **Sí** |
| L13 | Claims de antes/después en flyers de campaña | 🔴 | **Sí** |
| L7 | Derechos fotográficos | 🟠 | Recomendado |
| L9 | Cookies y consentimiento | 🟠 | Sí, si hay analítica |
| L10 | Impuestos | 🟠 | Recomendado |
| L11 | Correo comercial | 🟡 | No |
| L12 | Accesibilidad | 🟡 | No |

**Recomendación general.** L1, L3, L4 y L5 conviene encargarlos a un profesional legal en
la jurisdicción correspondiente. El coste es modesto comparado con publicar una política
de privacidad que dice "NOTE TO MERCHANT", que es la situación actual.
