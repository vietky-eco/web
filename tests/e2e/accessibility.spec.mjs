import { expect, test } from "@playwright/test";

// IE104-79: smoke tests cho bàn phím / tên truy cập / reduced motion.
// Chạy trên localhost với cấu hình Playwright hiện có của Việt Ký.
const detailPath = "/chuyen-su/su-kien/thong-nhat-dat-nuoc-lap-dai-co-viet-968";

async function loadHeader(page) {
  await page.goto("/");
  const header = page.locator(".vk-header[data-initialized]");
  await expect(header).toBeVisible();
  return header;
}

test("A11Y-01: dropdown desktop mở bằng bàn phím và Escape trả focus", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const header = await loadHeader(page);
  const trigger = header.getByRole("button", { name: "Dấu xưa" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(header.getByRole("link", { name: "Địa danh lịch sử" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("A11Y-02: menu mobile giữ focus trong dialog và trả về nút mở", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const header = await loadHeader(page);
  const trigger = header.getByRole("button", { name: "Mở menu" });
  await trigger.focus();
  await trigger.press("Enter");
  const panel = header.locator("#vk-menu-panel");
  await expect(panel).toHaveAttribute("role", "dialog");
  await expect(panel).toHaveAttribute("aria-modal", "true");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(header.getByRole("button", { name: "Đóng menu" })).toBeFocused();

  // Sau nhiều lần Tab, focus vẫn thuộc menu (không thoát ra nội dung nền).
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(await panel.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(panel).not.toHaveClass(/vk-mobile-open/);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("A11Y-03: Search dialog có tên, focus đầu vào và hoàn nguyên sau Escape", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const header = await loadHeader(page);
  const navbarInput = header.getByRole("searchbox", { name: "Tìm kiếm trong Việt Ký" });
  await navbarInput.fill("dinh bo linh");
  await navbarInput.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Tra cứu Việt Ký" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("searchbox", { name: "Từ khóa tìm kiếm" })).toBeFocused();
  // Trên desktop Escape trước tiên có thể đóng bộ lọc, lần thứ hai đóng dialog.
  await page.keyboard.press("Escape");
  if (await dialog.isVisible()) await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(navbarInput).toBeFocused();
});

test("A11Y-04: các nút/ô nhập hiển thị đều có accessible name", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await loadHeader(page);
  // Phát hiện nhanh phần tử thiếu nhãn; các trường hợp phức tạp cần audit thủ công.
  const missing = await page.locator("button, input, select, textarea").evaluateAll((nodes) => nodes
    .filter((el) => el.getClientRects().length > 0 && !el.closest("[inert]") && !el.disabled)
    .filter((el) => {
      const label = el.getAttribute("aria-label") ||
        (el.getAttribute("aria-labelledby") || "").split(/\s+/).map((id) => document.getElementById(id)?.textContent || "").join(" ") ||
        (el.labels ? [...el.labels].map((node) => node.textContent).join(" ") : "") ||
        (el.tagName === "BUTTON" ? el.textContent : "") ||
        el.getAttribute("title") || "";
      return !label.trim();
    })
    .map((el) => el.outerHTML.slice(0, 180)));
  expect(missing, `Phần tử có thể thao tác nhưng thiếu accessible name: ${missing.join(" | ")}`).toEqual([]);
});

test("A11Y-05: Detail có cấu trúc heading, link nguồn và skip-link", async ({ page }) => {
  await page.goto(detailPath);
  const article = page.locator("#detail-article");
  await expect(article).toBeVisible();
  await expect(article.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveCount(1);
  const skip = page.getByRole("link", { name: "Đến nội dung chính" });
  await expect(skip).toHaveAttribute("href", "#main-content");
  await expect(page.locator("#detail-source-list a").first()).toHaveAttribute("href", /^https?:\/\//);
});

test("A11Y-06: ưu tiên giảm chuyển động không làm mất thao tác menu", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 800 });
  const header = await loadHeader(page);
  const trigger = header.getByRole("button", { name: "Dấu xưa" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(header.getByRole("link", { name: "Địa danh lịch sử" })).toBeVisible();
  const durations = await trigger.evaluate((el) => {
    const style = getComputedStyle(el);
    return [style.animationDuration, style.transitionDuration];
  });
  expect(durations.every((value) => value.split(",").every((v) => parseFloat(v) === 0 || v.trim() === "none"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
