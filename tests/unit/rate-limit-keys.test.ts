/**
 * Canonización de correos para el limitador de intentos.
 *
 * La prueba central es el primer bloque: las cinco direcciones que un bot usó
 * de verdad contra la tienda en septiembre de 2026. Cada una llevaba los
 * puntos repartidos de otra forma para estrenar contador, y funcionó porque la
 * clave del cubo era la cadena literal.
 *
 * El segundo bloque es el que evita que el arreglo sea peor que el problema:
 * fuera de Gmail el punto SÍ distingue cuentas, y meter a dos personas en el
 * mismo cubo dejaría a una sin poder registrarse porque la otra lo intentó.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { rateLimitEmailKey } = await import('@/lib/security/rate-limit-keys');

describe('rateLimitEmailKey — Gmail', () => {
  it('reduce al mismo cubo las variantes puntuadas que vimos en producción', () => {
    expect(rateLimitEmailKey('connorg.ai.ne.s3.8.0@gmail.com')).toBe(
      'connorgaines380@gmail.com',
    );
    expect(rateLimitEmailKey('a.c.u.ye.mi.wih.ul.24@gmail.com')).toBe(
      'acuyemiwihul24@gmail.com',
    );
    expect(rateLimitEmailKey('e.mxw.iypveq161@gmail.com')).toBe('emxwiypveq161@gmail.com');
  });

  it('agrupa cualquier reparto de puntos del mismo buzón', () => {
    const variantes = [
      'analopez@gmail.com',
      'ana.lopez@gmail.com',
      'a.n.a.l.o.p.e.z@gmail.com',
      'An.a.Lopez@GMAIL.com',
    ];
    const claves = new Set(variantes.map(rateLimitEmailKey));
    expect(claves.size).toBe(1);
  });

  it('descarta la +etiqueta', () => {
    expect(rateLimitEmailKey('ana.lopez+tienda@gmail.com')).toBe('analopez@gmail.com');
  });

  it('trata googlemail.com como gmail.com: es el mismo buzón', () => {
    expect(rateLimitEmailKey('ana.lopez@googlemail.com')).toBe('analopez@gmail.com');
  });
});

describe('rateLimitEmailKey — resto de proveedores', () => {
  it('NO quita los puntos: ahí sí distinguen personas distintas', () => {
    // Si estas dos cayeran en el mismo cubo, un intento fallido de una dejaría
    // a la otra sin poder registrarse. El arreglo sería peor que el ataque.
    expect(rateLimitEmailKey('j.perez@empresa.com')).not.toBe(
      rateLimitEmailKey('jperez@empresa.com'),
    );
  });

  it('sí quita la +etiqueta, que es convención estable', () => {
    expect(rateLimitEmailKey('ana+compras@outlook.com')).toBe('ana@outlook.com');
    expect(rateLimitEmailKey('ana+x@proton.me')).toBe('ana@proton.me');
  });
});

describe('rateLimitEmailKey — entradas límite', () => {
  it('no vacía la parte local cuando el + va al principio', () => {
    // Recortar en un `+` inicial dejaría '@gmail.com' y metería en un mismo
    // cubo a direcciones que no tienen nada que ver.
    expect(rateLimitEmailKey('+raro@gmail.com')).toBe('+raro@gmail.com');
  });

  it('no revienta con una cadena sin arroba', () => {
    expect(rateLimitEmailKey('no-es-un-correo')).toBe('no-es-un-correo');
  });

  it('normaliza mayúsculas y espacios sobrantes', () => {
    expect(rateLimitEmailKey('  ANA@Empresa.COM  ')).toBe('ana@empresa.com');
  });

  it('usa la ÚLTIMA arroba, no la primera', () => {
    expect(rateLimitEmailKey('raro@cosa@gmail.com')).toBe('raro@cosa@gmail.com');
  });
});
