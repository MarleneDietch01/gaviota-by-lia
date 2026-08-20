import { z } from 'zod';

const MAX_LINE_QUANTITY = 20;
const MAX_LINES = 30;

export const checkoutLineSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(MAX_LINE_QUANTITY),
});

export const checkoutLinesSchema = z.array(checkoutLineSchema).min(1).max(MAX_LINES);

const optionalEmailSchema = z.string().trim().toLowerCase().email().max(254);

/**
 * El correo del comprador es opcional (el checkout admite comprador anónimo),
 * así que un valor mal formado no debe tumbar el pedido entero — se trata
 * como "no se dio correo" en vez de rechazar la petición completa por un
 * campo secundario.
 */
export function parseOptionalCheckoutEmail(value: unknown): string {
  const result = optionalEmailSchema.safeParse(value);
  return result.success ? result.data : '';
}
