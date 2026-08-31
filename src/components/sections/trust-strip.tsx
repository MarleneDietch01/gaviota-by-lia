import { ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Container, Section } from '@/components/ui/layout-primitives';
import { pick, type Locale } from '@/lib/i18n';

/**
 * Puntos de confianza reales — mismos datos que ya se muestran en la ficha de
 * producto (`src/app/[lang]/products/[slug]/page.tsx`). Centralizados aquí
 * para que el home y la ficha de producto nunca diverjan sobre qué se
 * promete (envío, seguridad, propósito), en vez de mantener dos copias.
 */
export function getTrustPoints(locale: Locale) {
  return [
    {
      icon: ShieldCheck,
      title: pick(locale, 'Secure purchase', 'Compra segura'),
      body: pick(locale, 'Protected checkout', 'Pago protegido'),
    },
    {
      icon: Truck,
      title: pick(locale, 'Tracked shipping', 'Envíos con seguimiento'),
      body: pick(locale, 'Estimated 5–6 business days', 'Estimado: 5–6 días hábiles'),
    },
    {
      icon: Sparkles,
      title: pick(locale, 'Made for ritual', 'Hecho para tu ritual'),
      body: pick(locale, 'Body care, at your pace', 'Cuidado corporal a tu ritmo'),
    },
  ] as const;
}

/**
 * Franja de confianza — discreta a propósito. Va justo debajo del Hero: es el
 * primer refuerzo de credibilidad que ve la clienta, antes de pedirle nada.
 * `tone="powder"` para no repetir el marfil del Hero ni el blanco de
 * Beneficios, que la sigue.
 */
export function TrustStrip({ locale }: { locale: Locale }) {
  const points = getTrustPoints(locale);

  return (
    <Section tone="powder" padding="tight" labelledBy="trust-strip-heading">
      <Container>
        <h2 id="trust-strip-heading" className="sr-only">
          {pick(locale, 'Why shop with us', 'Por qué comprar con nosotras')}
        </h2>
        <ul className="grid gap-5 sm:grid-cols-3 sm:gap-6">
          {points.map((point) => {
            const Icon = point.icon;
            return (
              <li
                key={point.title}
                className="trust-point flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left"
              >
                <Icon className="size-5 shrink-0 text-rose-deep" aria-hidden="true" />
                <div>
                  <p className="text-meta font-semibold leading-snug text-ink">{point.title}</p>
                  <p className="text-caption leading-snug text-body">{point.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
