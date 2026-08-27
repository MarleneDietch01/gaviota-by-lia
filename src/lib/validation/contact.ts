import { z } from 'zod';

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      const normalized = String(value ?? '').trim();
      return normalized || undefined;
    },
    z.string().max(max).optional(),
  );

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: optionalText(30),
  subject: z.enum(['product', 'order', 'shipping', 'other']),
  orderNumber: optionalText(40),
  message: z.string().trim().min(10).max(2000),
  lang: z.enum(['en', 'es']),
});
