'use client';

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="eyebrow mb-3 text-rose">Catalog</p>
      <h1 className="text-h1">We couldn&apos;t load the collection.</h1>
      <p className="mt-4 text-body">Please try again. No order or account information was affected.</p>
      <button type="button" onClick={reset} className="mt-8 min-h-12 rounded-xs bg-rose px-7 text-sm font-semibold text-white-warm hover:bg-rose-ink">
        Try again
      </button>
    </div>
  );
}
