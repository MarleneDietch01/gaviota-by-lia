---
name: seo-beauty-ecommerce
description: SEO técnico y de contenido para la tienda bilingüe — metadata de Next 16, hreflang es/en, datos estructurados, canónicas, sitemap y las redirecciones heredadas de Shopify. Úsala cuando el trabajo toque indexación, buscadores o migración de URLs. Se activa con "SEO", "metadata", "hreflang", "sitemap", "datos estructurados", "schema.org", "canonical", "las redirecciones de Shopify", "Open Graph", "no aparece en Google". NO cubre redacción persuasiva (usa brand-copy-es-en) ni rendimiento (performance-core-web-vitals).
---

# SEO — Gaviota by Lia

## Objetivo

Que la migración desde Shopify no pierda posiciones y que la tienda bilingüe se
indexe correctamente en sus dos idiomas.

## Arquitectura relevante

- Rutas bajo `src/app/[lang]/`, con `lang` ∈ `en | es` (`src/lib/i18n.ts`).
- `generateStaticParams()` genera ambos idiomas.
- `generateMetadata()` en `src/app/[lang]/layout.tsx`. **Los `params` son
  asíncronos en Next 16**: hay que hacer `await params`.
- Redirecciones heredadas en `next.config.ts` → `legacyRedirects`, documentadas
  en `docs/CONTENT_INVENTORY.md` §8. Todas `permanent: true` (301).
- Mapa de rutas objetivo en `docs/SITEMAP.md`.

## Reglas

### Metadata
- `metadataBase` desde `NEXT_PUBLIC_SITE_URL`, con fallback a localhost.
- `title.template` = `'%s | Gaviota by Lia'`; `title.default` por idioma.
- `description` distinta por idioma, escrita, no traducida a máquina.
- `alternates.canonical` = `/${lang}` (o la ruta completa localizada).
- `alternates.languages` = `{ 'en-US': '/en', 'es': '/es', 'x-default': '/en' }`.
- `openGraph.locale` = `en_US` | `es_DO`.
- Imagen OG real (1200×630) derivada de la fotografía de marca. Hoy solo hay
  `twitter.card`: falta la imagen. Genérala desde el pipeline, no a mano.

### hreflang
- Recíproco y completo: cada versión enlaza a todas, incluida a sí misma.
- `x-default` apuntando a `/en`.
- El atributo `lang` del `<html>`: `en-US` o `es`. Debe coincidir con el
  contenido real de la página.

### Datos estructurados (JSON-LD)
Solo con datos verificables. Emitir siempre como `<script type="application/ld+json">`.

- `Organization` — nombre, logo, `sameAs` con el Instagram real
  (`https://www.instagram.com/gaviotabylia/`).
- `WebSite` con `SearchAction` si `/search` funciona de verdad.
- `BreadcrumbList` en categorías y fichas.
- `Product` en la ficha: `name`, `image`, `description`, `sku` si existe,
  `offers` con `price`, `priceCurrency: 'USD'`, `availability`.

**Prohibido** hasta que exista el dato real:
- `aggregateRating` / `review` — hay **0 reseñas**. Marcar reseñas falsas es
  motivo de penalización manual de Google.
- `priceValidUntil` con descuento inventado.
- `availability: 'InStock'` si no hay control de stock.

### Contenido
- Un `h1` por página, con la palabra clave real de esa página.
- Jerarquía de encabezados coherente (también es criterio de accesibilidad).
- URLs en español para categorías ya existentes
  (`/categories/cremas-e-hidratacion`): no las cambies, están en las
  redirecciones.
- `alt` descriptivos: cuentan para búsqueda de imágenes.

### Migración
- Toda URL del Shopify anterior debe resolver con 301 a su equivalente.
- Verificar especialmente las rarezas documentadas: el producto cuyo handle era
  literalmente `new`, y la URL con caracteres Unicode matemáticos
  percent-encoded.
- Nunca encadenar redirecciones (301 → 301 → 200).

### Robots y sitemap
- `sitemap.ts` con ambos idiomas y `alternates`.
- `robots.ts` permitiendo todo salvo `/account`, `/cart`, `/api`.
- Rutas de administración y carrito con `noindex`.

## Procedimiento

1. Inventariar rutas reales: `find src/app -name "page.tsx"`.
2. Contrastar contra `docs/SITEMAP.md` y `docs/CONTENT_INVENTORY.md`.
3. Comprobar `generateMetadata` de cada ruta: canónica, hreflang, OG.
4. Renderizar y extraer el `<head>` real (no el código fuente del componente).
5. Validar el JSON-LD emitido con el validador de resultados enriquecidos.
6. Probar cada redirección heredada con `curl -I` y confirmar 301 y destino.

## Checklist

- [ ] `await params` en todo `generateMetadata` / `generateStaticParams`.
- [ ] Canónica correcta y absoluta en las dos versiones.
- [ ] hreflang recíproco + `x-default`.
- [ ] `<html lang>` coincide con el contenido.
- [ ] Título y descripción únicos por página y por idioma.
- [ ] Imagen OG existente y del tamaño correcto.
- [ ] JSON-LD sin `aggregateRating` ni datos inventados.
- [ ] Un solo `h1` por página.
- [ ] Todas las redirecciones heredadas devuelven 301 directo.
- [ ] `sitemap.ts` y `robots.ts` presentes y coherentes.
- [ ] `/cart`, `/account`, `/api` fuera del índice.

## Errores que debe evitar

- Emitir `aggregateRating` "de ejemplo": penalización manual.
- Traducir metadata automáticamente sin revisar.
- Canónicas relativas o apuntando siempre al inglés.
- Olvidar `x-default`.
- Cambiar slugs de categoría ya redirigidos y romper la cadena.
- Poner `noindex` global heredado de un entorno de staging.
- Duplicar contenido sirviendo `/` y `/en` sin canónica.
- Confundir `middleware` con `proxy`: en Next 16 el archivo es `src/proxy.ts`.

## Validaciones obligatorias

1. `npm run build` sin errores de metadata.
2. `curl -s http://localhost:3000/es | grep -E 'canonical|hreflang|og:'`.
3. Cada entrada de `legacyRedirects` probada con `curl -I`.
4. JSON-LD extraído del HTML renderizado y validado.
5. Confirmar que ninguna página de producto emite datos de reseña.

## Formato del informe

```markdown
## Cobertura
| ruta | es | en | canónica | hreflang | JSON-LD |

## Redirecciones heredadas
| origen Shopify | destino | código | ok |

## Datos estructurados
Qué se emite y con qué respaldo real.

## Riesgos de indexación
Lo que puede costar posiciones si se despliega hoy.
```
