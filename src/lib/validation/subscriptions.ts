import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const lang = z.enum(['en', 'es']);

export const newsletterSchema = z.object({ email, lang });

export const backInStockSchema = z.object({
  email,
  lang,
  slug: z.string().trim().min(1).max(120),
});
