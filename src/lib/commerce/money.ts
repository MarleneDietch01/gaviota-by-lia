/**
 * Dinero.
 *
 * Todo importe se representa en CENTAVOS, como entero. Nunca en coma flotante:
 * `0.1 + 0.2 !== 0.3`, y en el total de un pedido eso es un descuadre contable.
 *
 * El tipo marcado (`branded type`) impide sumar centavos con un precio en
 * unidades por descuido: el compilador lo rechaza. No hay coste en ejecución,
 * es únicamente información de tipos.
 */
export type Cents = number & { readonly __brand: 'Cents' };

/** Construye un valor en centavos, validando que sea un entero razonable. */
export function cents(value: number): Cents {
  if (!Number.isInteger(value)) {
    throw new TypeError(`Los centavos deben ser un entero, recibido: ${value}`);
  }

  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`Importe fuera del rango seguro: ${value}`);
  }

  return value as Cents;
}

/** Convierte unidades monetarias a centavos. `fromUnits(49.99) === 4999`. */
export function fromUnits(units: number): Cents {
  return cents(Math.round(units * 100));
}

/** Convierte centavos a unidades monetarias. Solo para presentación. */
export function toUnits(value: Cents): number {
  return value / 100;
}

export function addCents(a: Cents, b: Cents): Cents {
  return cents(a + b);
}

export function subtractCents(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

export function multiplyCents(value: Cents, factor: number): Cents {
  if (!Number.isInteger(factor)) {
    throw new TypeError(`El factor debe ser entero, recibido: ${factor}`);
  }
  return cents(value * factor);
}

/**
 * Aplica un porcentaje expresado en centésimas de punto (1000 = 10,00 %).
 *
 * Se redondea hacia abajo: ante una fracción de centavo, el redondeo favorece
 * a la clienta en el descuento y evita cobrar de más.
 */
export function applyPercentage(value: Cents, hundredthsOfPercent: number): Cents {
  if (!Number.isInteger(hundredthsOfPercent)) {
    throw new TypeError('El porcentaje debe ser un entero en centésimas de punto');
  }

  if (hundredthsOfPercent < 0 || hundredthsOfPercent > 10000) {
    throw new RangeError(
      `Porcentaje fuera de rango [0, 10000]: ${hundredthsOfPercent}`,
    );
  }

  return cents(Math.floor((value * hundredthsOfPercent) / 10000));
}

/** Nunca por debajo de cero: los totales no pueden ser negativos. */
export function clampToZero(value: number): Cents {
  return cents(Math.max(0, Math.round(value)));
}

/**
 * Formatea para mostrar. Única capa donde los centavos se convierten a texto.
 *
 * `es-DO` con USD: el sitio es en español y la moneda es el dólar
 * estadounidense (verificado en la auditoría del sitio actual).
 */
export function formatMoney(
  value: Cents,
  currency = 'USD',
  locale = 'es-DO',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(toUnits(value));
}

/**
 * Porcentaje de ahorro entre un precio anterior y el actual.
 *
 * Devuelve `null` si no procede mostrarlo. Corresponde a la decisión aprobada:
 * el ahorro solo se renderiza cuando existe un precio anterior REAL y vigente,
 * calculado en servidor. La base de datos ya impide guardar un precio anterior
 * sin ventana de vigencia (`compare_at_needs_dates`); esto es la comprobación
 * equivalente en la capa de aplicación.
 */
export function savingsPercentage(
  currentPrice: Cents,
  compareAtPrice: Cents | null,
  compareAtStartsAt: Date | null,
  compareAtEndsAt: Date | null,
  now: Date = new Date(),
): number | null {
  if (compareAtPrice === null) return null;
  if (compareAtPrice <= currentPrice) return null;

  // Sin ventana de vigencia no hay ahorro que mostrar.
  if (compareAtStartsAt === null || compareAtEndsAt === null) return null;
  if (now < compareAtStartsAt || now > compareAtEndsAt) return null;

  const difference = compareAtPrice - currentPrice;
  return Math.round((difference / compareAtPrice) * 100);
}
