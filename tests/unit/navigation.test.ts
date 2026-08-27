import { describe, expect, it } from 'vitest';
import { ACCOUNT_NAV, BRAND_NAV, CATEGORY_NAV, HELP_NAV, LEGAL_NAV, PRIMARY_NAV } from '@/lib/content/navigation';
import { ROUTE_PAGES } from '@/lib/content/route-pages';

describe('navegación visible', () => {
  it('no contiene enlaces vacíos ni href #', () => {
    const items = [...PRIMARY_NAV, ...CATEGORY_NAV, ...BRAND_NAV, ...HELP_NAV, ...LEGAL_NAV, ...ACCOUNT_NAV];
    expect(items.every((item) => item.href.startsWith('/') && item.href !== '/#')).toBe(true);
  });

  it('todas las rutas estáticas del header y footer tienen implementación', () => {
    const implementedElsewhere = new Set(['/shop', '/search', '/account']);
    const routes = [...PRIMARY_NAV, ...CATEGORY_NAV, ...BRAND_NAV, ...HELP_NAV, ...LEGAL_NAV, ...ACCOUNT_NAV].map((item) => item.href.slice(1)).filter(Boolean);
    expect(routes.filter((route) => !implementedElsewhere.has(`/${route}`) && !route.startsWith('categories/') && !(route in ROUTE_PAGES) && route !== 'cart' && route !== 'wishlist')).toEqual([]);
  });
});
