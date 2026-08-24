import { z } from 'zod';
import { localeSchema } from '@/lib/validation/auth';

export const reviewSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((value) => (value ? value : undefined)),
  content: z.string().trim().min(1, 'required').max(2000),
  lang: localeSchema,
});
