---
name: image-quality-web
description: Fidelidad fotográfica de extremo a extremo — pipeline sharp, derivados, next/image, art direction y presupuesto de resolución retina. Úsala cuando se hable de nitidez, compresión, artefactos, banding, píxeles, recortes o del script de imágenes. Se activa con "las imágenes se ven mal", "por qué perdió calidad", "se ve borroso", "regenera las imágenes", "art direction", "srcset", "quality de next/image", "hero pixelado", "los packshots se ven blandos". NO cubre peso de página ni LCP como métrica (usa performance-core-web-vitals), ni encuadre artístico (premium-beauty-design).
---

# Calidad de imagen — Gaviota by Lia

## Objetivo

Que la fotografía llegue al navegador con la máxima fidelidad perceptible al
menor coste razonable. En esta marca el producto **es** la piel fotografiada:
la micro-textura no es un detalle técnico, es la propuesta de valor.

## Arquitectura real del proyecto

```
originales/                        ← 4400-5900 px de ancho, 324 MB, FUERA de public/ y de git
  └─ scripts/crops.mjs             ← puntos focales + recortes de packshot en px del original
  └─ scripts/process-images.mjs    ← sharp: genera derivados + image-manifest.json
public/images/gaviota/
  ├─ hero/      hero-desktop|tablet|mobile.jpg
  ├─ editorial/ campaign, ritual-*, story-fundadora, coleccion-completa
  ├─ products/  packshots recortados de GA9.jpg
  ├─ community/ comunidad-*.jpg
  ├─ founder/   fundadora-*.jpg
  └─ image-manifest.json           ← dimensiones reales, para pasar width/height y evitar CLS
next.config.ts → images.{formats, deviceSizes, imageSizes, qualities}
```

Comando: `node scripts/process-images.mjs` (no hay script npm; se ejecuta a mano).

## Reglas del pipeline

1. **El intermedio no se sirve.** Los JPEG de `public/` los vuelve a codificar
   Next a AVIF/WebP. Son artefacto de build: cualquier bit que se les quite se
   pierde para siempre en una segunda generación con pérdida.
   → `quality: 95`, `chromaSubsampling: '4:4:4'`, `mozjpeg`, `progressive`.
2. **Croma 4:4:4 obligatorio.** La paleta es magenta saturado sobre piel y sobre
   ciclorama rosa. 4:2:0 reduce a la mitad la resolución de color justo en esos
   bordes. Es el peor caso posible para esta marca.
3. **Nunca ampliar.** `withoutEnlargement: true` en todo `resize`. Si el recorte
   es más pequeño que el objetivo, el objetivo está mal, no la foto.
   Ojo: si el objetivo es menor que la fuente, `withoutEnlargement` convierte el
   resize en una operación nula y el archivo sale al tamaño del recorte.
4. **Ancho objetivo = tamaño en pantalla × DPR.** No números redondos.
5. **Sin sharpening.** Ni `sharpen()` en sharp ni `filter` en CSS.

## Reglas de `next/image`

- `quality={90}` en hero, editoriales grandes y packshots. `75` (por defecto) en
  decorativas. Todo valor debe estar declarado en `images.qualities` de
  `next.config.ts`: **Next 16 devuelve HTTP 400 ante un `q` no declarado.**
- `priority` **solo** en la imagen del primer viewport. Una por página.
- `sizes` siempre que se use `fill` o anchos fluidos. Sin `sizes` correcto, el
  navegador pide el ancho equivocado.
- `width`/`height` reales desde `image-manifest.json` para reservar el hueco.
- Art direction → `getImageProps()` + `<picture>` + `<source media=...>`.
  **Nunca** dos `<Image>` con `lg:hidden` / `hidden lg:block`: ocultar con CSS
  no evita la descarga; el navegador baja los dos archivos.
- `object-fit: cover` + `object-position` explícito por breakpoint. Nunca
  `transform: scale` para arreglar un encuadre.
- Prohibido: `blur` permanente, `filter`, `backdrop-filter` sobre fotografía,
  capturas de pantalla como recurso de producción.

## Procedimiento de auditoría

