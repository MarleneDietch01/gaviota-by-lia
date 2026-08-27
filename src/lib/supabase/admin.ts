import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Cliente Supabase con la clave `service_role`.
 *
 * ⚠️ SALTA TODAS LAS POLÍTICAS RLS.
 *
 * El `import 'server-only'` de la primera línea no es decorativo: si algún día
 * un Client Component importa este módulo por error, **la compilación falla**.
 * Convierte lo que sería una filtración catastrófica de credenciales en un
 * error de build. No queda al criterio de quien revise el código.
 *
 * Uso permitido, y solo estos:
 *   - Manejador del webhook de pagos (no hay sesión de usuario)
 *   - Tareas cron (liberar reservas, caducar carritos)
 *   - Creación de pedidos (escribe en tablas donde el cliente no tiene INSERT)
 *   - Carrito anónimo (identificado por cookie httpOnly, no por sesión)
 *   - Formularios públicos mediados por servidor y protegidos contra abuso
 *
 * Para todo lo demás se usa `createServerSupabaseClient()`, que respeta RLS.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Falta NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!serviceRoleKey) {
    throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
