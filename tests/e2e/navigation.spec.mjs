import { expect, test } from "@playwright/test";

test("Đi từ trang chủ đến Địa danh lịch sử qua menu Dấu xưa", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const header = page.locator(".vk-header[data-initialized]");
  await expect(header.getByRole("link", { name: "Trang chủ", exact: true })).toHaveAttribute("aria-current", "page");
  const category = header.getByRole("button", { name: "Dấu xưa" });
  await category.press("Enter");
  await expect(category).toHaveAttribute("aria-expanded", "true");

  await header.getByRole("link", { name: "Địa danh lịch sử" }).click();
  await expect(page).toHaveURL("/dau-xua/dia-danh");
  await expect(page.getByRole("heading", { level: 1, name: "Địa danh lịch sử" })).toBeVisible();
  await expect(header.locator('[data-vk-category="dia-danh"]')).toHaveAttribute("aria-current", "page");

  await page.getByRole("main").getByRole("link", { name: "Di tích & Kiến trúc" }).click();
  await expect(page).toHaveURL("/dau-xua/di-tich");
  await expect(page.getByRole("heading", { level: 1, name: "Di tích & Kiến trúc" })).toBeVisible();
});
