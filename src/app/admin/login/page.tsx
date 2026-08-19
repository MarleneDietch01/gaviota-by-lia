import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Iniciar sesión' };

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="w-full max-w-sm">
        <p className="eyebrow mb-2 text-rose">Panel</p>
        <h1 className="font-display text-h3">Gaviota by Lia</h1>
        <p className="mt-2 text-sm text-body">Acceso solo para administradoras.</p>

        <div className="mt-8">
          <LoginForm />
        </div>

        {/* El panel vive fuera de `[lang]/`, así que no hereda el header del
            sitio: sin esto no había ninguna forma de volver a la tienda. */}
        <Link
          href="/"
          className="mt-8 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-body transition-colors hover:text-rose"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
