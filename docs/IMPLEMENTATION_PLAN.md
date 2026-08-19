# IMPLEMENTATION_PLAN.md — Plan de implementación

Plan por etapas para el MVP comercialmente funcional y seguro.

**Estado actual:** Fases 1 y 2 completadas (auditoría y planificación).
**Siguiente:** Fase 3, **tras aprobación**.

---

## 1. Definición del MVP

### Dentro del alcance

| # | Capacidad | Módulos |
|---|---|---|
| 1 | Mostrar la marca profesionalmente | Home, historia, fundadora, rutina, ingredientes |
| 2 | Publicar productos | Catálogo, categorías, ficha, búsqueda |
| 3 | Administrar precios e inventario | Panel de productos e inventario |
| 4 | Recibir compras | Carrito, checkout de invitado, cuenta |
| 5 | Confirmar pagos | `PaymentProvider`, webhook idempotente |
| 6 | Procesar pedidos | Panel de pedidos, estados, historial |
| 7 | Agregar seguimiento | Envíos, tracking manual |
| 8 | Notificar al cliente | Resend, 9 plantillas |
| 9 | Consultar ventas | Dashboard, informes básicos |
| 10 | Editar contenido sin código | `content_sections`, FAQ, ajustes |

### Fuera del alcance (fase 2)

Puntos, suscripciones, apps móviles, multi-almacén, marketplace, contabilidad avanzada,
IA, recomendaciones complejas, reembolsos automáticos, múltiples pasarelas simultáneas,
automatización de carritos abandonados, multimoneda, multi-idioma.

La arquitectura queda preparada (interfaces desacopladas, esquema extensible) pero **nada
de esto se implementa**.

### Decisiones de alcance derivadas de la auditoría

| Decisión | Motivo |
|---|---|
| **Sunscreen no se publica** | Sin documentación regulatoria (`LEGAL_TODO.md`) |
| **Testimonios y UGC no se muestran** | Cero reseñas, cero material autorizado |
| **Feed de Instagram: rejilla estática** | El embebido perjudica el LCP |
| **`/journal` sin enlace en el menú** | El blog actual está vacío; se activa con ≥3 artículos |
| **Selector de necesidad: 5 opciones, no 8** | Solo hay 5 necesidades con producto real detrás |
| **Reseñas: se construye, arranca vacío** | Necesario para que existan testimonios algún día |

---

## 2. Fases

### FASE 1 — Auditoría ✅ Completada
`AUDIT.md` · `CONTENT_INVENTORY.md` · `PRODUCT_INVENTORY.md` · `MIGRATION_RISKS.md`

### FASE 2 — Planificación ✅ Completada
`SITEMAP.md` · `ARCHITECTURE.md` · `DATABASE_SCHEMA.md` · `DESIGN_DIRECTION.md` ·
`IMAGE_USAGE.md` · `IMPLEMENTATION_PLAN.md` · los cuatro `*_TODO.md`

**🔒 Punto de aprobación 1 — se requiere ahora.** Ver §6.

---

### FASE 3 — Configuración · Complejidad ▓▓░░░ media-baja

| # | Tarea | Entregable |
|---|---|---|
| 3.1 | Proyecto Next.js 16 + React 19 + TypeScript `strict` | `tsconfig.json` sin `any` implícito |
| 3.2 | Tailwind 4 con los tokens de `DESIGN_DIRECTION.md` | `globals.css` con `@theme` |
| 3.3 | `next/font`: Cormorant Garamond + Manrope | Subconjunto `latin-ext` |
| 3.4 | ESLint, Prettier, Vitest, Playwright | `npm run typecheck/lint/test/test:e2e` |
| 3.5 | Proyecto Supabase de desarrollo | — |
| 3.6 | **Migraciones 0001–0017** | `supabase/migrations/` |
| 3.7 | **Políticas RLS + pruebas** | `0015_rls_policies.sql` + `rls.test.ts` |
| 3.8 | Seeds de desarrollo | 7 productos, contenido marcado como provisional |
| 3.9 | Supabase Auth + los 3 clientes | `server-only` en `admin.ts` |
| 3.10 | Storage con políticas | Buckets `products`, `content` |
| 3.11 | Procesado de imágenes | 17 originales → derivados |
| 3.12 | `.env.example`, CSP, cabeceras | — |

**Criterio de salida:** `npm run build` limpio · pruebas de RLS en verde · seeds cargados.

**Riesgo:** las pruebas de RLS suelen subestimarse. Son la garantía de que un cliente no
lee pedidos ajenos. **No se avanza a la fase 4 sin ellas en verde.**

---

### FASE 4 — Storefront · Complejidad ▓▓▓▓░ alta

