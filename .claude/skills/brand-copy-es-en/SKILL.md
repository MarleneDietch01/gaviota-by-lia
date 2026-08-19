---
name: brand-copy-es-en
description: Redacción bilingüe es/en con la voz de Gaviota by Lia y control de afirmaciones cosméticas. Úsala cuando haya que escribir, traducir o revisar cualquier texto visible. Se activa con "escribe el copy", "mejora este texto", "traduce al inglés", "el titular no convence", "textos placeholder", "descripción de producto", "revisa las afirmaciones", "cómo llamamos a esta sección". NO decide dónde va el texto ni su jerarquía visual (usa premium-beauty-design) ni la metadata para buscadores (seo-beauty-ecommerce).
---

# Copy bilingüe — Gaviota by Lia

## Objetivo

Una voz cálida, adulta y creíble en español y en inglés, sin caer en el
marketing de belleza vacío ni en afirmaciones que la marca no puede sostener.

## Dónde vive el texto

- `src/lib/content/sections.ts` — bloques editables (`DEFAULTS_ES` /
  `DEFAULTS_EN`), con `status: 'draft' | 'active'`. Una sección en `draft`
  **no se renderiza**: es el interruptor para no publicar bloques sin contenido.
- `src/lib/content/navigation.ts` — navegación, con `en`/`es` juntos por entrada.
- `src/lib/catalog/products.ts` — nombres, descripciones y `alt`, con el mapa
  `ENGLISH` para la versión inglesa.
- `src/lib/i18n.ts` — `pick(locale, en, es)` para cadenas sueltas en JSX.

**Regla de ubicación:** si un texto se repite o puede cambiarlo la propietaria,
va en `sections.ts` o `navigation.ts`, nunca embebido en el JSX.

## La voz

| Sí | No |
|----|----|
| Cercana y adulta | Infantil o cursi |
| Sensorial y concreta | Abstracta y grandilocuente |
| Celebra cuerpos reales | Corrige defectos |
| Ritual, momento, cuidado | Milagro, secreto, transformación |
| Frases cortas | Párrafos de tres líneas |

Ideas centrales: la piel propia, el ritual diario, el origen dominicano, el
tiempo para una misma.

Palabras prohibidas: *milagroso*, *revolucionario*, *secreto*, *anti-edad*,
*elimina*, *cura*, *reduce un X %*, *clínicamente probado*, *dermatológicamente
testado* (salvo que exista el certificado).

## Nombrar el cuidado, no el defecto

Es la regla más importante de esta marca.

- ✅ "Apariencia de estrías" → ❌ "Problema de estrías"
- ✅ "Cuidado después de la depilación" → ❌ "Elimina los vellos encarnados"
- ✅ "Para que la piel se sienta cómoda" → ❌ "Corrige la piel seca"

## Afirmaciones — límite legal

Estos productos son **cosméticos**, no medicamentos. Solo se puede hablar de
apariencia, sensación y textura.

- ✅ "Ayuda a mejorar la apariencia de las estrías"
- ❌ "Elimina las estrías"
- ✅ "Hidratación profunda de rápida absorción"
- ❌ "Repara la barrera cutánea en 7 días"

Fuente de verdad de las descripciones actuales: **los claims impresos en el
envase**, leídos de `GA9.jpg`. No inventes ingredientes, porcentajes,
certificaciones, tiempos ni resultados. Consulta `docs/LEGAL_TODO.md` y
`docs/CONTENT_TODO.md` antes de afirmar nada nuevo.

Dos cosas que la marca **no dice** y no debes inventar:
- Quién es "Lia". El sitio nunca lo ha explicado. No inventes una relación
  familiar ni una historia.
- Productos capilares. Hoy no hay ninguno publicable.

## Bilingüe: escribir, no traducir

- El español es ~20 % más largo. Un titular que cabe en inglés puede romper la
  composición en español: cuéntalo y ajústalo.
- El inglés objetivo es **EE. UU.** (`en-US`): `4 fl oz`, `$`, *body oil*, *set*
  en vez de *kit*.
- El español es neutro con sabor dominicano, sin localismos cerrados.
- Ambas versiones se escriben a la vez y se revisan juntas. No dejes una en
  inglés "para luego".
- Cuidado con las tildes y la `ñ`: las fuentes cargan `latin-ext`, pero un texto
  mal copiado rompe la tipografía en "Anti-Estrías".

## Placeholders

Cuando el brief pida una sección sin contenido real:

1. Márcala inequívocamente: `[PLACEHOLDER — pendiente reseña real]`.
2. **Nunca** escribas un testimonio, nombre o resultado verosímil: alguien lo
   publicará por error.
3. Preferible: crear la sección en `sections.ts` con `status: 'draft'`, que no
   se renderiza, y documentar qué dato la activa.
4. Anota siempre en el informe qué placeholder existe y quién debe rellenarlo.

## Procedimiento

1. Localiza el texto actual y su origen documental.
2. Comprueba en `docs/CONTENT_TODO.md` si el dato está confirmado.
3. Escribe la versión española.
4. Escribe la inglesa —no traduzcas—, respetando convenciones de EE. UU.
5. Verifica longitudes: mide el titular más largo en el ancho más estrecho.
6. Revisa afirmaciones una a una contra la lista de prohibidas.
7. Coloca el texto en el módulo que corresponde, no en el JSX.

## Checklist

- [ ] Ninguna palabra de la lista prohibida.
- [ ] Ninguna afirmación médica ni cuantitativa sin fuente.
- [ ] Se nombra el cuidado, nunca el defecto.
- [ ] Español e inglés completos y equivalentes en intención.
- [ ] Inglés de EE. UU. con unidades correctas.
- [ ] Titulares comprobados a 360 px en español.
- [ ] Texto en `sections.ts` / `navigation.ts`, no incrustado.
- [ ] `alt` descriptivos, sin inventar identidad de las personas.
- [ ] Placeholders marcados de forma inconfundible.
- [ ] Sin mención a "Lia" ni a productos capilares.

## Errores que debe evitar

- Traducir con calco (*"cuidado de la piel" → "skin care"* donde toca *body care*).
- Inventar testimonios "de ejemplo".
- Copiar el copy del Shopify anterior sin auditar sus claims.
- Escribir un titular que solo funciona en inglés.
- Usar el nombre de la fundadora en contextos no confirmados.
- Dejar cadenas sueltas en el JSX con un `Record<string,string>` cuya clave es
  la frase en español: se rompe en silencio al corregir una tilde.

## Validaciones obligatorias

1. Renderizar `/es` y `/en` y leer ambas de arriba abajo.
2. Medir el titular más largo a 360 px en español.
3. Revisar cada claim nuevo contra `docs/LEGAL_TODO.md`.
4. Confirmar que ningún placeholder puede confundirse con contenido real.
5. `npm run typecheck` (los textos viven en módulos tipados).

## Formato del informe

```markdown
## Textos modificados
| clave | es | en | fuente del dato |

## Afirmaciones revisadas
| afirmación | ¿respaldada? | decisión |

## Placeholders
| sección | marca usada | qué dato la activa | quién lo aporta |

## Riesgos de longitud
Dónde el español aprieta la composición.
```
