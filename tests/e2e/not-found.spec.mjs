import { expect, test } from "@playwright/test";

test("URL sai nhiều cấp trả HTTP 404 và tải được giao diện chung", async ({ page }) => {
  const errors = [];
  const missingAssets = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (response.status() >= 400 && response.request().resourceType() !== "document") {
      missingAssets.push(new URL(response.url()).pathname);
    }
  });

  const response = await page.goto("/duong-dan-khong-ton-tai/nhieu/cap");
  expect(response.status()).toBe(404);
  await expect(page).toHaveTitle("Không tìm thấy trang | Việt Ký");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Không tìm thấy trang");
  await expect(page.locator(".vk-header[data-initialized]")).toBeVisible();
  await expect(page.locator(".site-footer")).toBeAttached();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  expect(errors).toEqual([]);
  expect(missingAssets).toEqual([]);

  await page.getByRole("main").getByRole("link", { name: "Về trang chủ" }).click();
  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle("Việt Ký");
});

test("404 vẫn có lối về khi JavaScript tắt", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("http://127.0.0.1:4173/trang-khong-ton-tai");
  expect(response.status()).toBe(404);
  await page.getByRole("link", { name: "Về trang chủ" }).click();
  await expect(page).toHaveURL("http://127.0.0.1:4173/");
  await context.close();
});

test("404 trên điện thoại không tràn ngang và có thể trở về trang chủ", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/trang-khong-ton-tai");
  await expect(page.getByRole("main").getByRole("link", { name: "Về trang chủ" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("main").getByRole("link", { name: "Về trang chủ" }).click();
  await expect(page).toHaveURL("/");
});

test("Khung 404 luôn hiển thị và không khóa thao tác trên trang", async ({ page }) => {
  await page.goto("/404");
  const panel = page.getByRole("region", { name: "Không tìm thấy trang", exact: true });
  await expect(panel).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const search = page.getByRole("searchbox", { name: "Tìm kiếm trong Việt Ký" });
  await search.fill("Trần");
  await expect(search).toHaveValue("Trần");
  await page.keyboard.press("Escape");
  await expect(panel).toBeVisible();
});
