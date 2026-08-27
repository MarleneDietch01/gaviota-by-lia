-- Ingredientes (INCI), precauciones y modo de uso confirmados a partir de la
-- documentación del fabricante (Maluhia Laboratorios), recibida en agosto 2026.
--
-- Solo se rellenan los 3 productos cuya ficha del fabricante ya llegó. El resto
-- (crema-hidratante, serum-vellos-encarnados, aceite-anti-estrias-masculino)
-- queda con ingredients_text NULL hasta recibir su documentación — ver
-- CONTENT_TODO.md C1. No se copia el INCI de un producto a otro por parecido.
--
-- Sobre el INCI: se reproduce la lista impresa en la etiqueta. Las dos únicas
-- normalizaciones son "Sacarosa" -> "Sucrose" y "Benzoato de Sosa" -> "Sodium
-- Benzoate" (nombre INCI del mismo ingrediente) y la corrección de la errata
-- "Fragance" -> "Fragrance (Parfum)". No se añade ni se elimina ningún
-- ingrediente.
--
-- precautions / usage_instructions: texto literal del lado español de la
-- etiqueta. El lado inglés ya vive en el mapa ENGLISH de
-- src/lib/catalog/products.ts y coincide con la etiqueta.
--
-- Idempotente: fija valores absolutos, se puede volver a aplicar sin efecto.

update products set
  ingredients_text = 'Sucrose, Prunus Amygdalus Dulcis Oil, Simmondsia Chinensis Seed Oil, Fragrance (Parfum), Cocos Nucifera Oil, Phenoxyethanol, Sodium Benzoate.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar en la piel húmeda una cantidad moderada y dar masajes circulares durante unos 3-5 minutos en el área deseada. Luego retirar con abundante agua. Para óptimos resultados, utilizar dos veces por semana.'
where slug = 'exfoliante-de-coco';

update products set
  ingredients_text = 'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragrance (Parfum), Glycine Soja Oil.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar en la zona deseada y masajear con movimientos circulares por unos minutos. Para óptimos resultados, aplicar después del baño, dos veces al día.'
where slug = 'aceite-anti-estrias';

-- El tónico comparte fórmula impresa con el aceite anti-estrías (misma lista
-- INCI en su etiqueta). Los claims de crecimiento/anticaída de esa etiqueta NO
-- se reproducen en ningún texto del sitio (CONTENT_TODO C15, LEGAL_TODO L8);
-- aquí solo se añaden ingredientes, precauciones y modo de uso.
update products set
  ingredients_text = 'Paraffinum Liquidum, Mineral Oil, Cocos Nucifera (Coconut) Oil, Rosa Moschata (Rosehip) Seed Oil, Prunus Dulcis (Almond) Oil, Tocopherol Acetate, Isopropyl Myristate, Fragrance (Parfum), Glycine Soja Oil.',
  precautions = 'Mantener fuera del alcance de los niños. En caso de irritación, descontinuar su uso. Evite contacto con los ojos. Uso externo.',
  usage_instructions = 'Aplicar el spray sobre la barba limpia y seca, masajeando suavemente la piel para favorecer la absorción. Usar 1-2 veces al día de forma constante para mejores resultados.'
where slug = 'tonico-para-barba';
