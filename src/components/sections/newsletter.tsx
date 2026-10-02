import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { NewsletterForm } from '@/components/subscriptions/subscribe-forms';
import { getSection } from '@/lib/content/sections';
import { pick, type Locale } from '@/lib/i18n';

/**
 * Newsletter.
 *
 * Propuesta de valor concreta, no "suscríbete a nuestro boletín": se dice qué
 * llega y cada cuánto, en la medida en que se puede afirmar hoy. No se promete
 * descuento de bienvenida porque no existe ninguno aprobado.
 *
 * Las altas van a `newsletter_subscribers` con límite de intentos (ver
 * `lib/subscriptions/actions.ts`). Instagram queda como enlace secundario.
 */
export async function Newsletter({ locale }: { locale: Locale }) {
  const c = await getSection('home.newsletter', locale);
  if (!c) return null;

  return (
    <Section tone="ivory" padding="compact" labelledBy="newsletter-title">
      <Container size="narrow">
        <Reveal className="text-center">
          {c.eyebrow ? <p className="eyebrow mb-3 text-gold-deep">{c.eyebrow}</p> : null}

          <h2 id="newsletter-title" className="text-h2">
            {c.title}
          </h2>

          <Rule className="mx-auto my-7 max-w-24" />

          {c.body ? (
            <p className="mx-auto max-w-md text-lead leading-relaxed text-body">{c.body}</p>
          ) : null}

          <div className="mt-9">
            <NewsletterForm locale={locale} />
          </div>

          <a
            href="https://www.instagram.com/gaviotabylia/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-gold-deep underline-offset-4 hover:underline"
          >
            {pick(locale, 'Or follow us on Instagram', 'O síguenos en Instagram')}
          </a>
        </Reveal>
      </Container>
    </Section>
  );
}
