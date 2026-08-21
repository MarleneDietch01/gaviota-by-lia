# CONTENT_TODO.md — Contenido pendiente

Contenido que debe aportar o confirmar la propietaria. **Nada de esto se inventará.**

**Prioridad:** 🔴 bloquea el lanzamiento · 🟠 alta · 🟡 media · 🟢 mejora

---

## 🔴 C1 — Ingredientes de cada producto

**Ningún producto publica sus ingredientes hoy.** En cosmética es información esperada, y
en varias jurisdicciones exigible.

**Los envases sí los llevan impresos.** La vía más rápida es fotografiar la parte trasera
de cada etiqueta y transcribirla.

| Producto | Estado |
|---|---|
| Aceite Anti-Estrías | ❓ |
| Aceite Anti-Estrías Masculino | ❓ |
| Crema Hidratante | ❓ |
| Exfoliante de Coco | ❓ |
| Sérum Vellos Encarnados | ❓ |
| Tónico Para Barba | ❓ |
| Kit | ❓ (los de sus tres componentes) |

**Necesario:** lista INCI completa en orden decreciente, alérgenos declarables y, si se
mantiene el mensaje "ingredientes de la flora dominicana", **cuáles lo son realmente**.

---

## 🔴 C2 — Precauciones y advertencias

Los envases tienen un bloque **"PRECAUCIONES"** que nunca se trasladó a la web.

- [ ] Transcribir el texto de precaución de cada envase
- [ ] Advertencia de prueba de parche
- [ ] Uso en embarazo (la descripción actual del Aceite lo menciona sin advertencia)
- [ ] Contacto con los ojos
- [ ] Conservación
- [ ] Caducidad / PAO (meses tras apertura)

---

## 🔴 C3 — Modo de uso

Solo dos productos lo tienen hoy.

| Producto | Estado actual |
|---|---|
| Exfoliante de Coco | ✅ Completo, con frecuencia |
| Sérum Vellos Encarnados | ✅ Básico |
| Aceite Anti-Estrías | ❌ |
| Aceite Masculino | ❌ |
| Crema Hidratante | ❌ |
| Tónico Para Barba | ❌ |

Para cada uno: cantidad, zona, frecuencia, momento del día y orden respecto a los demás.

**El orden es doblemente necesario:** la sección "Ritual en 3 pasos" del home lo requiere
(C9).

---

## 🔴 C4 — Estructura de precios

Los 8 productos tienen precio anterior activo **de forma permanente**. No es una promoción:
es el estado por defecto desde hace más de dos años.

| Producto | Precio | "Antes" |
|---|---|---|
| Aceite Anti-Estrías | $50 | $60 |
| Aceite Masculino | $50 | $60 |
| Crema Hidratante | $40 | $50 |
| Exfoliante de Coco | $40 | $50 |
| Sérum Vellos Encarnados | $40 | $50 |
| Tónico Para Barba | $40 | $50 |
| Sunscreen | $30 | $40 |
| Kit | $120 | $130 |

**Decisión requerida (elegir una):**
- [ ] **A.** El precio real es el bajo → se eliminan los precios anteriores y la sección "Ofertas"
- [ ] **B.** El precio real es el alto y esto es una promoción → **con fecha de fin**
- [ ] **C.** Se reestructuran los precios

La base de datos **impide** guardar un precio anterior sin fechas de vigencia
(`compare_at_needs_dates`). La opción A es la más honesta y la más simple.

---

## 🔴 C5 — Precio del kit

| Concepto | Importe |
|---|---|
| Aceite ($50) + Exfoliante ($40) + Crema ($40) | $130 |
| Precio del kit | $120 |
| **Ahorro real** | **$10 · 7,7 %** |

Un ahorro del 7,7 % no incentiva la compra agrupada, y la dirección comercial pide mostrar
"ahorro real" calculado en servidor. Con estos números, mostrarlo perjudica.

- [ ] ¿Se baja el precio del kit para lograr un ahorro significativo (15–20 %)?
- [ ] ¿Se confirma la composición del kit?
- [ ] ¿Se renombra para eliminar "Aclaración"? (ver `LEGAL_TODO.md` L8)

---

## 🔴 C6 — Inventario real

`grams: 0` y sin cantidades en los 8 productos.

- [ ] Conteo físico de cada producto
- [ ] Umbral de bajo inventario por producto
- [ ] ¿Se controla stock o se vende sin control? (`track_inventory`)

Sin esto, el sistema arranca vacío o con cifras inventadas. **No se inventarán cifras.**

---

## 🔴 C7 — Peso de envío

Necesario para calcular envío por peso en la fase 2. En el MVP se usa tarifa plana, pero
conviene recogerlo ya.

