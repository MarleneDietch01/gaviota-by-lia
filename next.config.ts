import type { NextConfig } from 'next';

/**
 * Content-Security-Policy.
 *
 * -----------------------------------------------------------------------------
 * SIN NONCES, A PROPÓSITO
 * -----------------------------------------------------------------------------
 * El método con nonce (recomendado por Next para la CSP más estricta) exige
 * que TODAS las páginas se rendericen dinámicamente en cada petición: el sitio
 * pierde el pre-renderizado estático que ya está optimizado a fondo para
 * rendimiento (ver `docs/STORE_IMPLEMENTATION_STATUS.md`). Es un trade-off que
 * no compensa hoy: no hay contenido generado por usuarios ni
 * `dangerouslySetInnerHTML` en ningún componente (verificado en la auditoría
 * de seguridad), así que el riesgo real de inyección de script inline es bajo.
 *
 * `unsafe-inline` en `script-src`/`style-src` es la consecuencia de esa
 * decisión: sin nonce, es la única forma de que los scripts inline que Next
 * inyecta (el payload de RSC en streaming, `__NEXT_DATA__`) sigan
 * ejecutándose. La CSP igual aporta: restringe a un listado explícito de
 * dominios de dónde puede cargarse CUALQUIER script/imagen/conexión externa —
 * bloquea la inyección de un dominio no autorizado, que es el vector más
 * común en la práctica (script de un CDN comprometido, tracker no aprobado).
 *
 * Dominios permitidos, y por qué cada uno:
 *   · js.stripe.com / api.stripe.com  -> Stripe Checkout es una redirección de
 *     página completa (`window.location.href`), no un iframe embebido, así
 *     que hoy no se carga Stripe.js en el DOM — se permite igual porque Fase 4
 *     (Payment/Card Element embebido) sí lo necesitaría sin tener que volver
 *     a tocar esta lista.
 *   · www.paypal.com / www.paypalobjects.com / *.paypal.com -> el SDK de
 *     PayPal Buttons SÍ se inyecta en el DOM (`paypal-button.tsx`) y abre sus
 *     propios iframes/popups para el widget de pago.
 *   · *.supabase.co en `connect-src` -> `reset-password-form.tsx` usa el
 *     cliente de Supabase del NAVEGADOR (`createBrowserSupabaseClient()`),
 *     así que esa llamada sale directo del cliente a la API de Supabase Auth,
 *     no pasa por el servidor. Sin este dominio, restablecer la contraseña se
 *     rompería en silencio (la petición fallaría por CSP, no por un error de
 *     Supabase) — se detectó probando la propia CSP, no antes.
 * -----------------------------------------------------------------------------
 */
const isDev = process.env.NODE_ENV === 'development';

const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.paypal.com https://www.paypalobjects.com${isDev ? " 'unsafe-eval'" : ''}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' blob: data: https://www.paypalobjects.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://api.stripe.com https://*.paypal.com https://*.paypalobjects.com https://*.supabase.co`,
  `frame-src 'self' https://js.stripe.com https://*.paypal.com`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `upgrade-insecure-requests`,
];

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives.join('; ') },
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
  // Was pointing at '/products/kit-rutina-completa', a slug that never
  // existed in the catalog — confirmed 404 in production. The kit isn't sold
  // as its own product page; '/sets' is the real destination for kit/routine
  // shoppers.
  ['/products/kit-anti-estrias-y-aclaracion', '/sets'],
  // Discontinued — removed from the catalog entirely (owner decision).
  ['/products/sunscreen', '/shop'],
  ['/apps/track123', '/track-order'],
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
    return [
      ...legacyRedirects.map(([source, destination]) => ({
        source: source as string,
        destination: destination as string,
        permanent: true,
      })),
      // Catch-alls for any old Shopify collection/page handle not covered
      // above. Must come after the specific redirects: Next.js resolves
      // `redirects()` in array order and stops at the first match, so a
      // catch-all listed first would swallow every specific one below it.
      { source: '/collections/:slug', destination: '/shop', permanent: true },
      { source: '/pages/:slug', destination: '/', permanent: true },
    ];
  },
};

export default nextConfig;
