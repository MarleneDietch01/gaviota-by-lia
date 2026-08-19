import { describe, it, expect } from 'vitest';
import {
  cents,
  fromUnits,
  toUnits,
  addCents,
  subtractCents,
  multiplyCents,
  applyPercentage,
  clampToZero,
  formatMoney,
  savingsPercentage,
} from '@/lib/commerce/money';

describe('Representación del dinero', () => {
  it('rechaza importes no enteros', () => {
    expect(() => cents(10.5)).toThrow(TypeError);
  });

  it('convierte unidades a centavos sin error de coma flotante', () => {
    expect(fromUnits(49.99)).toBe(4999);
    expect(fromUnits(40)).toBe(4000);
    expect(fromUnits(0.1) + fromUnits(0.2)).toBe(fromUnits(0.3));
  });

  it('0.1 + 0.2 === 0.3 en centavos (no en float)', () => {
    // La razón de ser de todo este módulo.
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(addCents(cents(10), cents(20))).toBe(cents(30));
  });

  it('convierte de vuelta a unidades', () => {
    expect(toUnits(cents(5000))).toBe(50);
  });
});

describe('Aritmética', () => {
  it('suma y resta', () => {
    expect(addCents(cents(5000), cents(4000))).toBe(6 - 6 + 9000);
    expect(subtractCents(cents(5000), cents(1000))).toBe(4000);
  });

  it('multiplica por una cantidad entera', () => {
    expect(multiplyCents(cents(4000), 3)).toBe(12000);
  });

  it('rechaza multiplicar por un factor no entero', () => {
    expect(() => multiplyCents(cents(4000), 1.5)).toThrow(TypeError);
  });

  it('clampToZero nunca devuelve negativo', () => {
    expect(clampToZero(-500)).toBe(0);
    expect(clampToZero(500)).toBe(500);
  });
});

describe('Porcentajes en centésimas de punto', () => {
  it('aplica el 10 % (1000)', () => {
    expect(applyPercentage(cents(10000), 1000)).toBe(1000);
  });

  it('aplica el 7,7 % (770) — el ahorro real del kit', () => {
    // Suma individual 13000, kit 12000 => 1000 de ahorro sobre 13000 = 7,69 %
    expect(applyPercentage(cents(13000), 770)).toBe(1001);
  });

  it('redondea hacia abajo, nunca cobra de más', () => {
    expect(applyPercentage(cents(999), 1000)).toBe(99); // 99.9 -> 99
  });

  it('rechaza porcentajes fuera de rango', () => {
    expect(() => applyPercentage(cents(1000), 15000)).toThrow(RangeError);
    expect(() => applyPercentage(cents(1000), -1)).toThrow(RangeError);
  });
});

describe('Formateo', () => {
  it('formatea en USD', () => {
    const formatted = formatMoney(cents(5000));
    expect(formatted).toContain('50');
    expect(formatted).toMatch(/\$/);
  });

  it('siempre con dos decimales', () => {
    expect(formatMoney(cents(4000))).toMatch(/40[.,]00/);
  });
});

describe('Porcentaje de ahorro — decisión aprobada', () => {
  const now = new Date('2026-08-03T12:00:00Z');
  const started = new Date('2026-08-01T00:00:00Z');
  const ends = new Date('2026-08-31T00:00:00Z');

  it('NO muestra ahorro sin precio anterior', () => {
    expect(savingsPercentage(cents(5000), null, started, ends, now)).toBeNull();
  });

  it('NO muestra ahorro sin ventana de vigencia — el caso del sitio actual', () => {
    // Los 8 productos de Shopify tienen compare_at_price permanente, sin fechas.
    expect(savingsPercentage(cents(5000), cents(6000), null, null, now)).toBeNull();
  });

  it('NO muestra ahorro fuera de la ventana', () => {
    const past = new Date('2026-07-01T00:00:00Z');
    expect(savingsPercentage(cents(5000), cents(6000), started, ends, past)).toBeNull();
  });

  it('NO muestra ahorro si el precio anterior no es mayor', () => {
    expect(savingsPercentage(cents(5000), cents(5000), started, ends, now)).toBeNull();
  });

  it('SÍ muestra ahorro con precio anterior real y vigente', () => {
    expect(savingsPercentage(cents(5000), cents(6000), started, ends, now)).toBe(17);
  });
});
