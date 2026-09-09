import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Enlace firmado para reseñar sin cuenta.
 *
 * -----------------------------------------------------------------------------
 * POR QUÉ NO SE GUARDA EL TOKEN EN LA BASE
 * -----------------------------------------------------------------------------
 * El token no es un secreto que haya que custodiar: es una afirmación firmada
 * ("quien trae esto compró el producto P en el pedido O, y aún no ha caducado").
 * Verificarla solo necesita la clave, así que no hay tabla que mantener, ni
 * limpieza de tokens caducados, ni una consulta extra por visita.
 *
 * El uso único NO lo da el token, lo da la base: el índice
 * `reviews_guest_order_product_idx` impide una segunda reseña de invitada para
 * el mismo (pedido, producto). Reenviar el enlace a una amiga no le sirve de
 * nada: en cuanto existe la reseña, el enlace deja de aceptar otra.
 *
 * `ENCRYPTION_KEY` es la clave. `check-env.mjs` ya impide desplegar a
 * producción con su valor de desarrollo, así que no hace falta otra variable.
 * Si se rota, los enlaces en vuelo dejan de valer — aceptable: caducan solos.
 * -----------------------------------------------------------------------------
 */

/** 60 días desde la entrega. Pasado eso, el recuerdo de la compra ya no es útil. */
const TTL_SECONDS = 60 * 24 * 60 * 60;

export interface ReviewInvitation {
  readonly orderId: string;
  readonly productId: string;
}

function secret(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('Falta ENCRYPTION_KEY: no se pueden firmar enlaces de reseña');
  return key;
}

const b64url = (value: string) => Buffer.from(value, 'utf8').toString('base64url');
const unb64url = (value: string) => Buffer.from(value, 'base64url').toString('utf8');

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function signReviewToken(
  invitation: ReviewInvitation,
  now: Date = new Date(),
): string {
  const expiresAt = Math.floor(now.getTime() / 1000) + TTL_SECONDS;
  const payload = `${invitation.orderId}:${invitation.productId}:${expiresAt}`;
  return `${b64url(payload)}.${sign(payload)}`;
}

export type TokenFailure = 'malformed' | 'bad_signature' | 'expired';

export type VerifyResult =
  | { readonly ok: true; readonly invitation: ReviewInvitation }
  | { readonly ok: false; readonly reason: TokenFailure };

export function verifyReviewToken(token: string, now: Date = new Date()): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, reason: 'malformed' };

  const [encodedPayload, providedSignature] = parts as [string, string];

  let payload: string;
  try {
    payload = unb64url(encodedPayload);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  // La firma se comprueba ANTES de mirar el contenido: nada de lo que venga
  // dentro merece confianza hasta saber que lo emitimos nosotros.
  const expected = sign(payload);
  const a = Buffer.from(providedSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad_signature' };
  }

  const fields = payload.split(':');
  if (fields.length !== 3) return { ok: false, reason: 'malformed' };

  const [orderId, productId, rawExpiry] = fields as [string, string, string];
  const expiresAt = Number(rawExpiry);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: 'malformed' };

  if (Math.floor(now.getTime() / 1000) > expiresAt) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, invitation: { orderId, productId } };
}
