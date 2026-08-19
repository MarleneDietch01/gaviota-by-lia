'use client';

import Link from 'next/link';
import { useMemo, useState, useSyncExternalStore } from 'react';
import type { Product } from '@/lib/catalog/products';
import { cents, formatMoney } from '@/lib/commerce/money';
import {
  getBag,
  getFavorites,
  removeFromBag,
  setBagQuantity,
  subscribeBag,
  subscribeFavorites,
  toggleFavorite,
} from '@/lib/commerce/bag';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

const EMPTY_BAG: readonly { slug: string; quantity: number }[] = [];
const EMPTY_FAVORITES: readonly string[] = [];

export function SavedList({
  kind,
  products,
  locale,
}: {
  kind: 'cart' | 'wishlist';
  products: readonly Product[];
  locale: Locale;
}) {
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkoutPending, setCheckoutPending] = useState(false);

  const bagCount = useSyncExternalStore(
    subscribeBag,
    () => getBag().reduce((n, item) => n + item.quantity, 0),
    () => 0,
  );
  const favoriteCount = useSyncExternalStore(subscribeFavorites, () => getFavorites().length, () => 0);
  const bag = useMemo(() => (bagCount >= 0 ? getBag() : EMPTY_BAG), [bagCount]);
  const favorites = useMemo(() => (favoriteCount >= 0 ? getFavorites() : EMPTY_FAVORITES), [favoriteCount]);

  const lines =
    kind === 'cart'
      ? bag.flatMap((line) => {
          const product = products.find((item) => item.slug === line.slug);
          return product ? [{ product, quantity: line.quantity }] : [];
        })
      : favorites.flatMap((slug) => {
          const product = products.find((item) => item.slug === slug);
          return product ? [{ product, quantity: 1 }] : [];
        });

  async function handleCheckout() {
    setCheckoutError(null);
    setCheckoutPending(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: locale,
          lines: bag.map((line) => ({ slug: line.slug, quantity: line.quantity })),
        }),
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? 'checkout_failed');
      }

      window.location.href = data.url;
    } catch {
      setCheckoutPending(false);
      setCheckoutError(
        pick(
          locale,
          "Something went wrong starting checkout. Please try again.",
          'Algo falló al iniciar el pago. Inténtalo de nuevo.',
        ),
      );
    }
  }

  if (!lines.length) {
    return (
      <div className="rounded-sm border border-line bg-white-warm p-8 text-center">
        <p className="text-lead">
          {pick(
            locale,
            kind === 'cart' ? 'Your bag is empty.' : 'You have no favorites yet.',
            kind === 'cart' ? 'Tu bolsa está vacía.' : 'Aún no tienes favoritos.',
          )}
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm"
          href={localizedHref(locale, '/shop')}
        >
          {pick(locale, 'Explore products', 'Explorar productos')}
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((total, line) => total + Number(line.product.price) * line.quantity, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <ul className="divide-y divide-line rounded-sm border border-line bg-white-warm px-5">
        {lines.map(({ product, quantity }) => (
          <li key={product.slug} className="grid grid-cols-[1fr_auto] gap-4 py-5">
            <div>
              <Link
                className="font-semibold hover:text-rose"
                href={localizedHref(locale, `/products/${product.slug}`)}
              >
                {product.name}
              </Link>
              <p className="mt-1 text-sm text-body">
                {product.sizeLabel} · {formatMoney(product.price, 'USD', locale === 'es' ? 'es-US' : 'en-US')}
              </p>
            </div>
            {kind === 'cart' ? (
              <div className="flex items-center gap-2">
                <button
                  className="size-11 rounded-xs border border-line"
                  aria-label={pick(locale, `Decrease ${product.name}`, `Reducir ${product.name}`)}
                  onClick={() => setBagQuantity(product.slug, quantity - 1)}
                >
                  −
                </button>
                <span className="min-w-6 text-center tabular">{quantity}</span>
                <button
                  className="size-11 rounded-xs border border-line"
                  aria-label={pick(locale, `Increase ${product.name}`, `Aumentar ${product.name}`)}
                  onClick={() => setBagQuantity(product.slug, quantity + 1)}
                >
                  +
                </button>
                <button className="min-h-11 px-2 text-sm underline" onClick={() => removeFromBag(product.slug)}>
                  {pick(locale, 'Remove', 'Quitar')}
                </button>
              </div>
            ) : (
              <button className="min-h-11 px-3 text-sm underline" onClick={() => toggleFavorite(product.slug)}>
                {pick(locale, 'Remove', 'Quitar')}
              </button>
            )}
          </li>
        ))}
      </ul>

      {kind === 'cart' ? (
        <aside className="h-fit rounded-sm bg-powder p-6">
          <h2 className="font-display text-2xl">{pick(locale, 'Summary', 'Resumen')}</h2>
          <p className="mt-5 flex justify-between">
            <span>{pick(locale, 'Estimated subtotal', 'Subtotal estimado')}</span>
            <strong>{formatMoney(cents(subtotal), 'USD', locale === 'es' ? 'es-US' : 'en-US')}</strong>
          </p>
          <p className="mt-4 text-xs leading-relaxed text-body">
            {pick(
              locale,
              'Taxes and shipping are calculated at checkout. Card, Apple Pay and Google Pay accepted where available.',
              'Impuestos y envío se calculan en el checkout. Aceptamos tarjeta, Apple Pay y Google Pay donde estén disponibles.',
            )}
          </p>

          {checkoutError ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {checkoutError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={checkoutPending}
            className="mt-6 min-h-12 w-full rounded-xs bg-ink px-5 text-sm font-semibold text-white-warm transition-colors hover:bg-wine disabled:pointer-events-none disabled:opacity-55"
          >
            {checkoutPending
              ? pick(locale, 'Starting checkout…', 'Iniciando el pago…')
              : pick(locale, 'Checkout', 'Ir a pagar')}
          </button>
        </aside>
      ) : null}
    </div>
  );
}
