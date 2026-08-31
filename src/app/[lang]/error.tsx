'use client';

import { useParams } from 'next/navigation';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const es = useParams().lang === 'es';
  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="text-h1">{es ? 'No pudimos cargar esta página' : "We couldn't load this page"}</h1>
      <p className="mt-5 text-body">
        {es
          ? 'Inténtalo de nuevo. Si el problema continúa, contáctanos.'
          : 'Please try again. If the problem persists, contact us.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 min-h-12 rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm"
      >
        {es ? 'Reintentar' : 'Try again'}
      </button>
    </div>
  );
}
