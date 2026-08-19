import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Límite de intentos, respaldado en Postgres (ver migración
 * `20260819180000_rate_limits.sql`).
 *
 * No usa memoria del proceso: en un despliegue serverless cada invocación
 * puede caer en una instancia distinta, así que un contador en memoria no
 * limitaría nada de verdad.
 *
 * Si `check_rate_limit` falla por cualquier motivo (red, RPC caída), se
 * permite la petición — un rate limit que se convierte en un apagón total del
 * login cuando la base de datos tiene un hipo es peor que dejar pasar algo de
 * tráfico de más en ese instante.
 */
export async function checkRateLimit(
  bucketKey: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    return true;
  }

  return data === true;
}