| # | Tarea | Notas |
|---|---|---|
| 4.1 | Sistema de UI base | Botón, input, badge, skeleton, modal accesible |
| 4.2 | Layout, header, footer | Header transparente → sólido; menú móvil con foco atrapado |
| 4.3 | Barra promocional editable | `home.announcement` |
| 4.4 | **Home: 19 secciones** | 12 con datos reales; 2 ocultas; 5 con datos parciales |
| 4.5 | Catálogo `/shop` con filtros | Filtros en la URL, indexables |
| 4.6 | Categorías | — |
| 4.7 | **Ficha de producto** | Ruta de mayor conversión: galería, variantes, sticky móvil |
| 4.8 | Búsqueda | Índice GIN en español |
| 4.9 | Carrito y drawer | Anónimo + autenticado, fusión al iniciar sesión |
| 4.10 | Páginas de marca | Historia, fundadora, rutina, ingredientes, FAQ, contacto |
| 4.11 | Páginas legales | Desde `content_sections` |
| 4.12 | SEO y datos estructurados | 7 tipos de schema; hoy hay 0 |
| 4.13 | 21 redirecciones 301 | Prueba E2E que las verifica |
| 4.14 | 404, error, loading, vacíos | — |

**Criterio de salida:** Lighthouse >90 en home y ficha · sin `#` en ningún enlace · sin
lorem ipsum · navegación completa por teclado.

**Riesgo:** el home de 19 secciones es la tarea más grande del proyecto. Se construye
sección a sección, cada una con su clave de contenido, no como una página monolítica.

---

### FASE 5 — Comercio · Complejidad ▓▓▓▓▓ muy alta

**La fase crítica. Aquí se maneja dinero.**

| # | Tarea | Notas |
|---|---|---|
| 5.1 | Núcleo de precios (`lib/commerce`) | Centavos, tipo marcado, sin float |
| 5.2 | Cupones | Validación en servidor, límites, vigencia |
| 5.3 | Cálculo de totales | Restricción `totals_add_up` en BD |
| 5.4 | **Reserva de inventario** | `FOR UPDATE`, prueba de concurrencia |
| 5.5 | Checkout de invitado | Un solo paso en móvil |
| 5.6 | Creación de pedido | `pending_payment` + número en servidor |
| 5.7 | `MockPaymentProvider` | Éxito, fallo y webhook simulados |
| 5.8 | **Webhook idempotente** | Firma + `unique(provider, event_id)` |
| 5.9 | Confirmación de pago | `paid` + reserva → salida definitiva |
| 5.10 | Cron de liberación | `CRON_SECRET` |
| 5.11 | Envíos configurables | Tarifa plana + envío gratis + recogida |
| 5.12 | Resend + 9 plantillas | Dominio verificado |
| 5.13 | `/order-confirmation/[token]` | Token público seguro |
| 5.14 | `/track-order` | Número + correo. Sustituye a Track123 |
| 5.15 | Cuenta del cliente | 7 rutas |
| 5.16 | Progreso a envío gratis | Umbral real |

**Criterio de salida:** compra completa de principio a fin con mock · webhook duplicado sin
efecto · dos compras concurrentes de la última unidad → una falla limpiamente · correos
entregados.

**Riesgos:**
- **Idempotencia del webhook.** Un fallo aquí descuenta stock dos veces. Prueba
  específica que reenvía el mismo evento cinco veces.
- **Concurrencia.** Prueba con dos transacciones simultáneas.
- **Entregabilidad del correo.** Bloqueada por el DNS del dominio (`R14`). Iniciar pronto.

---

### FASE 6 — Administración · Complejidad ▓▓▓▓░ alta

| # | Tarea |
|---|---|
| 6.1 | Layout con guardas de servidor + `requireAdmin()` en cada acción |
| 6.2 | Dashboard: ventas, pedidos, ticket medio, bajo inventario |
| 6.3 | Productos: CRUD, variantes, imágenes con reordenación, SEO, duplicar, archivar |
| 6.4 | Categorías |
| 6.5 | Pedidos: listado, detalle, estados, tracking, notas, imprimir |
| 6.6 | Inventario: stock, ajustes con motivo, movimientos, CSV |
| 6.7 | Clientes |
| 6.8 | Cupones |
| 6.9 | **Contenido**: las 19 secciones, FAQ, políticas |
| 6.10 | Configuración: negocio, envíos, redes, SEO |
| 6.11 | Informes básicos |
| 6.12 | Auditoría |
| 6.13 | `ADMIN_GUIDE.md` con capturas |

**Criterio de salida:** la propietaria completa las diez capacidades del MVP sin ayuda
técnica ni tocar código.

