import { expect, test } from "@playwright/test";

test("Đi từ trang chủ đến Địa danh lịch sử qua menu Dấu xưa", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const header = page.locator(".vk-header[data-initialized]");
  const category = header.getByRole("button", { name: "Dấu xưa" });
  await category.press("Enter");
  await expect(category).toHaveAttribute("aria-expanded", "true");

  await header.getByRole("link", { name: "Địa danh lịch sử" }).click();
  await expect(page).toHaveURL("/pages/dau-xua/places.html");
  await expect(page.getByRole("heading", { level: 1, name: "Địa danh lịch sử" })).toBeVisible();
});
