-- Aceite Anti-Estrías Masculino: comparte fórmula, modo de uso y precauciones
-- con el Aceite Anti-Estrías (misma etiqueta del fabricante, confirmado por la
-- propietaria). Mismos valores que fijó 20260827120000_product_ingredients.sql
-- para 'aceite-anti-estrias'.
--
-- Idempotente.

update products set
  ingredients_text = 'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragrance (Parfum), Glycine Soja Oil.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar en la zona deseada y masajear con movimientos circulares por unos minutos. Para óptimos resultados, aplicar después del baño, dos veces al día.'
where slug = 'aceite-anti-estrias-masculino';