**Riesgo (`R16`).** El editor de contenido **no debe aceptar HTML pegado**: entrada en
texto plano o editor controlado que sanitiza. Es la causa directa del incidente del
Exfoliante. Esta decisión es funcional, no cosmética.

---

### FASE 7 — QA · Complejidad ▓▓▓░░ media

| # | Tarea |
|---|---|
| 7.1 | `typecheck`, `lint`, `test`, `test:e2e`, `build` en verde |
| 7.2 | **E2E de 16 pasos** con Playwright |
| 7.3 | Unitarias: precios, cupones, totales, inventario, estados, moneda, número, webhook |
| 7.4 | RLS ampliadas |
| 7.5 | **Prueba de contenido**: sin `[INSERT`, `lorem`, `myshopify`, `seedgrow`, Unicode matemático ni claims prohibidos |
| 7.6 | Accesibilidad: axe + teclado + lector de pantalla |
| 7.7 | Dispositivos: 360/390/430/768/1024/1280/1536 |
| 7.8 | Lighthouse: >90 / >95 / >95 / >95 |
| 7.9 | Consola sin errores; enlaces sin `#` |
| 7.10 | Revisión de seguridad: `service_role` ausente del bundle, CSP, rate limits |

**Criterio de salida:** `CHECKLIST_LAUNCH.md` completo.

La prueba 7.5 es específica de este proyecto: **impide repetir mecánicamente los errores
del sitio actual**.

---

### FASE 8 — Lanzamiento · Complejidad ▓▓░░░ media-baja

| # | Tarea |
|---|---|
| 8.1 | Supabase de producción + migraciones + RLS + Storage |
| 8.2 | Vercel + variables de entorno |
| 8.3 | Resend con dominio verificado (SPF/DKIM/DMARC) |
| 8.4 | **Pasarela real + webhook** |
| 8.5 | Contenido real cargado |
| 8.6 | **Inventario real contado** |
| 8.7 | Exportar clientes y pedidos de Shopify **antes de cancelar** |
| 8.8 | Redirecciones verificadas |
| 8.9 | GA4 + Search Console |
| 8.10 | **Compra controlada real** con tarjeta propia |
| 8.11 | Probar cancelación y reembolso |
| 8.12 | Verificar correos en Gmail, Outlook, iCloud |
| 8.13 | DNS con TTL 300 s |
| 8.14 | Backups configurados |
| 8.15 | Plan de reversión; Shopify activo 30 días |

**Criterio de salida:** compra real completada, cobrada, notificada y procesada.

---

## 3. Complejidad por módulo

| Módulo | Complejidad | Riesgo | Comentario |
|---|---|---|---|
| Pagos y webhooks | ▓▓▓▓▓ | 🔴 | Idempotencia y firma. Se maneja dinero |
| Inventario y reservas | ▓▓▓▓▓ | 🔴 | Concurrencia y transacciones |
| Checkout | ▓▓▓▓▓ | 🔴 | Recálculo íntegro en servidor |
| Home (19 secciones) | ▓▓▓▓▓ | 🟡 | Volumen, no dificultad técnica |
| Ficha de producto | ▓▓▓▓░ | 🟡 | Ruta de mayor conversión |
| Panel de pedidos | ▓▓▓▓░ | 🟡 | Máquina de estados + historial |
| Panel de productos | ▓▓▓▓░ | 🟡 | Formularios complejos, imágenes |
| RLS | ▓▓▓▓░ | 🔴 | Difícil de probar, crítico |
| Carrito | ▓▓▓░░ | 🟡 | Fusión anónimo → autenticado |
| Contenido editable | ▓▓▓░░ | 🟢 | 19 claves |
| Correos | ▓▓▓░░ | 🟡 | Entregabilidad, no código |
| Catálogo y búsqueda | ▓▓▓░░ | 🟢 | — |
| Cupones | ▓▓░░░ | 🟡 | Validación en servidor |
| Cuenta del cliente | ▓▓░░░ | 🟢 | — |
| Envíos | ▓▓░░░ | 🟢 | Tarifa plana en el MVP |
| Páginas de marca | ▓▓░░░ | 🟢 | Contenido, no lógica |
| Dashboard e informes | ▓▓░░░ | 🟢 | Consultas agregadas |
| Auditoría | ▓░░░░ | 🟢 | Triggers |
| SEO | ▓▓░░░ | 🟢 | Metadata API |

---

## 4. Orden de implementación

El orden **no es negociable** en sus dependencias:

```
Fase 3  Base de datos + RLS
   └─> Fase 4  Storefront ──┐
   └─> Fase 5  Comercio ────┤   (5 puede empezar con 4.1–4.9 hechas)
                            └─> Fase 6  Administración
                                   └─> Fase 7  QA
                                          └─> Fase 8  Lanzamiento
```

