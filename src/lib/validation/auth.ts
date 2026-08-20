import { z } from 'zod';
import { locales } from '@/lib/i18n';

/**
 * Esquemas de validación de los formularios de cuenta.
 *
 * Antes esto era una comprobación manual (`if (!email || !password)`), que
 * solo detectaba campos vacíos — un correo como "no-es-un-correo" pasaba sin
 * problema hasta que Supabase lo rechazaba con un mensaje genérico. Zod ya
 * está en package.json como dependencia desde el inicio del proyecto pero
 * ningún formulario lo usaba todavía.
 */

export const localeSchema = z.enum(locales);

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

/** Para REGISTRO: aplica el mínimo. Para LOGIN se usa `loginPasswordSchema`,
 *  más permisivo — una cuenta antigua no debe quedar fuera si algún día el
 *  mínimo sube. */
export const newPasswordSchema = z
  .string()
  .min(8, 'too_short')
  .max(72, 'too_long'); // 72 bytes: límite real de bcrypt, no un número arbitrario

export const loginPasswordSchema = z.string().min(1, 'required').max(200);

export const nameSchema = z.string().trim().min(1, 'required').max(100);
export const optionalNameSchema = z.string().trim().max(100).optional();

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
  lang: localeSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: newPasswordSchema,
  firstName: nameSchema,
  lastName: optionalNameSchema,
  lang: localeSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  lang: localeSchema,
});

export const resetPasswordSchema = z.object({
  password: newPasswordSchema,
});
