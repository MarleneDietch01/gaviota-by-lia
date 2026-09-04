import 'server-only';

/**
 * Envío de correo transaccional vía Resend.
 *
 * Igual que `subscribeToNewsletter` (si esa rama llega a integrarse): `fetch`
 * directo contra la API REST de Resend, sin el SDK — es la única llamada de
 * envío que hace la app hoy y no compensa la dependencia por un POST.
 *
 * Requiere `RESEND_API_KEY` y `EMAIL_FROM` (dominio propio verificado en
 * Resend — ver docs/MIGRATION_RISKS.md R14; un dominio @gmail.com no puede
 * enviar correo autenticado). Sin cualquiera de los dos, se devuelve
 * `not_configured` en vez de lanzar: un pedido pagado no debe fallar porque el
 * correo de confirmación no esté listo todavía.
 */
export interface SendEmailParams {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly replyTo?: string;
}

export type SendEmailResult =
  | { readonly ok: true; readonly id: string }
  | { readonly ok: false; readonly reason: 'not_configured' | 'request_failed'; readonly detail?: string };

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, reason: 'not_configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Gaviota by Lia <${from}>`,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string };

    if (!response.ok) {
      return { ok: false, reason: 'request_failed', detail: data.message ?? `HTTP ${response.status}` };
    }

    return { ok: true, id: data.id ?? '' };
  } catch (error) {
    return { ok: false, reason: 'request_failed', detail: error instanceof Error ? error.message : 'unknown_error' };
  }
}