**Por qué este orden.** La base de datos y las RLS van primero porque todo lo demás
depende de su forma; rehacerlas después obliga a tocar cada consulta. El storefront va
antes que el comercio porque el carrito necesita catálogo. La administración va después
del comercio porque gestiona pedidos que deben poder existir. El QA no es una fase final
decorativa: es donde se verifica que el dinero se comporta bien.

### Trabajo que puede avanzar en paralelo

| Vía | Depende de |
|---|---|
| Procesado de imágenes (3.11) | Nada. **Puede empezar ya** |
| Redacción de contenido y claims | Decisiones de la propietaria |
| Alta en la pasarela de pago | `LEGAL_TODO.md` |
| DNS para Resend | Nada. **Puede empezar ya** |
| Conteo de inventario | Nada. **Puede empezar ya** |
| Redacción de políticas | Nombre legal y jurisdicción |

**Las cuatro tareas marcadas "puede empezar ya" no dependen de ninguna aprobación** y
están en la ruta crítica del lanzamiento. Conviene arrancarlas de inmediato.

---

## 5. Prueba E2E de referencia

Los 16 pasos exigidos, con `MockPaymentProvider`:

```
 1. Abrir el home                    9. Completar información
 2. Navegar al catálogo             10. Pagar con el proveedor mock
 3. Buscar un producto              11. Confirmar el pedido
 4. Abrir el producto               12. Consultar el pedido
 5. Seleccionar variante            13. Iniciar sesión como administrador
 6. Agregar al carrito              14. Procesar el pedido
 7. Modificar cantidad              15. Agregar tracking
 8. Iniciar checkout                16. Consultar el tracking como cliente
```

Se ejecuta en escritorio y en móvil (390 px). Es el criterio objetivo de "el MVP funciona".

---

## 6. 🔒 Punto de aprobación 1

**No se escribe código hasta cerrar estos puntos.**

### Diseño (`DESIGN_DIRECTION.md` §17)
1. ¿Se acepta la síntesis **Editorial Caribeño Comercial**?
2. ¿Se aceptan los **fondos ciruela oscuro**?
3. ¿**Cormorant Garamond + Manrope**?
4. Titular del hero: ¿*"Tu piel. Tu ritual. Tu momento."*?
5. ¿**Foto 19of19** para el hero?

### Alcance
6. ¿Se acepta **no publicar el Sunscreen** en el MVP?
7. ¿Se acepta **ocultar testimonios y UGC** hasta tener datos reales?
8. ¿Se mantiene el **Tónico Para Barba**, sin fotografía disponible?
9. ¿El **Aceite Masculino** es producto aparte o variante del mismo?
10. ¿Se publican la **Crema Anti-Estrías** y el **producto labial**, hoy fuera de la web?

### Comercial
11. **Estructura de precios**: ¿el precio real es el alto o el bajo? (`R5`)
12. ¿Se ajusta el precio del **kit**? El ahorro actual es del 7,7 %

### Negocio
13. Nombre legal y país de registro (`R18`)
14. ¿Se vende solo en EE. UU. o también en RD?
15. Tarifa de envío y umbral de envío gratis
16. Proveedor de pago preferido

Los puntos 6–16 no bloquean el inicio de la fase 3: la base de datos y las RLS son
independientes de ellos. **Sí bloquean el lanzamiento**, por lo que conviene resolverlos
mientras avanza el desarrollo.

---

## 7. Definición de "terminado"

Un módulo está terminado cuando:

- [ ] Tipa sin errores en modo estricto
- [ ] Pasa lint
- [ ] Tiene pruebas unitarias si contiene lógica de negocio
- [ ] Funciona con teclado
- [ ] Funciona a 360 px
- [ ] Tiene estados de carga, vacío y error
- [ ] No tiene enlaces `#` ni botones inertes
- [ ] No tiene contenido inventado ni lorem ipsum
- [ ] Valida y autoriza en servidor
- [ ] Registra en auditoría si es administrativo
- [ ] Respeta `prefers-reduced-motion`
- [ ] No emite errores en consola

---

## 8. Lo que este plan no hará

- No publicar un producto sin respaldo regulatorio
- No mostrar reseñas, valoraciones ni "más vendido" sin datos reales
- No inventar ingredientes, certificaciones, testimonios ni tarifas
- No confirmar un pago desde una redirección del navegador
- No confiar en precios, roles ni totales del navegador
- No exponer `SUPABASE_SERVICE_ROLE_KEY`
- No permitir inventario negativo
- No implementar funciones de fase 2 antes del MVP
- No sacrificar seguridad ni experiencia móvil por velocidad de entrega
- No dar por terminado nada con pruebas en rojo
