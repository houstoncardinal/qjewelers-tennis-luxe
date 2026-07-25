import { test, expect, type Page } from "@playwright/test";

const cartItem = {
  id: "e2e-product-4mm-18-gold",
  productId: process.env.E2E_PRODUCT_ID ?? "e2e-product",
  slug: process.env.E2E_PRODUCT_SLUG ?? "vvs-moissanite-tennis-bracelet",
  name: "Checkout Test Product",
  color: process.env.E2E_PRODUCT_COLOR ?? "gold",
  size: process.env.E2E_PRODUCT_SIZE ?? "4mm",
  length: process.env.E2E_PRODUCT_LENGTH ?? '8"',
  unitPrice: Number(process.env.E2E_PRODUCT_PRICE ?? "0"),
  quantity: 1,
  image: "/main.jpg",
};

async function seedCart(page: Page) {
  await page.addInitScript((item) => {
    localStorage.setItem("qj_cart_v1", JSON.stringify([item]));
    document.cookie = "qj_cookie_consent=essential; max-age=31536000; path=/; samesite=lax";
  }, cartItem);
}

async function fillDetails(page: Page) {
  await page.locator("#checkout-customer_name").fill("Checkout Test");
  await page.locator("#checkout-customer_email").fill("checkout-test@example.com");
  await page.locator("#checkout-shipping_address_line1").fill("123 Test Street");
  await page.locator("#checkout-shipping_city").fill("Chicago");
  const stateSelect = page.locator("#checkout-shipping_state");
  if (await stateSelect.count()) await stateSelect.selectOption("IL");
  await page.locator("#checkout-shipping_zip").fill("60601");
}

async function fillCard(page: Page, number = "4242424242424242") {
  const frame = page.frameLocator('iframe[title="Secure card payment input frame"]');
  await frame.locator('input[name="cardnumber"]').fill(number);
  await frame.locator('input[name="exp-date"]').fill("1234");
  await frame.locator('input[name="cvc"]').fill("123");
  const postal = frame.locator('input[name="postal"]');
  if (await postal.count()) await postal.fill("60601");
}

test.describe("checkout responsive and recovery behavior", () => {
  test.beforeEach(async ({ page }) => {
    await seedCart(page);
    await page.goto("/checkout");
    const acceptCookies = page.getByRole("button", { name: "Accept All" });
    await acceptCookies.click({ timeout: 3_000 }).catch(() => {});
  });

  test("renders without horizontal overflow on desktop and mobile", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /checkout/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await expect(page.getByText("Checkout Test Product")).toBeVisible();
  });

  test("preserves the cart and entered checkout route across refresh", async ({ page }) => {
    await fillDetails(page);
    await page.reload();
    await expect(page.getByText("Checkout Test Product")).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("qj_cart_v1") ?? "[]").length)).toBe(1);
  });

  test("shows a recoverable error when the checkout request loses the network", async ({ page }) => {
    await fillDetails(page);
    await fillCard(page);
    let checkoutRequestAborted = false;
    await page.route("**/*", async (route) => {
      const request = route.request();
      const isCheckoutRequest =
        request.method() === "POST" &&
        new URL(request.url()).origin === new URL(page.url()).origin;

      if (isCheckoutRequest) {
        checkoutRequestAborted = true;
        await route.abort("failed");
        return;
      }

      await route.continue();
    });
    const payButton = page.getByRole("button", { name: /pay|continue|place order/i }).last();
    await payButton.click();
    await expect.poll(() => checkoutRequestAborted).toBe(true);
    await expect(payButton).toBeEnabled({ timeout: 10_000 });
  });
});

test.describe("Stripe test-mode payment outcomes", () => {
  test.skip(process.env.RUN_PAYMENT_E2E !== "1" || !process.env.E2E_PRODUCT_PRICE, "Requires isolated Stripe test mode and seeded test catalog");

  for (const scenario of [
    { name: "successful card", card: "4242424242424242", expected: /confirmed|thank you/i },
    { name: "declined card", card: "4000000000000002", expected: /declined/i },
    { name: "3DS card", card: "4000002500003155", expected: /authenticate|confirmed|thank you/i },
  ]) {
    test(scenario.name, async ({ page }) => {
      await seedCart(page);
      await page.goto("/checkout");
      const acceptCookies = page.getByRole("button", { name: "Accept All" });
      await acceptCookies.click({ timeout: 3_000 }).catch(() => {});
      await fillDetails(page);
      await fillCard(page, scenario.card);
      await page.getByRole("button", { name: /pay/i }).last().click();
      await expect(page.getByText(scenario.expected)).toBeVisible({ timeout: 30_000 });
    });
  }
});
