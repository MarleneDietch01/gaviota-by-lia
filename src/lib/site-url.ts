/**
 * Resolves the site's canonical, absolute base URL.
 *
 * Never falls back to `VERCEL_URL`: that variable always holds the current
 * deployment's own host (e.g. a random preview hash), never the custom
 * domain — using it for metadata would tell search engines that every
 * preview deployment is the canonical site.
 *
 * Resolution order:
 *   1. `NEXT_PUBLIC_SITE_URL` — set explicitly in Vercel for Production/Preview.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — a Vercel-provided system variable
 *      holding the project's actual production domain (custom domain if one
 *      is attached, otherwise the `*.vercel.app` URL). Only used if (1) is
 *      missing, so a stale or misconfigured (1) is still surfaced by
 *      `scripts/check-env.mjs` rather than silently masked here.
 *   3. `http://localhost:3000` — local development only.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'http://localhost:3000';
}
