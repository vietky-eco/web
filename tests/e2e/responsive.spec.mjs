import { expect, test } from "@playwright/test";

// D417-01 / IE104-78: kiểm thử các trang đã triển khai, không giả định Homepage/Timeline hoàn chỉnh.
const viewports = [
  { name: "mobile-360", width: 360, height: 780 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

const routes = [
  { name: "home-shell", path: "/", ready: "main" },
  { name: "detail-event", path: "/chuyen-su/su-kien/thong-nhat-dat-nuoc-lap-dai-co-viet-968", ready: "#detail-article" },
  { name: "detail-person", path: "/chuyen-su/nhan-vat/dinh-bo-linh", ready: "#detail-article" },
];

async function measureOverflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const width = root.clientWidth;
    const scrollWidth = root.scrollWidth;
    const offenders = [...document.body.querySelectorAll("*")]
      .filter(el => {
        if (el.closest("[hidden]")) return false;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.position === "fixed") return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > width + 2 || r.left < -2);
      })
      .slice(0, 12)
      .map(el => ({
        element: el.tagName.toLowerCase(),
        id: el.id,
        className: typeof el.className === "string" ? el.className.slice(0, 100) : "",
        rect: { left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right) },
      }));
    return { width, scrollWidth, offenders };
  });
}

async function saveScreenshot(page, testInfo, label) {
  const bytes = await page.screenshot({ fullPage: true, animations: "disabled" });
  await testInfo.attach(label, { body: bytes, contentType: "image/png" });
}

async function checkHorizontalOverflow(page, testInfo, label) {
  const result = await measureOverflow(page);
  await testInfo.attach(`${label}-overflow.json`, {
    body: Buffer.from(JSON.stringify(result, null, 2), "utf8"),
    contentType: "application/json",
  });
  expect(result.scrollWidth, `Tràn ngang ${label}: ${JSON.stringify(result.offenders)}`).toBeLessThanOrEqual(result.width + 1);
}

for (const viewport of viewports) {
  test.describe(`Responsive ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of routes) {
      test(`${route.name}: hiển thị, không tràn ngang`, async ({ page }, testInfo) => {
        const errors = [];
        page.on("pageerror", e => errors.push(e.message));
        const response = await page.goto(route.path);
        expect(response?.ok(), `HTTP lỗi tại ${route.path}`).toBe(true);
        await expect(page.locator(".vk-header[data-initialized]")).toBeVisible();
        await expect(page.locator(route.ready)).toBeVisible();
        await saveScreenshot(page, testInfo, `${viewport.name}-${route.name}`);
        await checkHorizontalOverflow(page, testInfo, route.name);
        expect(errors, `Lỗi JavaScript tại ${route.path}`).toEqual([]);
      });
    }

    test("Search dialog: mở được, nội dung không tràn ngang", async ({ page }, testInfo) => {
      await page.goto("/");
      const header = page.locator(".vk-header[data-initialized]");
      await expect(header).toBeVisible();
      const searchButton = header.getByRole("button", { name: "Tìm kiếm", exact: true });
      await expect(searchButton).toBeVisible();
      await searchButton.click();
      const dialog = page.locator(".sr-dialog[open]");
      await expect(dialog).toBeVisible();
      await saveScreenshot(page, testInfo, `${viewport.name}-search-dialog`);
      await checkHorizontalOverflow(page, testInfo, "search-dialog");
      // Đo chính dialog vì scrollWidth trang không phát hiện được mọi phần tử bị cắt trong modal.
      const dialogWidth = await dialog.evaluate(el => ({
        client: el.clientWidth,
        scroll: el.scrollWidth,
        viewport: document.documentElement.clientWidth,
        rect: el.getBoundingClientRect().toJSON(),
      }));
      expect(dialogWidth.rect.left, "Dialog nằm ngoài mép trái").toBeGreaterThanOrEqual(-1);
      expect(dialogWidth.rect.right, "Dialog nằm ngoài mép phải").toBeLessThanOrEqual(dialogWidth.viewport + 1);
      expect(dialogWidth.scroll, "Nội dung dialog tràn ngang").toBeLessThanOrEqual(dialogWidth.client + 1);
    });

    if (viewport.width <= 1100) {
      test("Mobile/tablet menu: mở, đóng, không tràn ngang", async ({ page }, testInfo) => {
        await page.goto("/");
        const header = page.locator(".vk-header[data-initialized]");
        await expect(header).toBeVisible();
        const toggle = header.locator("#vk-menu-toggle");
        await expect(toggle).toBeVisible();
        await toggle.click();
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(header.locator("#vk-menu-panel")).toBeVisible();
        await expect(header.locator("#vk-search-form")).toBeHidden();
        await saveScreenshot(page, testInfo, `${viewport.name}-menu-open`);
        await checkHorizontalOverflow(page, testInfo, "mobile-menu-open");
        await page.keyboard.press("Escape");
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
      });
    }
  });
}
