-- Sérum Vellos Encarnados: ingredientes (INCI), modo de uso y precauciones
-- confirmados con la etiqueta del fabricante (Maluhia Laboratorios), recibida
-- en agosto 2026. Continúa la migración 20260827120000_product_ingredients.sql.
--
-- INCI: reproducido de la etiqueta. "Polysorbate20" se escribe con espacio
-- ("Polysorbate 20"), su forma INCI. No se añade ni se quita nada.
-- modo de uso / precauciones: texto literal del lado español de la etiqueta;
-- el lado inglés ya está en el mapa ENGLISH de src/lib/catalog/products.ts y
-- coincide.
--
-- Idempotente.

update products set
  ingredients_text = 'Aqua, Propylene Glycol, 3-O-Ethyl Ascorbic Acid, Tocopheryl Acetate, Polyisobutene, Polysorbate 20, Sorbitan Isostearate, Hyaluronic Acid, Xanthan Gum, Benzoic Acid, Sorbic Acid, Salicylic Acid, Lactic Acid, Citric Acid, Benzyl Alcohol, Sodium Polyacrylate.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, suspender su uso. Evitar el contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplique el producto después de la depilación para calmar la piel y prevenir los pelos encarnados.'
where slug = 'serum-vellos-encarnados';
