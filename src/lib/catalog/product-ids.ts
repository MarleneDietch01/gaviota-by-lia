import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * El catálogo (`src/lib/catalog/products.ts`) sigue hardcodeado por `slug`,
 * sin `id` real — pero `reviews.product_id` es un uuid que referencia la fila
 * de `products` en Supabase. Este helper es el único puente entre ambos
 * mundos: resuelve el uuid real a partir del slug, para el puñado de
 * funciones (reseñas) que sí necesitan tocar una tabla con foreign key.
 */
export async function getProductIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('products').select('id').eq('slug', slug).eq('status', 'active').single();
  return data?.id ?? null;
}
