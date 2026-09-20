import { ROUTE_PAGES } from '@/lib/content/route-pages';

/** Shared with /faq so the home never publishes a different policy. */
export function getFaqItems() {
  return (ROUTE_PAGES.faq?.sections ?? []).map(({ heading, body }) => ({
    question: heading,
    answer: {
      en: body.map((paragraph) => paragraph.en).join(' '),
      es: body.map((paragraph) => paragraph.es).join(' '),
    },
  }));
}
