'use server';

import { createHash, createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import type { ZodIssue } from 'zod';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { contactSchema } from '@/lib/validation/contact';
import { isLocale, type Locale } from '@/lib/i18n';

type ContactField = 'name' | 'email' | 'phone' | 'subject' | 'orderNumber' | 'message';

export interface ContactState {
  readonly status?: 'success' | 'error';
  readonly message?: string;
  readonly errors?: Partial<Record<ContactField, string>>;
}

const SUBJECTS = {
  product: 'Product question',
  order: 'Order help',
  shipping: 'Shipping or returns',
  other: 'Other',
} as const;

function validationErrors(issues: ZodIssue[], lang: Locale): ContactState {
  const messages: Record<ContactField, string> = {
    name: lang === 'es' ? 'Escribe tu nombre.' : 'Enter your name.',
    email: lang === 'es' ? 'Escribe un correo válido.' : 'Enter a valid email.',
    phone: lang === 'es' ? 'Revisa el número de teléfono.' : 'Check the phone number.',
    subject: lang === 'es' ? 'Selecciona un asunto.' : 'Choose a subject.',
    orderNumber: lang === 'es' ? 'Revisa el número de pedido.' : 'Check the order number.',
    message:
      lang === 'es'
        ? 'El mensaje debe tener entre 10 y 2,000 caracteres.'
        : 'The message must be between 10 and 2,000 characters.',
  };
  const errors: Partial<Record<ContactField, string>> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && field in messages) {
      errors[field as ContactField] = messages[field as ContactField];
    }
  }

  return {
    status: 'error',
    message:
      lang === 'es'
        ? 'Revisa los campos señalados e inténtalo de nuevo.'
        : 'Check the highlighted fields and try again.',
    errors,
  };
}

function privateHash(value: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secret
    ? createHmac('sha256', secret).update(value).digest('hex')
    : createHash('sha256').update(value).digest('hex');
}

export async function submitContact(
  _previousState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const langRaw = String(formData.get('lang') ?? '');
  const lang: Locale = isLocale(langRaw) ? langRaw : 'es';

  // Campo señuelo: una persona no puede verlo ni enfocarlo. Los bots que lo
  // completan reciben la misma confirmación para no enseñarles cómo evadirlo.
  if (String(formData.get('company') ?? '').trim()) {
    return {
      status: 'success',
      message:
        lang === 'es'
          ? 'Recibimos tu mensaje. Te responderemos lo antes posible.'
          : 'We received your message. We will reply as soon as possible.',
    };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    subject: formData.get('subject'),
    orderNumber: formData.get('orderNumber'),
    message: formData.get('message'),
    lang,
  });

  if (!parsed.success) return validationErrors(parsed.error.issues, lang);

  const requestHeaders = await headers();
  const forwardedFor =
    requestHeaders.get('x-vercel-forwarded-for') ?? requestHeaders.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || null;
  const ipHash = ip ? privateHash(ip) : null;
  const rateKey = ipHash ?? privateHash(parsed.data.email);
  const allowed = await checkRateLimit(`contact:${rateKey}`, 5, 3600);

  if (!allowed) {
    return {
      status: 'error',
      message:
        lang === 'es'
          ? 'Has enviado varios mensajes. Espera una hora o escríbenos por WhatsApp.'
          : 'You have sent several messages. Wait an hour or contact us on WhatsApp.',
    };
  }

  const { error } = await createAdminSupabaseClient().from('contact_messages').insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    subject: SUBJECTS[parsed.data.subject],
    order_number: parsed.data.orderNumber ?? null,
    message: parsed.data.message,
    status: 'new',
    ip_hash: ipHash,
  });

  if (error) {
    console.error('[contact] failed to save message:', error.code);
    return {
      status: 'error',
      message:
        lang === 'es'
          ? 'No pudimos enviar tu mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.'
          : 'We could not send your message. Try again or contact us on WhatsApp.',
    };
  }

  return {
    status: 'success',
    message:
      lang === 'es'
        ? 'Recibimos tu mensaje. Te responderemos lo antes posible.'
        : 'We received your message. We will reply as soon as possible.',
  };
}
