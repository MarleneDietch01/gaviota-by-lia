import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createProduct } from '../actions';

export const metadata = { title: 'Crear producto' };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  async function action(formData: FormData) {
    'use server';
    const result = await createProduct(formData);
    if (!result.ok || !result.id) redirect(`/admin/products/new?error=${encodeURIComponent(result.error ?? 'No se pudo crear')}`);
    redirect(`/admin/products/${result.id}?saved=1`);
  }
  const input = 'mt-1 min-h-11 w-full rounded-xs border border-line-strong bg-white-warm px-3 text-sm';
  return <div className="max-w-2xl">
    <Link href="/admin/products" className="text-sm font-medium text-body hover:text-rose">← Volver a productos</Link>
    <h1 className="mt-4 font-display text-h2">Crear producto</h1>
    <p className="mt-1 text-sm text-body">Se crea como borrador. Podrás completar imágenes, textos y stock antes de publicarlo.</p>
    {error ? <p role="alert" className="mt-4 rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
    <form action={action} className="mt-6 space-y-5 rounded-sm border border-line bg-white-warm p-5">
      <div><label htmlFor="name" className="text-sm font-medium">Nombre ES</label><input id="name" name="name" required className={input}/></div>
      <div><label htmlFor="nameEn" className="text-sm font-medium">Nombre EN</label><input id="nameEn" name="nameEn" required className={input}/></div>
      <div><label htmlFor="slug" className="text-sm font-medium">Slug</label><input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="crema-corporal" className={input}/></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="price" className="text-sm font-medium">Precio USD</label><input id="price" name="price" type="number" min="0.01" step="0.01" required className={input}/></div>
        <div><label htmlFor="sizeLabel" className="text-sm font-medium">Presentación</label><input id="sizeLabel" name="sizeLabel" placeholder="236 mL" className={input}/></div>
      </div>
      <button className="min-h-11 rounded-xs bg-rose px-6 text-sm font-semibold text-white-warm hover:bg-rose-deep">Crear borrador</button>
    </form>
  </div>;
}
