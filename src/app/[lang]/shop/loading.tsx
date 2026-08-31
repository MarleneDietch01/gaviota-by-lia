export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-[75rem] px-5 py-16 sm:px-8 lg:px-12 xl:px-16" aria-label="Loading products · Cargando productos" aria-busy="true">
      <div className="h-3 w-24 animate-pulse rounded-xs bg-line-strong" />
      <div className="mt-7 h-12 max-w-xl animate-pulse rounded-xs bg-line" />
      <div className="mt-4 h-5 max-w-2xl animate-pulse rounded-xs bg-line" />
      <div className="mt-14 grid grid-cols-1 gap-5 min-[520px]:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-sm bg-white-warm">
            <div className="aspect-square animate-pulse bg-line" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded-xs bg-line" />
              <div className="h-4 animate-pulse rounded-xs bg-line" />
              <div className="h-11 animate-pulse rounded-xs bg-line" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading… · Cargando…</span>
    </div>
  );
}
