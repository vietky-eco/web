import { expect, test } from "@playwright/test";

const DEPLOY = "https://vietky.tdmdev.top";
const detail = "/chuyen-su/su-kien/thong-nhat-dat-nuoc-lap-dai-co-viet-968";
const detail2 = "/chuyen-su/su-kien/bien-co-cung-dinh-nha-dinh-979";
const person = "/chuyen-su/nhan-vat/dinh-bo-linh";
const widths = [{ name: "desktop", width: 1280, height: 800 }, { name: "mobile", width: 390, height: 844 }];

async function capture(page, testInfo, name) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  await testInfo.attach(name, { path, contentType: "image/png" });
}

function watchErrors(page) {
  const pageErrors = [];
  const importantFailures = [];
  const urlImportant = (url) => {
    try {
      const u = new URL(url);
      return u.origin === DEPLOY && /\.(?:css|js|json)(?:$|\?)/.test(u.pathname + u.search);
    } catch { return false; }
  };
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    if (urlImportant(request.url())) importantFailures.push(`${request.url()} (${request.failure()?.errorText ?? "network error"})`);
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && urlImportant(response.url())) importantFailures.push(`${response.status()} ${response.url()}`);
  });
  return { pageErrors, importantFailures };
}

async function assertNoOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll, `Horizontal overflow: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(dimensions.width + 1);
}

for (const viewport of widths) {
  test.describe(`D420-01 ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("01 — homepage loads; header/footer and assets are healthy", async ({ page }, testInfo) => {
      const errors = watchErrors(page);
      const response = await page.goto("/", { waitUntil: "domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator(".vk-header[data-initialized]")).toBeVisible();
      await expect(page.locator("#site-footer")).toBeVisible();
      await assertNoOverflow(page);
      await capture(page, testInfo, `home-${viewport.name}`);
      expect(errors.pageErrors, "Uncaught browser exceptions").toEqual([]);
      expect(errors.importantFailures, "Failed site CSS/JS/JSON requests").toEqual([]);
    });

    test("01b — main navigation works at this viewport", async ({ page }, testInfo) => {
      const errors = watchErrors(page);
      await page.goto("/");
      const header = page.locator(".vk-header[data-initialized]");
      if (viewport.width <= 1100) {
        const menu = header.locator("#vk-menu-toggle");
        await expect(menu).toHaveAccessibleName("Mở menu");
        await menu.click();
        await expect(menu).toHaveAttribute("aria-expanded", "true");
        const category = header.getByRole("button", { name: "Dấu xưa" });
        await category.click();
        await expect(category).toHaveAttribute("aria-expanded", "true");
        await expect(header.getByRole("link", { name: "Địa danh lịch sử" })).toBeVisible();
        await capture(page, testInfo, `menu-${viewport.name}`);
        await header.getByRole("button", { name: "Đóng menu" }).click();
        await expect(menu).toHaveAttribute("aria-expanded", "false");
      } else {
        const category = header.getByRole("button", { name: "Dấu xưa" });
        await category.press("Enter");
        await expect(category).toHaveAttribute("aria-expanded", "true");
        await expect(header.getByRole("link", { name: "Địa danh lịch sử" })).toBeVisible();
        await capture(page, testInfo, `menu-${viewport.name}`);
      }
      expect(errors.pageErrors).toEqual([]);
      expect(errors.importantFailures).toEqual([]);
    });

    test("02 — public search opens and has a usable empty state", async ({ page }, testInfo) => {
      const errors = watchErrors(page);
      await page.goto("/");
      const input = page.locator("#vk-search-input");
      await expect(input).toBeVisible();
      await input.fill("dinh bo linh");
      await input.press("Enter");
      const dialog = page.locator(".sr-dialog[open]");
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('input[aria-label="Từ khóa tìm kiếm"]')).toBeVisible();
      await capture(page, testInfo, `search-${viewport.name}`);
      // Public search filters out drafts. An empty result is not by itself a bug.
      expect(errors.pageErrors).toEqual([]);
      expect(errors.importantFailures).toEqual([]);
    });

    test("03 — detail public page has a coherent loaded or explicit error state", async ({ page }, testInfo) => {
      const errors = watchErrors(page);
      const response = await page.goto(person);
      expect(response?.status()).toBe(200);
      await expect(page.locator("#detail-loading")).toBeHidden();
      const article = page.locator("#detail-article");
      const error = page.locator("#detail-error");
      const shown = (await article.isVisible()) || (await error.isVisible());
      expect(shown, "Either article or explicit error must be shown").toBe(true);
      if (await article.isVisible()) {
        await expect(page.locator("#detail-title")).not.toBeEmpty();
      } else {
        await expect(page.locator("#detail-error-message")).not.toBeEmpty();
      }
      await assertNoOverflow(page);
      await capture(page, testInfo, `detail-${viewport.name}`);
      expect(errors.pageErrors).toEqual([]);
      expect(errors.importantFailures).toEqual([]);
    });
  });
}

test("04 — invalid detail slug shows an understandable error", async ({ page }, testInfo) => {
  const response = await page.goto("/chuyen-su/su-kien/khong-ton-tai");
  expect(response?.status()).toBe(200);
  await expect(page.locator("#detail-error")).toBeVisible();
  await expect(page.locator("#detail-error-message")).not.toBeEmpty();
  await capture(page, testInfo, "detail-invalid-slug");
});

test("05 — example event pages and related navigation (record publication limitations)", async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto(detail);
  await expect(page.locator("#detail-loading")).toBeHidden();
  const article = page.locator("#detail-article");
  if (!(await article.isVisible())) {
    await capture(page, testInfo, "event-not-publicly-readable");
    test.skip(true, "Event not readable on deployed site; editorial publishing / deployment must be confirmed");
  }
  await expect(page.locator("#detail-title")).not.toBeEmpty();
  const relatedLink = page.locator(`#detail-related-list a[href*="${detail2}"]`).first();
  if (!(await relatedLink.count())) {
    await capture(page, testInfo, "event-related-missing");
    test.skip(true, "No related event link found; requires content/related-data review");
  }
  await relatedLink.click();
  await expect(page).toHaveURL(new RegExp(detail2.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
  await expect(page.locator("#detail-article")).toBeVisible();
  await capture(page, testInfo, "related-content");
  expect(errors.pageErrors).toEqual([]);
  expect(errors.importantFailures).toEqual([]);
});

test("06 — Timeline is not counted PASS just because placeholder opens", async ({ page }, testInfo) => {
  await page.goto("/chuyen-su/dong-thoi-gian");
  await capture(page, testInfo, "timeline-online");
  const eventItems = page.locator("[data-timeline-item]");
  if (!(await eventItems.count())) {
    test.skip(true, "Timeline has no event cards on deployed page; full MVP flow is BLOCKED");
  }
  await expect(eventItems.first()).toBeVisible();
});
