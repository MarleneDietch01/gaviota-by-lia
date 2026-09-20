import { Container, Section, SectionHeader } from '@/components/ui/layout-primitives';
import { getFaqItems } from '@/lib/content/faq-items';
import { getSection } from '@/lib/content/sections';
import Link from 'next/link';
import { localizedHref, pick, type Locale } from '@/lib/i18n';

/** Answers come from the same content as the help page. */
export async function Faq({ locale }: { locale: Locale }) {
  const c = await getSection('home.faq', locale);
  const items = getFaqItems();
  if (!c || items.length === 0) return null;

  return (
    <Section tone="white" padding="compact" labelledBy="faq-title">
      <Container size="narrow">
        <SectionHeader id="faq-title" eyebrow={c.eyebrow} title={c.title ?? ''} />

        <div className="divide-y divide-line">
          {items.map((item) => (
            <details key={pick(locale, item.question.en, item.question.es)} className="group py-4">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-left text-body-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {pick(locale, item.question.en, item.question.es)}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg text-gold-deep transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-body">
                {pick(locale, item.answer.en, item.answer.es)}
              </p>
            </details>
          ))}
        </div>
        <Link href={localizedHref(locale, '/faq')} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-gold-deep underline underline-offset-4">
          {pick(locale, 'More help with your order', 'Más ayuda con tu compra')}
        </Link>
      </Container>
    </Section>
  );
}