- [ ] Pesar cada producto **empaquetado**, listo para enviar
- [ ] Peso del kit completo
- [ ] Dimensiones de la caja

---

## 🟠 C8 — Preguntas frecuentes

**No existe FAQ**, pese a que el menú tiene dos enlaces llamados "Preguntas" que llevan a
otras páginas.

Aportar entre 8 y 12 preguntas **reales** de clientas. Temas probables:

- [ ] ¿Cuánto tarda el envío?
- [ ] ¿Envían fuera de EE. UU.?
- [ ] ¿Puedo devolver un producto?
- [ ] ¿Los productos son aptos en el embarazo?
- [ ] ¿Sirven para todos los tonos de piel?
- [ ] ¿Cómo sé qué producto necesito?
- [ ] ¿En qué orden se aplican?
- [ ] ¿Cuánto dura un envase?
- [ ] ¿Son cruelty-free? ⚠️ **Solo si es verificable**
- [ ] ¿Son veganos? ⚠️ **Solo si es verificable**
- [ ] ¿Dónde se fabrican? ⚠️ **Dato no publicado hoy**

Las tres últimas no se responderán sin confirmación explícita.

---

## 🟠 C9 — El ritual en tres pasos

La sección 8 del home ("Tu ritual empieza aquí") necesita el orden real recomendado.

Propuesta a validar, **no confirmada**:

| Paso | Acción | Producto |
|---|---|---|
| 1 | Exfolia | Exfoliante de Coco |
| 2 | Hidrata | Crema Hidratante |
| 3 | Nutre | Aceite Anti-Estrías |

- [ ] ¿Es correcto este orden?
- [ ] ¿Frecuencia de cada paso?
- [ ] ¿Qué producto recomienda en cada uno?

---

## 🟠 C10 — Historia de la marca: ¿quién es Lia?

**La marca se llama Gaviota by _Lia_. La fundadora publicada es _Marlene Dietsch_.**
El sitio nunca explica quién es Lia.

Es lo primero que se pregunta cualquier visitante y ahora mismo no tiene respuesta en
ninguna parte.

- [ ] ¿Quién es Lia?
- [ ] ¿Por qué "Gaviota"?
- [ ] ¿En qué año nació la marca?
- [ ] ¿Cómo empezó?

Si Lia es una hija, una madre o un apodo, esa es con toda probabilidad la mejor primera
línea de `/our-story` — y hoy no está escrita.

---

## 🟠 C11 — Afirmaciones de "Quiénes somos"

Publicadas hoy sin respaldo:

| Frase | ¿Es verdad? |
|---|---|
| "ingredientes cuidadosamente seleccionados **de la flora dominicana**" | ❓ |
| "Utilizamos **prácticas sostenibles** en la elaboración" | ❓ |
| "nos comprometemos a **preservar la belleza natural** de la RD" | ❓ |
| "ofrecer **resultados reales**" / "auténtica y **efectiva**" | ❓ |

- [ ] ¿Los ingredientes proceden realmente de RD?
- [ ] ¿Qué prácticas sostenibles concretas?
- [ ] ¿Dónde se fabrican los productos?

**Si no son verificables, se sustituyen.** El posicionamiento dominicano se sostiene sin
ellas: la fundadora es dominicana y la inspiración es dominicana. Eso ya es verdad y basta.

---

## 🟠 C12 — Biografía de la fundadora

El texto actual es genérico: "trayectoria inspiradora en la industria del cuidado
personal", "conocimiento experto", sin un solo dato concreto.

- [ ] ¿Cuántos años de trayectoria?
- [ ] ¿Formación?
- [ ] ¿Qué la llevó a crear la marca?
- [ ] ¿Vive en EE. UU. o en RD?
- [ ] ¿Autoriza que se publique su nombre completo? (ya está publicado)

---

## 🟠 C13 — Datos de contacto

| Dato | Valor actual | Pendiente |
|---|---|---|
| Correo | `gaviotabylia@gmail.com` | ¿Se migra a `hola@gaviotabylia.com`? |
| Teléfono | `401-305-8713` | ¿Sigue vigente? ¿Es WhatsApp? |
| Dirección | "Estados Unidos" | Ya se conoce (5 Rangeley Avenue, Providence, RI 02908 — `LEGAL_TODO.md` L1), pero falta decidir si se publica esa dirección tal cual en el sitio o se usa otra |
| Horario | — | ❓ |
| Instagram | `@gaviotabylia` | ✅ |
| Otras redes | — | ¿TikTok? ¿Facebook? |

**Nota técnica:** el correo transaccional necesita dominio propio verificado en Resend. Sin
él, las confirmaciones de pedido irán a spam (`MIGRATION_RISKS.md` R14).

---

## 🟠 C14 — Productos fuera de la web

