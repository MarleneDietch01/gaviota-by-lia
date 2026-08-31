'use client';

import { useParams } from 'next/navigation';

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const es = useParams().lang === 'es';
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <p className="eyebrow mb-3 text-rose">{es ? 'Catálogo' : 'Catalog'}</p>
      <h1 className="text-h1">
        {es ? 'No pudimos cargar la colección.' : "We couldn't load the collection."}
      </h1>
      <p className="mt-4 text-body">
        {es
          ? 'Inténtalo de nuevo. No se vio afectada ninguna información de pedidos ni de tu cuenta.'
          : 'Please try again. No order or account information was affected.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 min-h-12 rounded-xs bg-rose px-7 text-sm font-semibold text-white-warm hover:bg-rose-ink"
      >
        {es ? 'Reintentar' : 'Try again'}
      </button>
    </div>
  );
}
