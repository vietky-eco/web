import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
const catalog = JSON.parse(
  readFileSync(new URL("../../data/catalog.json", import.meta.url)),
);
const search = "/pages/search.html";

test("navbar → suggestions → popup → full search → actual detail", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const input = page.locator("#vk-search-input");
  await input.fill("Bạch Đằng");
  await expect(page.locator(".vk-search-results a").first()).toContainText(
    "Bạch Đằng",
  );
  await input.press("Enter");
  await expect(page.locator(".sr-dialog[open] .sr-result")).toHaveCount(3);
  await page.keyboard.press("Escape");
  await expect(input).toBeFocused();
  await expect(page.locator(".vk-search-results")).toBeHidden();
  await input.press("Enter");
  await page.locator(".sr-dialog-bottom a").click();
  await expect(page.locator("#search-count")).toHaveText("3 kết quả");
  await expect(page.locator("input[type=search]")).toHaveCount(1);
  await expect(page.locator(".sr-result-meta").first()).toContainText(
    "Bản nháp",
  );
  const href = await page
    .locator("#search-results a")
    .first()
    .getAttribute("href");
  const id = new URL(href).searchParams.get("id");
  const expected = catalog.find((item) => item.id === id);
  await page.locator("#search-results a").first().click();
  await expect(page.locator("#detail-title")).toHaveText(expected.title);
  expect(errors).toEqual([]);
});

for (const width of [390, 768, 1024, 1440]) {
  test(`pagination, query reset and responsive at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${search}?q=Trần`);
    await expect(page.locator("#search-results .sr-result")).toHaveCount(6);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("link", { name: "Trang 2", exact: true }).click();
    await expect(page.locator("#search-range")).toContainText("7–9 trong 9");
    await page.reload();
    await expect(
      page.locator("[aria-current=page].search-page-number"),
    ).toHaveText("2");
    await page.goBack();
    await expect(
      page.locator("[aria-current=page].search-page-number"),
    ).toHaveText("1");
    await page.locator("#vk-search-input").fill("bach dang");
    await page.locator("#vk-search-input").press("Enter");
    await expect(page.locator("#search-count")).toHaveText("3 kết quả");
    await expect(page.locator("#search-pagination")).toBeHidden();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });
}

test("type and multi-period filter, unknown years, validation and reset", async ({
  page,
}) => {
  await page.goto(`${search}?q=Bạch%20Đằng&type=place`);
  await expect(page.locator("#search-results .sr-result")).toHaveCount(1);
  await page.locator("#search-filter-open").click();
  await page.locator("#search-period").selectOption("per0002");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.locator("#search-results .sr-result")).toHaveCount(1);
  await expect(page.locator("#search-results")).toContainText("Sông Bạch Đằng");
  await page.locator("#search-filter-open").click();
  await page.locator("#search-from").fill("1300");
  await page.locator("#search-to").fill("1200");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.locator("#search-filter-error")).not.toBeEmpty();
  await page.locator("#search-from").fill("900");
  await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
  await expect(page.locator(".sr-state")).toContainText("Chưa tìm thấy");
  await page.locator(".sr-state button").click();
  await expect(page.locator("#search-count")).toHaveText("3 kết quả");
});

test("loading → error → retry; empty catalog and unmatched query", async ({
  page,
}) => {
  let fail = true;
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  await page.route("**/data/catalog.json", async (route) => {
    await pending;
    if (fail) await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.continue();
  });
  await page.goto(`${search}?q=Bạch%20Đằng`);
  await expect(page.locator(".sr-loading-text")).toBeVisible();
  release();
  await expect(page.locator(".sr-state")).toContainText("Không tải được");
  fail = false;
  await page.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(page.locator("#search-count")).toHaveText("3 kết quả");
  await page.goto(`${search}?q=khongtimthayxyz`);
  await expect(page.locator(".sr-state")).toContainText("Chưa tìm thấy");
  await page.unroute("**/data/catalog.json");
  await page.route("**/data/catalog.json", (route) =>
    route.fulfill({ json: [] }),
  );
  await page.reload();
  await expect(page.locator("#search-count")).toHaveText("0 kết quả");
  await expect(page.locator(".sr-result")).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`filter draft, cancel, preview and removable conditions at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${search}?q=Bạch%20Đằng&sort=year-asc&type=place`);
    await expect(
      page.locator("#search-applied .search-filter-chip"),
    ).toHaveCount(1);
    await page.locator("#search-filter-open").click();
    await page.locator("#search-period").selectOption("per0002");
    await expect(page.locator("#search-filter-preview")).toContainText(
      "1 kết quả",
    );
    await page.locator("#search-filter-cancel").click();
    expect(new URL(page.url()).searchParams.has("period")).toBe(false);
    await page.locator("#search-filter-open").click();
    await expect(page.locator("#search-period")).toHaveValue("");
    await page.locator("#search-period").selectOption("per0004");
    await page.getByRole("button", { name: "Áp dụng", exact: true }).click();
    await expect(
      page.locator("#search-applied .search-filter-chip"),
    ).toHaveCount(2);
    await page
      .locator('#search-applied button[aria-label^="Bỏ lọc Thời kỳ"]')
      .click();
    expect(new URL(page.url()).searchParams.get("type")).toBe("place");
    await page.locator("#search-filter-open").click();
    await page.locator("#search-from").fill("1200");
    await expect(page.locator("#search-filter-preview")).toContainText(
      "0 kết quả",
    );
    await page.locator("#search-filter-clear").click();
    await expect(page.locator("#search-filter-preview")).toContainText(
      "1 kết quả",
    );
    await page.keyboard.press("Escape");
    expect(new URL(page.url()).searchParams.has("from")).toBe(false);
    await page
      .getByRole("button", { name: "Xóa tất cả bộ lọc", exact: true })
      .click();
    await expect(page.locator("#search-count")).toHaveText("3 kết quả");
    await expect(page.locator("#search-applied")).toBeEmpty();
    expect(new URL(page.url()).searchParams.get("q")).toBe("Bạch Đằng");
    expect(new URL(page.url()).searchParams.get("sort")).toBe("year-asc");
    await expect(page.locator("#search-filter-open")).toBeFocused();
  });
}
