import { z } from 'zod';

/**
 * Validación de la edición de producto desde `/admin/products`.
 *
 * Los precios llegan del formulario en unidades (dólares, con decimales) —
 * como los escribe la dueña — y se convierten a centavos en la Server Action,
 * nunca antes. `compareAtPrice` exige sus dos fechas al mismo tiempo (o
 * ninguna): es el mismo requisito que ya impone la base de datos
 * (`compare_at_needs_dates`/`compare_at_dates_ordered`/`compare_at_price_higher`),
 * repetido aquí para dar un error de formulario legible en vez de dejar que la
 * clienta vea el mensaje crudo de Postgres.
 */
export const productEditSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio').max(200),
    shortDescription: z.string().trim().max(300).optional(),
    description: z.string().trim().max(4000).optional(),
    sizeLabel: z.string().trim().max(40).optional(),
    price: z.coerce.number().positive('El precio debe ser mayor que cero'),
    compareAtPrice: z.coerce.number().positive().optional(),
    compareAtStartsAt: z.string().trim().optional(),
    compareAtEndsAt: z.string().trim().optional(),
    categoryId: z.uuid().optional(),
    featured: z.coerce.boolean().optional(),
    ingredientsText: z.string().trim().max(4000).optional(),
    usageInstructions: z.string().trim().max(2000).optional(),
    precautions: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.compareAtPrice !== undefined) {
      if (data.compareAtPrice <= data.price) {
        ctx.addIssue({
          code: 'custom',
          path: ['compareAtPrice'],
          message: 'El precio anterior debe ser mayor que el precio actual',
        });
      }
      if (!data.compareAtStartsAt || !data.compareAtEndsAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['compareAtStartsAt'],
          message: 'Un precio anterior exige fecha de inicio y de fin de vigencia',
        });
      } else if (new Date(data.compareAtEndsAt) <= new Date(data.compareAtStartsAt)) {
        ctx.addIssue({
          code: 'custom',
          path: ['compareAtEndsAt'],
          message: 'La fecha de fin debe ser posterior a la de inicio',
        });
      }
    }
  });

export type ProductEditInput = z.infer<typeof productEditSchema>;

export const stockAdjustSchema = z.object({
  variantId: z.uuid(),
  newQuantity: z.coerce.number().int().min(0, 'El stock no puede ser negativo'),
  reason: z.string().trim().min(1, 'Todo ajuste de inventario exige un motivo').max(300),
});

/** Palabras que convierten un cosmético en un claim de medicamento (ver
 * `docs/LEGAL_TODO.md` y el precedente de `tonico-para-barba`). No se bloquea
 * el guardado — es texto libre de la dueña — pero se avisa antes de guardar,
 * igual que el precio tachado se avisa con un error de validación en vez de
 * dejar pasar silenciosamente un dato inventado. */
export const MEDICAL_CLAIM_PATTERNS = [
  /\bcura\b/i,
  /\belimina(r)?\b/i,
  /\bclínicamente probado\b/i,
  /\bcrecimiento capilar\b/i,
  /\banticaída\b/i,
  /\bcombate(n)? la(s)? caída(s)?\b/i,
  /\breduce (un|el) \d/i,
];

export function findMedicalClaims(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of MEDICAL_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) found.add(match[0]);
  }
  return [...found];
}
