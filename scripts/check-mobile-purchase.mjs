/** Local browser check. Checkout is intercepted; no order or payment is created.
 * node scripts/check-mobile-purchase.mjs [http://localhost:3000]
 */
import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const baseURL = process.argv[2] ?? "http://localhost:3000";
const output = ".visual-check/mobile-purchase";
const slug = "aceite-anti-estrias";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();

try {
  for (const { width, locale } of [
    { width: 320, locale: "es" },
    { width: 390, locale: "es" },
    { width: 390, locale: "en" },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    // The error path must recover without sending anything to the real checkout.
    let checkoutAttempts = 0;
    await page.route("**/api/checkout", async (route) => {
      checkoutAttempts += 1;
      await route.fulfill({
        status: 503,
        json: { error: "simulated_unavailable" },
      });
    });

    await page.goto(`${baseURL}/${locale}/products/${slug}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await expect(page.locator('a[href^="https://wa.me"]:visible')).toHaveCount(1);
    const logoBox = await page.locator('header .brand-logo-link').boundingBox();
    const searchBox = await page.locator('header').getByRole('link', { name: locale === 'es' ? 'Buscar' : 'Search', exact: true }).boundingBox();
    expect(logoBox.x + logoBox.width).toBeLessThanOrEqual(searchBox.x);
    const purchase = page.getByRole("region", {
      name: locale === "es" ? "Comprar producto" : "Product purchase",
    });
    await expect(purchase).toBeVisible();
    await expect(purchase.getByRole("button")).toBeEnabled();
    await page.screenshot({ path: `${output}/product-${locale}-${width}.png` });

    // Exercise both entry points: the fixed bar and the main product action.
    if (width === 320) {
      await page
        .getByRole("button", { name: /Añadir Aceite Anti-Estrías a tu bolsa/ })
        .first()
        .click();
    } else {
      await purchase.getByRole("button").click();
    }
    const viewBag = purchase.getByRole("link", {
      name: locale === "es" ? "Ver bolsa" : "View bag",
    });
    await expect(viewBag).toBeVisible();
    if (width !== 320) await expect(viewBag).toBeFocused();
    await expect
      .poll(() =>
        page.evaluate(
          () => JSON.parse(localStorage.getItem("gaviota.bag.v1"))[0].quantity,
        ),
      )
      .toBe(1);
    await page.reload();
    await expect(viewBag).toBeVisible();
    await viewBag.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/cart$`));

    const decrease = page.getByRole("button", {
      name: locale === "es" ? /Reducir / : /Decrease /,
    });
    const increase = page.getByRole("button", {
      name: locale === "es" ? /Aumentar / : /Increase /,
    });
    await expect(decrease).toBeDisabled();
    const lineTotal = page.getByText(
      locale === "es" ? /Total del producto:/ : /Item total:/,
    );
    await expect(lineTotal).toBeVisible();
    const singleItemTotal = await lineTotal.textContent();
    if (await increase.isEnabled()) {
      await increase.click();
      await expect(decrease).toBeEnabled();
      await expect(lineTotal).not.toHaveText(singleItemTotal);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("gaviota.bag.v1"))[0].quantity,
          ),
        )
        .toBe(2);
      await decrease.click();
      await expect(decrease).toBeDisabled();
      await expect(lineTotal).toHaveText(singleItemTotal);
    }

    const checkout = page.getByRole("button", {
      name: locale === "es" ? "Ir a pagar" : "Checkout",
      exact: true,
    });
    await checkout.click();
    await expect(
      page
        .getByRole("alert")
        .filter({
          hasText: locale === "es" ? "Inténtalo de nuevo" : "Please try again",
        }),
    ).toBeVisible();
    await expect(checkout).toBeEnabled();
    expect(checkoutAttempts).toBe(1);
    await page.screenshot({
      path: `${output}/cart-${locale}-${width}.png`,
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);

    // An existing bag can contain too many units; increasing must be blocked.
    await page.evaluate((productSlug) => {
      localStorage.setItem(
        "gaviota.bag.v1",
        JSON.stringify([{ slug: productSlug, quantity: 99 }]),
      );
      window.dispatchEvent(new Event("gaviota:bag"));
    }, slug);
    await expect(increase).toBeDisabled();
    await expect(decrease).toBeEnabled();
    await page
      .getByRole("button", {
        name: locale === "es" ? "Quitar" : "Remove",
        exact: true,
      })
      .click();
    await expect(
      page.getByText(
        locale === "es" ? "Tu bolsa está vacía." : "Your bag is empty.",
      ),
    ).toBeVisible();
    expect(errors).toEqual([]);
    console.log(
      `${locale} ${width}px: add, persistence, bag, quantities, checkout recovery, remove OK`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
