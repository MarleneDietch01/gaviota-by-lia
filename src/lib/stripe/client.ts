import 'server-only';

import Stripe from 'stripe';

/**
 * Cliente Stripe de servidor.
 *
 * La Secret Key NUNCA sale de aquí — `import 'server-only'` en la primera
 * línea hace que la compilación falle si algún Client Component importa este
 * módulo por error, igual que `lib/supabase/admin.ts`.
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Falta STRIPE_SECRET_KEY');
  }

  return new Stripe(secretKey, {
    typescript: true,
  });
}
