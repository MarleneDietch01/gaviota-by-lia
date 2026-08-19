import 'server-only';

import { Client, Environment, OrdersController, PaymentsController } from '@paypal/paypal-server-sdk';

function credentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET');
  }

  return { clientId, clientSecret };
}

/**
 * Cliente PayPal de servidor. `PAYPAL_CLIENT_SECRET` nunca sale de aquí.
 *
 * `PAYPAL_ENVIRONMENT=live` es el único valor que activa producción — por
 * defecto es Sandbox, igual que Stripe empieza en modo Test.
 */
export function getPayPalClient(): Client {
  const { clientId, clientSecret } = credentials();
  const isLive = process.env.PAYPAL_ENVIRONMENT === 'live';

  return new Client({
    clientCredentialsAuthCredentials: { oAuthClientId: clientId, oAuthClientSecret: clientSecret },
    environment: isLive ? Environment.Production : Environment.Sandbox,
  });
}

export function getOrdersController(): OrdersController {
  return new OrdersController(getPayPalClient());
}

export function getPaymentsController(): PaymentsController {
  return new PaymentsController(getPayPalClient());
}

/**
 * Token OAuth de servidor, para llamadas REST que el SDK no envuelve —
 * concretamente `verify-webhook-signature`, que no tiene controller propio en
 * este SDK. Se pide uno nuevo por webhook en vez de cachearlo: el volumen de
 * webhooks de una tienda de este tamaño no justifica la complejidad de
 * cachear un token que expira a los ~9000 segundos.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret } = credentials();
  const isLive = process.env.PAYPAL_ENVIRONMENT === 'live';
  const base = isLive ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el token de acceso de PayPal');
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export function getPayPalApiBase(): string {
  return process.env.PAYPAL_ENVIRONMENT === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}
