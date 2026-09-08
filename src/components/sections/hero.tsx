import { getImageProps } from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { getSection } from "@/lib/content/sections";
import { localizedHref, pick, type Locale } from "@/lib/i18n";
import styles from "./hero.module.css";

/** One responsive picture preserves art direction without duplicate downloads. */
export async function Hero({ locale }: { locale: Locale }) {
  const c = await getSection("home.hero", locale);
  if (!c) return null;

  const alt = pick(
    locale,
    "Model surrounded by hands presenting Gaviota by Lia body care products",
    "Modelo rodeada de manos que presentan productos de cuidado corporal Gaviota by Lia",
  );
  const common = {
    alt,
    quality: 90,
    loading: "eager",
    fetchPriority: "high",
  } as const;
  const desktopSizes = "(min-width: 1440px) 710px, 51vw";
  const compactSizes =
    "(min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)";
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({
    ...common,
    src: "/images/gaviota/hero/hero-products-desktop.jpg",
    width: 2400,
    height: 1667,
    sizes: desktopSizes,
  });
  const {
    props: { srcSet: tabletSrcSet },
  } = getImageProps({
    ...common,
    src: "/images/gaviota/hero/hero-products-tablet.jpg",
    width: 1800,
    height: 1250,
    sizes: compactSizes,
  });
  const {
    props: { srcSet: mobileSrcSet, ...imgProps },
  } = getImageProps({
    ...common,
    src: "/images/gaviota/hero/hero-products-mobile.jpg",
    width: 1400,
    height: 1167,
    sizes: compactSizes,
  });

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.grid}>
        <div className={styles.content}>
          {c.eyebrow ? (
            <p className={`eyebrow hero-rise ${styles.eyebrow}`}>
              <span aria-hidden="true" />
              {c.eyebrow}
            </p>
          ) : null}
          <h1 id="hero-title" className={`hero-rise ${styles.title}`}>
            <span>{pick(locale, "Your skin.", "Tu piel.")}</span>
            <span>
              {pick(locale, "Your ", "Tu ")}
              <em>ritual.</em>
            </span>
            <span>{pick(locale, "Your moment.", "Tu momento.")}</span>
          </h1>
          {c.body ? (
            <p className={`hero-rise ${styles.body}`}>{c.body}</p>
          ) : null}
          <div className={`hero-rise ${styles.actions}`}>
            {c.buttonLabel && c.buttonUrl ? (
              <LinkButton
                href={localizedHref(locale, c.buttonUrl)}
                size="lg"
                className={`${styles.primary}`}
              >
                {c.buttonLabel}
                <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
              </LinkButton>
            ) : null}
            <Link
              href={localizedHref(locale, "/rituals")}
              className={styles.secondary}
            >
              {pick(locale, "Build my ritual", "Crear mi ritual")}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <p className={`hero-rise ${styles.origin}`}>
            <span aria-hidden="true">✳</span>
            {pick(
              locale,
              "Made in the Dominican Republic",
              "Hecho en República Dominicana",
            )}
          </p>
        </div>
        <figure className={styles.visual}>
          <div className={styles.photo}>
            <picture>
              <source
                media="(min-width: 1024px)"
                srcSet={desktopSrcSet}
                sizes={desktopSizes}
              />
              <source
                media="(min-width: 640px)"
                srcSet={tabletSrcSet}
                sizes={compactSizes}
              />
              <img
                {...imgProps}
                alt={alt}
                srcSet={mobileSrcSet}
                className={styles.image}
              />
            </picture>
          </div>
          <figcaption className={styles.caption}>
            <span>
              {pick(
                locale,
                "A little care. A moment for you.",
                "Un poco de cuidado. Un momento para ti.",
              )}
            </span>
            <span aria-hidden="true">Gaviota by Lia</span>
          </figcaption>
        </figure>
      </div>
      <div className={styles.footer}>
        <a href="#collection" className={styles.explore}>
          <span className={styles.down}>
            <ArrowDown className="size-4" aria-hidden="true" />
          </span>
          {pick(locale, "Explore the collection", "Explorar la colección")}
        </a>
        <p>
          {pick(
            locale,
            "Hydrate. Soften. Celebrate your skin.",
            "Hidrata. Suaviza. Celebra tu piel.",
          )}
        </p>
      </div>
    </section>
  );
}
