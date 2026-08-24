import { z } from 'zod';
import { emailSchema, localeSchema } from '@/lib/validation/auth';

export const newsletterSchema = z.object({
  email: emailSchema,
  lang: localeSchema,
});
