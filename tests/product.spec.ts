import { expect, test } from "@playwright/test";

test.describe("public landing", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("vidzo-theme", "dark"));
  });

  test("renders the supplied logo and readable dark dashboard preview", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("/");

    const logo = page.getByRole("img", { name: "Vidzo" }).first();
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("src", "/vidzo-logo.png");

    const dashboard = page.locator(".dashboard-preview");
    await dashboard.scrollIntoViewIfNeeded();
    await expect(dashboard.getByText("Welcome back, Aman")).toBeVisible();
    await expect(dashboard.getByText("Content Quality", { exact: false })).toBeVisible();
    await expect
      .poll(() =>
        dashboard.locator("> div").evaluate((node) => getComputedStyle(node).gridTemplateColumns),
      )
      .toMatch(/^220px /);

    const dashboardContent = page.locator(".dashboard-preview > div > div").last();
    await expect
      .poll(() => dashboardContent.evaluate((node) => getComputedStyle(node).backgroundColor))
      .toBe("rgb(9, 13, 22)");

    const qualityCard = dashboard.getByText("Content Quality", { exact: false }).locator("..");
    await expect
      .poll(() => qualityCard.evaluate((node) => getComputedStyle(node).color))
      .not.toBe("rgb(255, 255, 255)");

    await dashboard.screenshot({
      path: "test-results/landing-dashboard-dark.png",
    });
    await page.screenshot({
      path: "test-results/landing-dark-desktop.png",
      fullPage: true,
    });
    expect(pageErrors).toEqual([]);
  });

  test("does not overflow on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("img", { name: "Vidzo" }).first()).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);

    await page.screenshot({
      path: "test-results/landing-dark-mobile.png",
      fullPage: true,
    });
  });

  test("uses email-only Supabase authentication", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in", exact: true }).first().click();
    await expect(page.getByText("Continue with Google")).toHaveCount(0);
    await page.getByRole("button", { name: "Create an account" }).click();
    await expect(page.locator("#dlg-name")).toBeVisible();
    await expect(page.locator("#dlg-email")).toBeVisible();
    await expect(page.locator("#dlg-pass")).toBeVisible();
  });
});

test("content engine health endpoint is protected", async ({ request }) => {
  const response = await request.get("/api/chat");
  expect(response.status()).toBe(401);
});

test("authenticated prompt shows thinking state and returns a content pack", async ({ page }) => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD || process.env.E2E_LIVE_AI !== "1",
    "QA credentials and an OpenAI key with available quota are required",
  );

  const pageErrors: string[] = [];
  const chatFailures: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("[chat]")) {
      chatFailures.push(message.text());
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).first().click();
  await page.locator("#dlg-email").fill(process.env.E2E_EMAIL!);
  await page.locator("#dlg-pass").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await page.waitForURL(/\/chat\/dashboard/, { timeout: 30_000 });

  const prompt =
    "Create a concise 20-second reel script about three practical opening hooks for small brands. Do not research current events.";
  await page.goto(`/chat/new?prompt=${encodeURIComponent(prompt)}`);

  await expect(page.getByText("Supabase AI is configured")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Vidzo is thinking")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Building one structured 9:16 pack")).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Script & voice")).toBeVisible({ timeout: 90_000 });
  await expect(page.getByText("1 AI request")).toBeVisible();
  await expect(page.getByText("9:16", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: "Scenes" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Thumbnail" })).toBeVisible();

  await page.getByRole("tab", { name: "Thumbnail" }).click();
  await expect(page.getByText("9:16 · 1080×1920")).toBeVisible();

  await page.screenshot({
    path: "test-results/chat-content-pack.png",
    fullPage: true,
  });
  expect(pageErrors).toEqual([]);
  expect(chatFailures).toEqual([]);
});

test("persisted chat output is organized and vertical-first", async ({ page }) => {
  test.skip(
    !process.env.E2E_EMAIL || !process.env.E2E_PASSWORD || !process.env.E2E_SEEDED_THREAD_ID,
    "Seeded QA content is required",
  );

  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).first().click();
  await page.locator("#dlg-email").fill(process.env.E2E_EMAIL!);
  await page.locator("#dlg-pass").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await page.waitForURL(/\/chat\/dashboard/, { timeout: 30_000 });
  await page.goto(`/chat/${process.env.E2E_SEEDED_THREAD_ID}`);

  await expect(page.getByText("Supabase AI is configured")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("tab", { name: "Script & voice" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Scenes" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Thumbnail" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Publish" })).toBeVisible();
  await expect(page.getByText("1 AI request")).toBeVisible();

  await page.getByRole("tab", { name: "Thumbnail" }).click();
  await expect(page.getByText("9:16 · 1080×1920")).toBeVisible();
  await page.screenshot({
    path: "test-results/chat-content-pack.png",
    fullPage: true,
  });
});
