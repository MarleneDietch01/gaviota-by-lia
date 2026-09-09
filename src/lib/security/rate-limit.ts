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
 * Si `check_rate_limit` falla por cualquier motivo (red, RPC caída), por
 * defecto se PERMITE la petición — un rate limit que se convierte en un apagón
 * total del formulario cuando la base de datos tiene un hipo es peor que dejar
 * pasar algo de tráfico de más en ese instante.
 *
 * `failClosed` invierte esa decisión y se reserva para `/admin/login`: ahí el
 * cálculo es el contrario. Quedarse sin freno de fuerza bruta en la única
 * puerta al panel, justo durante una caída en la que nadie está mirando los
 * registros, cuesta más que rechazar unos intentos legítimos hasta que la base
 * responda. Una administradora puede esperar; un atacante automatizado no
 * desaprovecha la ventana.
 */
export async function checkRateLimit(
  bucketKey: string,
  maxAttempts: number,
  windowSeconds: number,
  options: { readonly failClosed?: boolean } = {},
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    if (options.failClosed) {
      console.error('[rate-limit] RPC no disponible, se rechaza el intento:', error.code);
      return false;
    }
    return true;
  }

  return data === true;
}
