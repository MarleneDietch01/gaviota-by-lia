"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { ShoppingBag } from "lucide-react";
import { getBag, subscribeBag } from "@/lib/commerce/bag";
import { localizedHref, pick, type Locale } from "@/lib/i18n";
import { LinkButton } from "@/components/ui/button";
import { QuickAdd } from "./product-actions";

export function MobilePurchaseBar({
  slug,
  productName,
  priceLabel,
  locale,
  inStock,
}: {
  slug: string;
  productName: string;
  priceLabel: string;
  locale: Locale;
  inStock: boolean;
}) {
  const actionRef = useRef<HTMLDivElement>(null);
  const actionHadFocus = useRef(false);
  // También responde a las adiciones desde el botón principal y otras pestañas.
  const quantity = useSyncExternalStore(
    subscribeBag,
    useCallback(
      () => getBag().find((line) => line.slug === slug)?.quantity ?? 0,
      [slug],
    ),
    () => 0,
  );

  useEffect(() => {
    // Al sustituir Añadir por Ver bolsa, conserva el foco dentro de la acción.
    // Una adición desde el botón principal no debe mover el foco a esta barra.
    if (quantity > 0 && actionHadFocus.current) {
      actionRef.current?.querySelector("a")?.focus();
    }
  }, [quantity]);

  return (
    <div
      aria-label={pick(locale, "Product purchase", "Comprar producto")}
      role="region"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-5 py-3 shadow-subtle backdrop-blur-sm lg:hidden [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="truncate text-caption text-body">{productName}</p>
          <p className="tabular text-base font-bold text-ink">{priceLabel}</p>
        </div>
        <div
          ref={actionRef}
          className="min-w-36"
          onFocusCapture={() => {
            actionHadFocus.current = true;
          }}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              actionHadFocus.current = false;
          }}
        >
          {quantity > 0 ? (
            <LinkButton href={localizedHref(locale, "/cart")} size="sm" block>
              <ShoppingBag className="size-4 shrink-0" aria-hidden="true" />
              {pick(locale, "View bag", "Ver bolsa")}
            </LinkButton>
          ) : (
            <QuickAdd
              slug={slug}
              productName={productName}
              locale={locale}
              inStock={inStock}
              variant="solid"
            />
          )}
        </div>
      </div>
      <span role="status" className="sr-only">
        {quantity > 0
          ? pick(
              locale,
              `${quantity} of ${productName} in your bag.`,
              `${quantity} de ${productName} en tu bolsa.`,
            )
          : ""}
      </span>
    </div>
  );
}