Dos productos aparecen fotografiados y etiquetados en `GA9.jpg` pero **no se venden
online**:

| Producto | Evidencia |
|---|---|
| **Crema Anti-Estrías** | Tarro 8 oz / 236 mL, junto a la Crema Hidratante |
| **Producto labial** (tarro dorado) | En `GA9.jpg` y aplicado en la foto 16 |

- [ ] ¿Se venden? ¿Se descatalogaron? ¿Se lanzan con la web nueva?

**Relevancia comercial:** la dirección pide "Cuidado labial" como opción del selector
"¿Qué quieres cuidar hoy?". Sin ese producto publicado, la opción debe eliminarse.

---

## 🟠 C15 — Tónico Para Barba

El producto peor documentado del catálogo. Su descripción íntegra son 92 caracteres:

> Rellena los vacios / Estimula, y acelera el crecimiento. / combate la caida

Sin acentos, sin mayúsculas iniciales, sin ingredientes, sin modo de uso. Y los tres claims
son de crecimiento capilar, es decir, de medicamento (`LEGAL_TODO.md` L8).

Además **no aparece en ninguna de las 17 fotografías**: todo el material disponible es
femenino.

- [ ] ¿Se mantiene en el catálogo?
- [ ] Si sí: contenido completo + fotografía propia
- [ ] Si no: se archiva

---

## 🟠 C16 — ¿Aceite Masculino: producto o variante?

Su descripción es **copia literal** de la versión femenina, incluida la frase *"Úsalo
durante y después del embarazo"*.

El envase real sí se diferencia: **acento azul** frente al rosa.

- [ ] ¿Son fórmulas distintas o el mismo producto con otra etiqueta?
- [ ] Si es lo segundo → un producto con dos variantes de presentación
- [ ] Si es lo primero → descripción propia, dirigida a su público

---

## 🟡 C17 — Textos de campaña del home

Editables desde el panel. Propuestas iniciales a validar:

| Sección | Propuesta |
|---|---|
| Barra promocional | ❓ Depende del umbral de envío gratis |
| Hero (eyebrow) | "Cuidado corporal inspirado en la belleza dominicana" |
| Hero (título) | "Tu piel. Tu *ritual*. Tu momento." |
| Hero (texto) | "Cuidado corporal creado para hidratar, suavizar y hacer de cada aplicación un momento para ti." |
| Más vendidos | "Los que todas quieren en su rutina." |
| Selector | "¿Qué quieres cuidar hoy?" |
| Campaña | "Suavidad que se convierte en ritual." |
| Ritual | "Tu ritual empieza aquí." |
| Comunidad | "Así se vive Gaviota." |

- [ ] ¿Se aprueban? ¿Se ajusta el tono?

---

## 🟡 C18 — Fotografía 12of19 no listada

`LeslieEstevezPhotography-(12of19).jpg` está en el directorio pero **no figuraba en la
lista suministrada**. Es una buena imagen: modelo rodeada de manos que le ofrecen
productos.

- [ ] ¿Se puede usar, o su exclusión fue deliberada?

---

## 🟢 C19 — Reseñas y testimonios

**El sitio actual no tiene ni una sola reseña.** Las secciones 13 (Testimonios) y 14 (UGC)
del home quedarán ocultas en el lanzamiento.

- [ ] ¿Hay clientas dispuestas a dejar una reseña?
- [ ] ¿Hay fotografías de clientas con autorización por escrito?
- [ ] ¿Se activará el sistema de reseñas tras la compra?

No se publicará ningún testimonio inventado ni marcado como "demostración" en producción.

---

## 🟢 C20 — Journal

El blog existe (`/blogs/news`) y **está vacío**: cero artículos.

- [ ] ¿Se quiere publicar contenido?
- [ ] Si no, no se enlaza desde el menú hasta que haya al menos tres artículos

---

## Resumen

| Prioridad | Asuntos |
|---|---|
| 🔴 Bloquea lanzamiento | C1 ingredientes · C2 precauciones · C3 modo de uso · C4 precios · C5 kit · C6 inventario · C7 pesos |
| 🟠 Alta | C8 FAQ · C9 ritual · C10 quién es Lia · C11 afirmaciones · C12 fundadora · C13 contacto · C14 productos fuera de la web · C15 tónico · C16 aceite masculino |
| 🟡 Media | C17 textos · C18 foto 12 |
| 🟢 Mejora | C19 reseñas · C20 journal |

**Las siete tareas 🔴 son de recopilación, no de redacción.** Casi todas se resuelven
fotografiando las etiquetas traseras de los envases, contando el stock y pesando los
productos. Es trabajo de una tarde, y está en la ruta crítica del lanzamiento: conviene
empezarlo ya, en paralelo al desarrollo.
