import 'server-only';

/**
 * Adds an email to the Resend newsletter audience.
 *
 * Uses `fetch` directly against Resend's REST API rather than the `resend`
 * npm package: this is the only Resend call the app makes today, and pulling
 * in the SDK for one POST request isn't worth the dependency.
 *
 * Requires `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`. Resend's Contacts API
 * upserts by email — subscribing twice with the same address doesn't create
 * a duplicate contact or error.
 */
export async function subscribeToNewsletter(email: string): Promise<{ ok: true } | { ok: false; reason: 'not_configured' | 'request_failed' }> {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return { ok: false, reason: 'not_configured' };
  }

  const response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, unsubscribed: false }),
  });

  if (!response.ok) {
    return { ok: false, reason: 'request_failed' };
  }

  return { ok: true };
}
