/**
 * Definición de recortes sobre las fotografías originales.
 *
 * Todas las fotografías son 4:5 vertical (ver docs/IMAGE_USAGE.md §1), así que
 * cada recorte se declara explícitamente en píxeles del original en lugar de
 * dejarlo a un `object-fit: cover` centrado, que en las fotos de grupo corta
 * cabezas.
 */

export const ORIGINALS = 'originales';
export const OUT_DIR = 'public/images/gaviota';

/**
 * Packshots individuales extraídos de GA9.jpg (4431 × 5539), el bodegón del
 * catálogo completo. Es la única fotografía de producto disponible con las
 * etiquetas legibles; su resolución permite recortar cada envase por encima de
 * los 1200 px de ancho que necesita la ficha.
 */
export const PACKSHOTS = [
  { slug: 'aceite-anti-estrias',           left: 1230, top: 1900, width: 830,  height: 1820 },
  { slug: 'aceite-anti-estrias-masculino', left: 500,  top: 2560, width: 800,  height: 1900 },
  { slug: 'serum-vellos-encarnados',       left: 2120, top: 1000, width: 700,  height: 1580 },
  { slug: 'exfoliante-de-coco',            left: 1980, top: 2510, width: 1130, height: 1210 },
  // El tarro llega hasta x≈2350 en el original; el recorte anterior cortaba en
  // 2260 y le comía el costado derecho. No se puede abrir más por la izquierda:
  // el frasco azul se solapa con él a partir de x≈1300.
  { slug: 'crema-hidratante',              left: 1195, top: 3600, width: 1160, height: 960 },
  // El tarro dorado pequeño ocluye parcialmente esta etiqueta en el original.
  // No hay otra fotografía del producto y no está confirmado para venta.
  { slug: 'crema-anti-estrias',            left: 2360, top: 3520, width: 1180, height: 1100 },
  { slug: 'sunscreen',                     left: 3430, top: 2600, width: 520,  height: 1980 },
];

/* ===========================================================================
   Normalización de packshots
   ---------------------------------------------------------------------------
   Los recortes de arriba son tight boxes alrededor de cada envase, y cada uno
   tiene una relación de aspecto distinta (0.42 en las botellas, 0.97 en los
   tarros). Servidos con `object-contain` sobre un tile de color, eso producía
   tres problemas medidos en la rejilla:

     1. Cada foto se veía como un rectángulo de tono distinto flotando dentro
        del tile: el color muestreado de cada esquina difería entre sí
        (#d49b9e, #d0a8a5, #e1bbbb, #e4abab) porque el ciclorama de GA9 tiene
        degradado, así que ningún color de tile podía casar con todos.
     2. Los envases quedaban a escalas ópticas distintas.
     3. No compartían línea de apoyo: cada producto "flotaba" a su altura.

   La solución es componer cada envase sobre un LIENZO COMÚN 4:5:
     · mismo plato de fondo para todos  -> fondos unificados de verdad
     · altura relativa controlada       -> escala óptica normalizada
     · mismo baseline                   -> todos apoyan en la misma línea

   No se retoca la fotografía del envase ni su etiqueta: solo se reencuadra y
   se funde su propio fondo con el plato común mediante un difuminado de borde.
   =========================================================================== */

/*
 * Lienzo CUADRADO, no 4:5.
 *
 * Con 4:5 la tarjeta salía de 509×246 en escritorio: alta y estrecha, y los
 * tarros —que son anchos y bajos— quedaban ampliados como una macro para
 * llenar un marco vertical. El cuadrado baja la altura de la tarjeta, deja aire
 * lateral a las botellas y permite mostrar los tarros enteros sin agrandarlos.
 */
export const PACKSHOT_CANVAS = { width: 1200, height: 1200 };

/** Fracción de la altura del lienzo donde apoyan TODOS los productos. */
export const PACKSHOT_BASELINE = 0.9;

/** Ancho del difuminado con que el recorte se funde en el plato de fondo. */
export const PACKSHOT_FEATHER = 26;

/**
 * Región de ciclorama limpio de GA9 que sirve de plato de fondo para todos los
 * packshots. Al ser la misma para todos, los fondos quedan unificados.
 */
export const PACKSHOT_PLATE = { left: 140, top: 180, width: 820, height: 820 };

/**
 * Altura del envase como fracción de la altura del lienzo.
 *
 * La escala se iguala ÓPTICAMENTE, no por ancho ni por alto: una botella
 * estrecha y un tarro ancho con la misma altura no se ven del mismo tamaño.
 * El criterio es que la caja envolvente de cada envase ocupe un área parecida.
 *
 *   botella  0.82 × 1200 = 984 alto × ~449 ancho → 442 000 px²
 *   tarro    0.60 × 1200 = 720 alto × ~672 ancho → 484 000 px²
 *
 * Con eso el aire lateral queda en el 31 % por lado en las botellas y el 22 %
 * en los tarros — por encima del 10-14 % mínimo —, el margen inferior es del
 * 10 % y ningún envase toca los bordes.
 */
