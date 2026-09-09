import Link from "next/link";
import { BadgeCheck, MessageCircle } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { localizedHref, pick, type Locale } from "@/lib/i18n";
import { Container, Rule, Section } from "@/components/ui/layout-primitives";
import { Stars } from "@/components/ui/stars";

const HOME_REVIEW_LIMIT = 3;

/** Reseñas reales y aprobadas. Si todavía no existen, no deja un bloque vacío. */
export async function HomeReviews({ locale }: { locale: Locale }) {
  const supabase = await createServerSupabaseClient();
  const { data: reviews } = await supabase
    .from("reviews")
    .select(
      "id, rating, title, content, verified_purchase, created_at, products:product_id(name, slug)",
    )
    .eq("status", "approved")
    .order("verified_purchase", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(HOME_REVIEW_LIMIT);

  if (!reviews?.length) return null;

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <Section tone="white" labelledBy="home-reviews-title">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <header className="max-w-md">
            <p className="eyebrow text-gold-deep">
              {pick(locale, "Real experiences", "Experiencias reales")}
            </p>
            <h2 id="home-reviews-title" className="mt-4 text-h2">
              {pick(
                locale,
                "What our customers say.",
                "Lo que cuentan nuestras clientas.",
              )}
            </h2>
            <p className="mt-5 flex items-center gap-3 text-body">
              <Stars rating={Math.round(average)} size="size-5" />
              <span className="tabular font-semibold text-ink">
                {average.toFixed(1)} / 5
              </span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-body">
              {pick(
                locale,
                "Recent reviews approved by Gaviota by Lia. Verified purchases are identified.",
                "Reseñas recientes aprobadas por Gaviota by Lia. Las compras verificadas están identificadas.",
              )}
            </p>
            <Rule className="mt-8 max-w-32" />
          </header>

          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="flex min-h-64 flex-col rounded-sm border border-line bg-ivory p-6 shadow-subtle"
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars rating={review.rating} />
                  <span className="sr-only">{review.rating} de 5</span>
                  <MessageCircle
                    className="size-5 text-champagne"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
                {review.title ? (
                  <h3 className="mt-5 font-sans text-base font-semibold text-ink">
                    {review.title}
                  </h3>
                ) : null}
                <p className="mt-3 line-clamp-2x text-body-sm leading-relaxed text-body">
                  {review.content}
                </p>
                <div className="mt-auto pt-6">
                  {review.verified_purchase ? (
                    <p className="mb-2 flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.08em] text-success">
                      <BadgeCheck className="size-4" aria-hidden="true" />
                      {pick(locale, "Verified purchase", "Compra verificada")}
                    </p>
                  ) : null}
                  {review.products ? (
                    <Link
                      href={localizedHref(
                        locale,
                        `/products/${review.products.slug}`,
                      )}
                      className="text-sm font-semibold text-gold-deep underline decoration-gold-deep/30 underline-offset-4 hover:text-gold-ink"
                    >
                      {review.products.name}
                    </Link>
                  ) : null}
                  <p className="mt-2 text-xs capitalize text-muted">
                    {new Intl.DateTimeFormat(
                      locale === "es" ? "es-DO" : "en-US",
                      { month: "long", year: "numeric" },
                    ).format(new Date(review.created_at))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
