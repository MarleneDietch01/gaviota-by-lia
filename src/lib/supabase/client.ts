'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

/**
 * Cliente Supabase del navegador.
 *
 * Usa la clave anónima, que es pública por diseño: toda su seguridad descansa
 * en las políticas RLS. Por eso las RLS no son opcionales ni una segunda capa
 * "por si acaso" — para este cliente son la única capa.
 */
export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
