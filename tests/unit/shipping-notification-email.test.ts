import { describe, it, expect, vi } from 'vitest';

// Mismo recurso que `checkout.test.ts`: la plantilla lleva `server-only`, que
// fuera de un Server Component lanza al importarse. Se burla el marcador y se
// importa en diferido, para que el `vi.mock` (izado) llegue antes.
vi.mock('server-only', () => ({}));

const { buildShippingNotificationEmail } = await import(
  '@/lib/email/shipping-notification-template'
);

/**
 * El aviso de envío tiene lógica que puede fallar en silencio: el enlace de
 * rastreo de respaldo, el rechazo de esquemas que no son http(s) y el plazo de
 * entrega, que solo puede prometerse para el transportista de la política.
 *
 * Un correo no se renderiza en pantalla antes de salir, así que lo que no se
 * pruebe aquí se descubre en la bandeja de una clienta.
 */

const base = {
  orderNumber: 'GV-2026-000037',
  carrier: 'USPS Priority Mail',
  trackingNumber: '9505511444966248869523',
  trackingUrl: null,
};

describe('Aviso de envío', () => {
  it('lleva el número de rastreo y el pedido en los dos idiomas', () => {
    for (const locale of ['es', 'en'] as const) {
      const { subject, html } = buildShippingNotificationEmail(base, locale);
      expect(html).toContain(base.trackingNumber);
      expect(html).toContain(base.orderNumber);
      expect(subject).toContain(base.orderNumber);
    }

    expect(buildShippingNotificationEmail(base, 'es').subject).toContain('camino');
    expect(buildShippingNotificationEmail(base, 'en').subject).toContain('on its way');
  });

  it('construye el enlace de USPS cuando quien administra no pegó uno', () => {
    const { html } = buildShippingNotificationEmail(base, 'es');
    expect(html).toContain(`https://tools.usps.com/go/TrackConfirmAction?tLabels=${base.trackingNumber}`);
    expect(html).toContain('Seguir mi paquete');
  });

  it('prefiere la URL que escribió quien administra', () => {
    const { html } = buildShippingNotificationEmail(
      { ...base, trackingUrl: 'https://ejemplo.test/rastreo/abc' },
      'es',
    );
    expect(html).toContain('https://ejemplo.test/rastreo/abc');
    expect(html).not.toContain('tools.usps.com');
  });

  it('no enseña botón si el transportista es desconocido y no hay URL', () => {
    const { html } = buildShippingNotificationEmail(
      { ...base, carrier: 'Mensajería local', trackingUrl: null },
      'es',
    );
    expect(html).not.toContain('Seguir mi paquete');
    // El número sigue estando: es lo único que hay, pero es lo importante.
    expect(html).toContain(base.trackingNumber);
  });

  it('descarta un href que no sea http(s) y cae al del transportista', () => {
    const { html } = buildShippingNotificationEmail(
      { ...base, trackingUrl: 'javascript:alert(1)' },
      'es',
    );
    expect(html).not.toContain('javascript:');
    expect(html).toContain('tools.usps.com');
  });

  it('solo promete el plazo de entrega con USPS', () => {
    expect(buildShippingNotificationEmail(base, 'es').html).toContain('3 a 4 días hábiles');
    expect(
      buildShippingNotificationEmail({ ...base, carrier: 'Mensajería local' }, 'es').html,
    ).not.toContain('3 a 4 días hábiles');
  });

  it('escapa el marcado en los datos que teclea quien administra', () => {
    const { html } = buildShippingNotificationEmail(
      { ...base, carrier: '<script>alert(1)</script>Correos & Cía' },
      'es',
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Correos &amp; Cía');
  });
});
