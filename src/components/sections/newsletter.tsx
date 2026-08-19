import { Container, Rule, Section } from '@/components/ui/layout-primitives';
import { Reveal } from '@/components/ui/reveal';
import { getSection } from '@/lib/content/sections';
import { pick, type Locale } from '@/lib/i18n';

/**
 * Newsletter.
 *
 * Propuesta de valor concreta, no "suscríbete a nuestro boletín": se dice qué
 * llega y cada cuánto, en la medida en que se puede afirmar hoy. No se promete
 * descuento de bienvenida porque no existe ninguno aprobado.
 *
 * El formulario permanece oculto hasta que existan persistencia y rate limit.
 * Mostrar un campo que termina en una API inexistente sería una interacción
 * engañosa. El CTA temporal usa el canal oficial y funcional de la marca.
 */
export async function Newsletter({ locale }: { locale: Locale }) {
  const c = await getSection('home.newsletter', locale);
  if (!c) return null;

  return (
    <Section tone="ivory" labelledBy="newsletter-title">
      <Container size="narrow">
        <Reveal className="text-center">
          {c.eyebrow ? <p className="eyebrow mb-3 text-rose">{c.eyebrow}</p> : null}

          <h2 id="newsletter-title" className="text-h2">
            {c.title}
          </h2>

          <Rule className="mx-auto my-7 max-w-24" />

          {c.body ? (
            <p className="mx-auto max-w-md text-lead leading-relaxed text-body">{c.body}</p>
          ) : null}

          <a
            href="https://www.instagram.com/gaviotabylia/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex min-h-12 items-center rounded-xs bg-rose px-7 text-sm font-semibold tracking-[0.02em] text-white-warm transition-colors duration-300 hover:bg-rose-deep"
          >
            {pick(locale, 'Follow updates on Instagram', 'Seguir novedades en Instagram')}
          </a>
        </Reveal>
      </Container>
    </Section>
  );
}
