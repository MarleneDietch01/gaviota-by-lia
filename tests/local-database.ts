/**
 * Guardia de destino para las pruebas de integración.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ EXISTE
 * -----------------------------------------------------------------------------
 * `rls.test.ts` e `inventory-concurrency.test.ts` no son pruebas unitarias:
 * escriben en una base de datos real. Y hasta ahora leían su destino de
 * `.env.local` sin comprobarlo, así que apuntaban a donde apuntara ese archivo.
 *
 * En un árbol de trabajo normal de este proyecto, `NEXT_PUBLIC_SUPABASE_URL`
 * apunta a PRODUCCIÓN. Es decir: `npm test` lanzaba los intentos de escritura
 * de la suite RLS contra la tienda en vivo. No causó daño porque las cuentas
 * del seed no existen en producción y el inicio de sesión fallaba — es suerte,
 * no diseño. `inventory-concurrency` llega a desactivar triggers y claves
 * ajenas (`session_replication_role = 'replica'`) para limpiar lo suyo.
 *
 * Mismo criterio que `scripts/db-remote.mjs`: se comprueba el destino, no el
 * contenido. Aquí se OMITE en vez de fallar, porque apuntar a producción es un
 * estado de configuración y no un error de código — pero se dice en voz alta.
 * -----------------------------------------------------------------------------
 *
 * Para ejecutarlas de verdad, crea `.env.test.local` apuntando al stack local
 * (`supabase start` imprime los valores). `tests/setup.ts` lo carga primero.
 */

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function databaseHost(url: string | undefined): string {
  if (!url) return '(no definida)';
  try {
    return new URL(url).hostname || '(desconocido)';
  } catch {
    return '(ilegible)';
  }
}

export function isLocalDatabase(url: string | undefined): boolean {
  return LOCAL_HOSTS.has(databaseHost(url));
}

/**
 * ¿Puede esta suite tocar la base? Solo si el destino es local.
 * Avisa por consola cuando se omite, con el host, para que la omisión no pase
 * inadvertida y se confunda con "todo verde".
 */
export function canRunAgainst(url: string | undefined, suite: string): boolean {
  if (!url) return false;

  if (!isLocalDatabase(url)) {
    console.warn(
      `[${suite}] OMITIDA: el destino es "${databaseHost(url)}", que no es local. ` +
        'Estas pruebas escriben en la base de datos y nunca deben tocar producción. ' +
        'Crea .env.test.local apuntando al stack local para ejecutarlas.',
    );
    return false;
  }

  return true;
}