### 1. Inventario
```bash
cat public/images/gaviota/image-manifest.json
```

### 2. Medir lo que se sirve de verdad
`naturalWidth` en Chromium viene corregido por densidad y **engaña**. Decodifica
los bytes reales:

```js
// desde la raíz del proyecto, para que resuelva `sharp`
const r = await fetch(`http://127.0.0.1:3000/_next/image?url=${encodeURIComponent(p)}&w=${w}&q=${q}`,
  { headers: { accept: 'image/avif' } });
const buf = Buffer.from(await r.arrayBuffer());
const m = await sharp(buf).metadata();      // ancho/alto reales
const bpp = (buf.length * 8) / (m.width * m.height);
```

### 3. Presupuesto de resolución
Para cada imagen: `ancho CSS medido × DPR` vs `ancho real servido`.
Marca ⚠ si el servido es < 95 % del necesario. Prueba a DPR 1 **y** 2.

### 4. Bit rate
Referencias para AVIF fotográfico:

| bpp | lectura |
|-----|---------|
| < 0.20 | manchas en pelo/piel, banding en degradados |
| 0.25-0.35 | aceptable en secundarias |
| 0.40-0.60 | visualmente transparente — objetivo del hero |

Cuidado: `quality: 75` en el optimizador de Next **no** equivale a 75 en sharp;
Next es bastante más agresivo con el mismo número nominal.

### 5. Métrica de pérdida
Compara fuente y servido a igual resolución con energía de detalle
(desviación típica del laplaciano) y PSNR. Reporta "% de detalle retenido".

## Checklist

- [ ] Un solo archivo de hero descargado por viewport (verificado en red).
- [ ] `priority` en exactamente una imagen.
- [ ] Todas las imágenes bajo el pliegue son `loading="lazy"` (por defecto).
- [ ] `sizes` presente y correcto en toda imagen fluida.
- [ ] `width`/`height` o `fill` + contenedor con aspecto → CLS 0.
- [ ] Ningún derivado ampliado respecto a su fuente.
- [ ] Croma 4:4:4 en todos los intermedios.
- [ ] Ninguna imagen deformada: relación de aspecto conservada.
- [ ] `quality` usado está en `images.qualities`.
- [ ] Sin `filter`, `blur` permanente ni `scale` correctivo.

## Errores que debe evitar

- Fiarse de `naturalWidth` o del inspector en vez de decodificar los bytes.
- Subir `quality` sobre un intermedio ya degradado: se desperdicia la mitad.
- Poner `quality={100}`: engorda mucho sin mejora perceptible.
- Ampliar un packshot pequeño para "que se vea grande".
- Aplicar sharpening para disimular desenfoque de origen.
- Confundir desenfoque óptico (de la toma) con artefacto de compresión:
  compáralo contra la fuente antes de acusar al pipeline.
- Diagnosticar sobre capturas de pantalla con lazy-load a medio cargar.

## Validaciones obligatorias

1. `node scripts/process-images.mjs` termina sin avisos inesperados.
2. Red en DevTools: un solo hero, formato AVIF, tamaño esperado.
3. Presupuesto de resolución a DPR 1 y 2 en 390 / 768 / 1440.
4. CLS = 0 en la home.
5. Recorte 1:1 del rostro comparado contra la fuente, a ojo.

## Límite conocido y no negociable

Los **packshots** se recortan de `GA9.jpg` (4431×5539), donde cada envase ocupa
entre 520 y 1180 px y **queda fuera del plano de foco**. Esa blandura está en el
original, no en la compresión. Ningún ajuste de calidad, croma o resolución la
arregla: hace falta reshoot por producto. Repórtalo, no lo disimules.

## Formato del informe

```markdown
## Veredicto
Una frase.

## Presupuesto de resolución
| imagen | mostrado CSS | necesita @DPR2 | servido | veredicto |

## Bit rate
| imagen | bytes | bpp | detalle retenido |

## Cadena de pérdida
original → intermedio → servido, con el % perdido en cada paso.

## Acciones
1. <fix> — <ganancia medida> — <coste en KB>

## Límites del material
Lo que no se arregla con código.
```
