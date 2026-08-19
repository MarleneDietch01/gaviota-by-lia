import type { NextConfig } from 'next';

/**
 * Cabeceras de seguridad.
 *
 * La CSP se irá ajustando en la Fase 7 cuando se conozcan los dominios reales
 * de la pasarela de pago y de la analítica. `unsafe-inline` en `style-src` es
 * necesario para los estilos en línea de next/image.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/**
 * Redirecciones desde el sitio Shopify anterior.
 * Ver docs/CONTENT_INVENTORY.md §8.
 */
const legacyRedirects = [
  ['/pages/quienes-somos', '/our-story'],
  ['/pages/conoce-nuestra-fundadora', '/founder'],
  ['/pages/contact', '/contact'],
  ['/collections/all', '/shop'],
  ['/collections/productos', '/shop'],
  ['/collections/frontpage', '/shop'],
  ['/collections/kits', '/sets'],
  ['/kits', '/sets'],
  ['/routine', '/rituals'],
  ['/account/favorites', '/wishlist'],
  ['/policies/shipping-policy', '/shipping-policy'],
  ['/policies/refund-policy', '/refund-policy'],
  ['/policies/privacy-policy', '/privacy-policy'],
  ['/policies/terms-of-service', '/terms'],
  ['/policies/contact-information', '/contact'],
  ['/blogs/news', '/journal'],
  // El handle original de la Crema Hidratante era, literalmente, "new".
  ['/products/new', '/products/crema-hidratante'],
  ['/products/aceite-masculino-anti-estrias', '/products/aceite-anti-estrias-masculino'],
  ['/products/kit-anti-estrias-y-aclaracion', '/products/kit-rutina-completa'],
  // El título original usaba caracteres Unicode matemáticos, que dejaban una
  // URL percent-encoded ilegible e incompartible.
  [
    '/products/%F0%9D%90%88%F0%9D%90%8D%F0%9D%90%86%F0%9D%90%91%F0%9D%90%8E%F0%9D%90%96%F0%9D%90%8D-%F0%9D%90%87%F0%9D%90%80%F0%9D%90%88%F0%9D%90%91-%F0%9D%90%92%F0%9D%90%84%F0%9D%90%91%F0%9D%90%94%F0%9D%90%8C',
    '/products/serum-vellos-encarnados',
  ],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'],
    // Ajustados a los puntos de ruptura reales del diseño (360/390/430/768/
    // 1024/1280/1536), no a los valores por defecto.
    deviceSizes: [360, 390, 430, 640, 768, 1024, 1280, 1536, 1920, 2400],
    imageSizes: [64, 96, 128, 200, 256, 384, 600],
    // Next 16 restringe `qualities` a [75] por defecto y devuelve 400 ante
    // cualquier otro valor. Sin declararlas aquí, `quality={90}` es imposible.
    //
    // Por qué 90 y no 75: medido sobre el hero (1400×1750), el optimizador
    // retiene a q=75 solo el 83 % de la micro-textura (0.175 bpp). A q=88-92
    // sube al 93-94 % por ~22 KB más. En una marca cuyo producto ES la piel
    // fotografiada, ese 10 % es la diferencia entre pelo definido y manchas.
    //   75 -> secundarias y decorativas
    //   90 -> hero, editoriales grandes y packshots
    qualities: [75, 90],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },

  async redirects() {
    return legacyRedirects.map(([source, destination]) => ({
      source: source as string,
      destination: destination as string,
      permanent: true,
    }));
  },
};

export default nextConfig;
