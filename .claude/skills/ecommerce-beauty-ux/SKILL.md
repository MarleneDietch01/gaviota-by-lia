---
name: ecommerce-beauty-ux
description: Patrones de comercio para belleza — tarjetas de producto, quick add, bolsa, favoritos, señales de confianza, ficha de producto y honestidad comercial. Úsala cuando el trabajo toque conversión, catálogo o flujo de compra. Se activa con "rediseña las tarjetas de producto", "añade quick add", "el carrito", "mejora la conversión", "señales de confianza", "badges de bestseller", "reseñas", "precios y descuentos", "página de producto". NO cubre estética general (premium-beauty-design) ni textos de marca (brand-copy-es-en).
---

# UX de comercio — Gaviota by Lia

## Objetivo

Que comprar sea fácil y que la marca sea creíble. En belleza la confianza se
gana con honestidad y con fotografía, no con badges de urgencia.

## Estado real del negocio — léelo antes de diseñar

Fuente: `src/lib/catalog/products.ts`, `docs/PRODUCT_INVENTORY.md`,
`docs/CONTENT_TODO.md`, `docs/LEGAL_TODO.md`.

| Dato | Estado |
|------|--------|
| Productos publicables | **6** (los 6 destacados) |
| Reseñas | **0** enviadas, pero el sistema de envío/moderación ya existe y está en producción |
| `compareAtPrice` | No existe con vigencia real |
| Histórico de ventas | No existe |
| Stock en tiempo real | No existe |
| Ingredientes completos | Pendientes |
| Checkout / pasarela | **Activo** — Stripe y PayPal en vivo, firma de webhook verificada en ambos |
| Envíos | **Publicado** — `/shipping-policy` con contenido real (2 días de proceso, USPS Priority Mail, 3–4 días de tránsito) |
| Productos capilares | Tónico de barba (cuidado, no crecimiento — ver regla 4) |

Excluidos a propósito: `sunscreen` (medicamento OTC en EE. UU. sin
documentación), crema anti-estrías y labial (no confirmados para venta). El
tónico de barba dejó de estar excluido (2026-08-24): se vende, con el copy
reescrito en lenguaje cosmético — ver regla 4 más abajo.

## Reglas de honestidad — no negociables

1. **Sin estrellas inventadas.** `reviewCount === 0` ⇒ no se pinta ni estrella
   vacía ni "Sin reseñas aún". La tarjeta se compone sin ese espacio y lo
   incorpora cuando `reviewCount > 0`.
2. **Sin precio tachado.** Los 8 productos del sitio Shopify anterior llevaban
   años con descuento permanente sin vigencia. Replicarlo es publicidad
   engañosa. Solo se muestra con precio anterior real y fechas, calculado en
   servidor.
3. **Sin badges de venta o escasez** ("Bestseller", "Pocas unidades") mientras no
   haya histórico ni stock. Si el brief pide badges, usa placeholder marcado.
4. **Sin afirmaciones médicas.** Estos son cosméticos. Nada de "elimina",
   "cura", "reduce un X %", "clínicamente probado".
5. **Nombrar el cuidado, no el defecto.** "Apariencia de estrías", no "problema
   de estrías". La marca celebra cuerpos reales.

## Anatomía de la tarjeta de producto

Obligatorio, en este orden:
1. Fotografía con relación de aspecto **idéntica** en todas las tarjetas.
2. Nombre.
3. Beneficio principal (una línea, recortada a 2 con `line-clamp`).
4. Tamaño (`sizeLabel`).
5. Precio con cifras tabulares.
6. Acción: *quick add* o enlace a ficha.

Requisitos estructurales:
- **Alturas alineadas.** Los precios de todas las tarjetas de una fila deben
  compartir línea base aunque las descripciones ocupen 1 o 2 líneas. Se logra
  con `flex flex-col` + `mt-auto` en el bloque de precio, no con altura fija.
- **El producto con presencia.** Nada de un frasco diminuto flotando en una caja
  enorme. Si el packshot tiene fondo propio, el tile debe integrarlo, no
  enmarcarlo dentro de otro rectángulo de color distinto.
- **Afordancias también en foco y en táctil.** Un icono que solo aparece con
  `group-hover` no existe para teclado ni para dedo: añade `group-focus-within`.
- **Segunda foto al hover solo si existe.** Hoy hay una por producto.

## Quick add

- Debe ser un `<button>` real con nombre accesible que incluya el producto:
  `aria-label="Añadir Exfoliante de Coco al ritual"`.
- Confirmación por `aria-live="polite"`, no solo un cambio de color.
- Persistencia en `src/lib/commerce/bag.ts` (localStorage) hasta que exista la
  Server Action de carrito. El precio **no** se guarda en cliente: se recalcula
  siempre en servidor.
- El contador del header se sincroniza por evento (`BAG_EVENT`) y se lee tras
  montar, para no romper la hidratación.
- Si no puede añadir de verdad, no lo llames "Añadir": enlaza a la ficha.

## Señales de confianza

Visibles **en todos los anchos**, no `hidden lg:block`. El tráfico móvil es el
que más las necesita.

Solo afirmaciones verificables hoy:
- Hecho en República Dominicana
- Envíos con seguimiento
- Pago seguro
- Formulado para piel real

Nada de "envío gratis", "devolución en 30 días" ni certificaciones hasta que
`docs/SHIPPING_TODO.md` y `docs/LEGAL_TODO.md` estén cerrados.

## Checklist

- [ ] Ninguna tarjeta muestra estrellas, precio tachado ni badge sin dato.
- [ ] Precios alineados en toda la fila.
- [ ] Relación de aspecto de imagen idéntica en todas las tarjetas.
- [ ] Quick add con nombre accesible por producto y feedback `aria-live`.
- [ ] Favoritos como `aria-pressed` toggle, no un corazón mudo.
- [ ] Contador de bolsa sin desajuste de hidratación.
- [ ] Precio formateado con `formatMoney` y locale correcto.
- [ ] Señales de confianza visibles en móvil.
- [ ] Rejilla: 4 en escritorio, 2-3 en tablet, carrusel o 2 columnas en móvil.
- [ ] Carrusel móvil con `snap` y accesible por teclado.

## Errores que debe evitar

- Un botón "Añadir al carrito" que no añade nada.
- Guardar precios en localStorage.
- Contadores que provocan mismatch de hidratación (leer localStorage en el
  primer render).
- Rellenar la rejilla con productos no publicables para que cuadre a 4.
- Inventar tallas, ingredientes o modos de uso.
- Usar el color como única señal de "favorito activo".
- Ocultar el precio tras un hover.

## Validaciones obligatorias

1. `npm run typecheck` y `npm run test` (incluye `tests/unit/money.test.ts`).
2. Verificar alineación de precios midiendo `getBoundingClientRect().top` de
   todos los precios de una fila: deben coincidir.
3. Recorrer la tarjeta solo con teclado: enlace, favorito y quick add
   alcanzables y anunciados.
4. Comprobar que un `reviewCount = 0` no renderiza nada de reseñas.
5. Añadir a la bolsa, recargar y confirmar que el contador persiste.

## Formato del informe

```markdown
## Cambios de comercio
- <componente> — <qué cambia> — <por qué convierte mejor>

## Honestidad
| Elemento | ¿Dato real? | Decisión |

## Accesibilidad de los controles
Quick add / favoritos / carrusel.

## Pendiente de dato real
Qué se activará solo cuando exista el dato, y dónde está el interruptor.
```