export const PACKSHOT_SCALE = {
  'aceite-anti-estrias': 0.82,
  'aceite-anti-estrias-masculino': 0.82,
  'serum-vellos-encarnados': 0.82,
  'sunscreen': 0.8,
  'exfoliante-de-coco': 0.6,
  'crema-hidratante': 0.6,
  'crema-anti-estrias': 0.6,
};

/* ===========================================================================
   Packshots de estudio (originales de la tienda Shopify)
   ---------------------------------------------------------------------------
   Los recortes de GA9 salían de UNA foto de grupo con ciclorama rosa en
   degradado: envases solapados, fondos que nunca casaban del todo y un
   rectángulo tenue imposible de eliminar sin difuminar el propio envase.

   El CDN de la tienda actual guarda los packshots de estudio originales sobre
   fondo blanco, entre 1600 y 3000 px y con reflejo. Son de la marca y son
   mejores en todo: envase completo, fondo uniforme y nada solapado. Se usan
   estos y GA9 queda para el bodegón de colección y para la Crema Anti-Estrías,
   que no tiene packshot propio.

   `fit` indica por dónde se iguala la escala ÓPTICA:
     · 'height' en botellas y frascos altos — lo que define su tamaño es el alto.
     · 'width'  en tarros anchos y bajos — igualarlos por alto los dejaba
       diminutos, porque su caja incluye el reflejo.
   =========================================================================== */

export const STUDIO_DIR = 'originales/shopify';

export const STUDIO_PACKSHOTS = [
  { slug: 'aceite-anti-estrias',           file: 'aceite.jpg',      fit: 'height', size: 0.74 },
  { slug: 'aceite-anti-estrias-masculino', file: 'masculino-1.jpg', fit: 'height', size: 0.74 },
  { slug: 'serum-vellos-encarnados',       file: 'serum.jpg',       fit: 'height', size: 0.74 },
  { slug: 'sunscreen',                     file: 'sunscreen.jpg',   fit: 'height', size: 0.70 },
  { slug: 'crema-hidratante',              file: 'crema.jpg',       fit: 'width',  size: 0.56 },
  { slug: 'exfoliante-de-coco',            file: 'exfoliante.jpg',  fit: 'width',  size: 0.56 },
];

/**
 * Fondo de los packshots de estudio.
 *
 * Blanco puro, el mismo del original, para que el recorte no deje ninguna
 * costura. La tarjeta usa `white-warm` (#FFFDFC): dos unidades de diferencia,
 * invisibles. La separación visual la aporta la sección rosa empolvado.
 */
export const STUDIO_BACKGROUND = { r: 255, g: 255, b: 255 };

/**
 * Tónico Para Barba: no existe packshot de estudio, solo fotografías de
 * ambiente en una barbería. Se publica con la mejor de las tres, pero queda
 * fuera de los destacados para no romper la coherencia de la rejilla.
 */
export const LIFESTYLE_PACKSHOTS = [
  { slug: 'tonico-para-barba', file: 'tonico-1.png', focal: { x: 0.5, y: 0.55 } },
];

/**
 * Punto focal por fotografía (0 = izquierda/arriba, 1 = derecha/abajo).
 * Protege rostros y productos en los recortes responsivos.
 */
export const FOCAL = {
  'LeslieEstevezPhotography-(19of19).jpg': { x: 0.5, y: 0.32 },
  'LeslieEstevezPhotography-(7of19).jpg':  { x: 0.45, y: 0.42 },
  'LeslieEstevezPhotography-(15of19).jpg': { x: 0.5, y: 0.55 },
  'LeslieEstevezPhotography-(16of19).jpg': { x: 0.52, y: 0.38 },
  'LeslieEstevezPhotography-(9of19).jpg':  { x: 0.5, y: 0.58 },
  'LeslieEstevezPhotography-(11of19).jpg': { x: 0.5, y: 0.5 },
  'LeslieEstevezPhotography-(17of19).jpg': { x: 0.5, y: 0.42 },
  'LeslieEstevezPhotography-(18of19).jpg': { x: 0.5, y: 0.45 },
  'LeslieEstevezPhotography-(1of19).jpg':  { x: 0.5, y: 0.3 },
  'LeslieEstevezPhotography-(2of19).jpg':  { x: 0.5, y: 0.3 },
  'LeslieEstevezPhotography-(3of19).jpg':  { x: 0.5, y: 0.3 },
  'LeslieEstevezPhotography-(4of19).jpg':  { x: 0.5, y: 0.3 },
  'LeslieEstevezPhotography-(5of19).jpg':  { x: 0.5, y: 0.3 },
  'LeslieEstevezPhotography-(6of19).jpg':  { x: 0.5, y: 0.3 },
  'GA9.jpg':                               { x: 0.5, y: 0.52 },
  'LeslieEstevezPhotographyGA15.jpg':      { x: 0.5, y: 0.5 },
};
