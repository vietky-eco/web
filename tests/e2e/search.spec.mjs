import { expect, test } from "@playwright/test";

const previewHome = "/?preview=1";
const previewAbout = "/gioi-thieu?preview=1";
const navbarInput = "#vk-search-input";
const navbarButton = "#vk-search-form > button[type=submit]";

async function openSearch(page, query) {
  const input = page.locator(navbarInput);
  await input.fill(query);
  await input.press("Enter");
  const popup = page.locator(".sr-dialog[open]");
  await expect(popup).toBeVisible();
  return popup;
}

async function openFilter(popup, key) {
  const toggle = popup.locator("#sr-filter-trigger");
  await expect(toggle).toBeEnabled();
  if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
  const panel = popup.locator(`#sr-filter-${key}`);
  await expect(panel).toBeVisible();
  return panel;
}

test("Search mở đúng Detail và xử lý từ khóa không dấu, vô nghĩa", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(previewHome);
  const popup = await openSearch(page, "dinh bo linh");
  const result = popup.locator('a[href$="/chuyen-su/nhan-vat/dinh-bo-linh"]');
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL("/chuyen-su/nhan-vat/dinh-bo-linh");
  await expect(page.locator("#detail-title")).toHaveText("Đinh Bộ Lĩnh (Đinh Tiên Hoàng)");

  await page.goto(previewHome);
  const empty = await openSearch(page, "zzzz-khong-co-su-kien");
  await expect(empty.locator(".sr-result")).toHaveCount(0);
  await expect(empty.locator(".sr-quick-count")).toHaveText("0 kết quả");
  expect(errors).toEqual([]);
});

test("public search lists only published records", async ({ page }) => {
  await page.route("**/data/catalog.json", (route) => route.fulfill({
    json: ["published", "draft", "review"].map((status, index) => ({
      id: `evt000${index + 1}`,
      type: "event",
      title: ["Hồ sơ kiểm thử đã xuất bản", "Hồ sơ kiểm thử bản nháp", "Hồ sơ kiểm thử đang duyệt"][index],
      summary: "Nội dung kiểm tra kết quả công khai.",
      status,
      year: null,
      periodId: null,
      periodIds: [],
    })),
  }));
  await page.goto("/");
  const input = page.locator(navbarInput);
  await input.fill("Hồ sơ kiểm thử");
  const suggestions = page.locator(".vk-search-suggestion-list a");
  await expect(suggestions).toHaveCount(1);
  await expect(suggestions).toContainText("Hồ sơ kiểm thử đã xuất bản");
  await input.press("Enter");
  const popup = page.locator(".sr-dialog[open]");
  await expect(popup.locator(".sr-result")).toHaveCount(1);
  await expect(popup.locator(".sr-result")).toContainText("Hồ sơ kiểm thử đã xuất bản");
});

test("filters open with an empty public catalog and localhost can preview drafts", async ({ page }) => {
  await page.route("**/data/catalog.json", (route) => route.fulfill({
    json: [{
      id: "evt0001",
      type: "event",
      title: "Hồ sơ kiểm thử bản nháp",
      summary: "Dữ liệu kiểm tra chế độ xem thử.",
      status: "draft",
      year: null,
      periodId: null,
      periodIds: [],
    }],
  }));
  await page.goto("/");
  const popup = await openSearch(page, "kiểm thử");
  await expect(popup.getByText("Chưa có nội dung đã xuất bản")).toBeVisible();
  await openFilter(popup, "type");
  await popup.getByRole("button", { name: "Xem bản nháp" }).click();
  await expect(page).toHaveURL(/\?preview=1$/);
  await expect(popup.locator(".sr-result")).toContainText("Hồ sơ kiểm thử bản nháp");
  await page.reload();
  await expect(popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm" })).toHaveValue("kiểm thử");
  await expect(popup.locator(".sr-result")).toHaveCount(1);
});

test("period year controls preserve BCE dates and exclude undated results only when narrowed", async ({ page }) => {
  const dated = { year: -200, time: { sortYear: -200, label: "Khoảng 200 TCN" } };
  await page.route("**/data/catalog.json", (route) => route.fulfill({
    json: [
      { id: "per0001", type: "period", title: "Giai đoạn mẫu (300–100 TCN)", periodId: null, periodIds: [] },
      { id: "evt0001", type: "event", title: "Sự kiện có niên đại", ...dated },
      { id: "evt0002", type: "event", title: "Sự kiện chưa rõ niên đại" },
    ].map((record) => ({
      status: "published", summary: "Dữ liệu kiểm tra niên đại.",
      year: null, periodId: "per0001", periodIds: ["per0001"], ...record,
    })),
  }));
  await page.goto("/");
  const popup = await openSearch(page, "");
  const period = await openFilter(popup, "period");
  await period.getByLabel("Thời kỳ", { exact: true }).selectOption("per0001");
  const from = period.getByRole("slider", { name: "Từ năm" });
  await expect(from).toHaveValue("-300");
  await expect(from).toHaveAttribute("aria-valuetext", "300 TCN");
  await expect(popup.locator(".sr-quick-count")).toHaveText("3 kết quả");
  await from.press("ArrowRight");
  await expect(popup.locator(".sr-quick-count")).toHaveText("1 kết quả");
  await expect(popup.getByRole("button", { name: "Bỏ bộ lọc Từ năm 299 TCN" })).toBeVisible();
  await expect(popup.locator(".sr-result-meta")).toContainText("Khoảng 200 TCN");
});

test("navbar suggests results while Vietnamese IME is still composing", async ({ page }) => {
  await page.goto(previewHome);
  const input = page.locator(navbarInput);
  await input.focus();
  await expect(input).toBeFocused();

  const session = await page.context().newCDPSession(page);
  const more = page.getByRole("button", { name: "Xem thêm", exact: true });
  await session.send("Input.imeSetComposition", { text: "Đ", selectionStart: 1, selectionEnd: 1 });
  await expect(input).toHaveValue("Đ");
  await expect(more).toBeVisible();
  await session.send("Input.imeSetComposition", { text: "Đinh", selectionStart: 4, selectionEnd: 4 });
  await expect(page.locator(".vk-search-results").getByRole("link", { name: /Đinh Bộ Lĩnh/ })).toBeVisible();
  await expect(page.locator(".sr-dialog[open]")).toHaveCount(0);
  await expect(input).toBeFocused();
});

test("popup updates results during Vietnamese IME composition", async ({ page }) => {
  await page.goto(previewHome);
  const popup = await openSearch(page, "");
  const query = popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm" });
  await expect(popup.locator(".sr-quick-count")).toHaveText("32 kết quả");
  await query.focus();
  const session = await page.context().newCDPSession(page);
  await session.send("Input.imeSetComposition", { text: "Đinh", selectionStart: 4, selectionEnd: 4 });
  await expect(query).toHaveValue("Đinh");
  await expect(popup.locator(".sr-result-title").first()).toContainText("Đinh");
  await expect(popup.locator(".sr-quick-count")).not.toHaveText("32 kết quả");
  await expect(query).toBeFocused();
});

test("navbar suggestions and full search stay on the current page until opening a result", async ({ page }) => {
  await page.goto(previewAbout);
  const input = page.locator(navbarInput);
  const trigger = page.locator(navbarButton);
  await expect(input).toBeVisible();
  await expect(page.locator(".vk-search-results")).toBeHidden();
  await input.fill("Bạch Đằng");
  await expect(page.locator(".vk-search-results a").first()).toContainText("Bạch Đằng");
  await input.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(page.locator(".vk-search-results")).toBeHidden();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("Bạch Đằng");
  await input.fill("Trần");
  await expect(page.locator(".vk-search-results").getByRole("link", { name: /Trần Cảnh/ })).toBeVisible();
  await input.fill("Bạch Đằng");
  await trigger.click();

  const popup = page.locator(".sr-dialog[open]");
  await expect(popup.locator(".sr-result")).toHaveCount(3);
  await expect(page).toHaveURL(previewAbout);
  const [toolbar, sidebar, results, panel] = await Promise.all([
    popup.locator(".sr-dialog-toolbar").boundingBox(),
    popup.locator(".sr-filter-sidebar").boundingBox(),
    popup.locator(".sr-quick-content").boundingBox(),
    popup.locator(".sr-dialog-shell").boundingBox(),
  ]);
  expect(results.width + sidebar.width).toBeCloseTo(panel.width - 2, 1);
  expect(toolbar.x).toBe(panel.x);
  expect(toolbar.width).toBe(panel.width);
  expect(panel.y - toolbar.y - toolbar.height).toBe(8);

  await popup.getByRole("link", { name: /Trận Bạch Đằng \(1288\)/ }).click();
  await expect(page).toHaveURL("/chuyen-su/su-kien/tran-bach-dang-1288");
  await expect(page.locator("#detail-title")).toHaveText("Trận Bạch Đằng (1288)");
});

test("opening search without a query shows the full catalog and supports filters", async ({ page }) => {
  await page.goto(previewHome);
  await page.locator(navbarButton).click();
  const popup = page.locator(".sr-dialog[open]");
  const count = popup.locator(".sr-quick-count");
  await expect(popup.getByRole("searchbox")).toHaveValue("");
  await expect(count).toHaveText("32 kết quả");
  await expect(popup.locator(".sr-result")).toHaveCount(10);
  await popup.getByRole("button", { name: "Trang cuối", exact: true }).click();
  await expect(popup.locator(".sr-result")).toHaveCount(2);

  const type = await openFilter(popup, "type");
  await type.getByRole("button", { name: "Địa danh", exact: true }).click();
  await expect(count).toHaveText("7 kết quả");
  await page.reload();
  await expect(count).toHaveText("7 kết quả");
  await popup.getByRole("button", { name: "Xóa hết bộ lọc", exact: true }).click();
  await expect(count).toHaveText("32 kết quả");
});

test("reload restores the search popup, pagination, and filters", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 844 });
  await page.goto(previewHome);
  const popup = await openSearch(page, "Lý");
  const sort = popup.getByLabel("Sắp xếp");
  await sort.selectOption("year-desc");
  await popup.getByRole("button", { name: "Trang 2", exact: true }).click();
  await page.reload();
  await expect(popup.getByRole("searchbox")).toHaveValue("Lý");
  await expect(sort).toHaveValue("year-desc");
  await expect(popup.getByRole("button", { name: "Trang 2", exact: true })).toHaveAttribute("aria-current", "page");

  const types = await openFilter(popup, "type");
  const event = types.getByRole("button", { name: "Sự kiện", exact: true });
  await event.click();
  const period = await openFilter(popup, "period");
  await period.getByLabel("Thời kỳ", { exact: true }).selectOption("per0003");
  const from = period.getByRole("slider", { name: "Từ năm" });
  await from.press("ArrowRight");
  await expect(from).toHaveValue("1010");
  await page.reload();
  await expect(period).toBeVisible();
  await expect(popup.getByRole("button", { name: "Bỏ bộ lọc Từ năm 1010" })).toBeVisible();
  await expect(period.getByLabel("Thời kỳ", { exact: true })).toHaveValue("per0003");
  await expect(from).toHaveValue("1010");
  await openFilter(popup, "type");
  await expect(event).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");

  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(navbarInput)).toHaveValue("Lý");
  await expect(popup).toHaveCount(0);
});

test("reload restores a navbar query without carrying it to another page", async ({ page }) => {
  await page.goto(previewHome);
  const input = page.locator(navbarInput);
  await input.fill("Bạch Đằng");
  await page.reload();
  await expect(input).toHaveValue("Bạch Đằng");
  await expect(page.locator(".sr-dialog[open]")).toHaveCount(0);
  await page.goto(previewAbout);
  await expect(input).toHaveValue("");
});

test("navbar shows Xem thêm after the ten scrollable suggestions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(previewHome);
  const input = page.locator(navbarInput);
  await input.fill("a");
  const dropdown = page.locator(".vk-search-results");
  const list = dropdown.locator(".vk-search-suggestion-list");
  const links = list.getByRole("link");
  const more = list.getByRole("button", { name: "Xem thêm", exact: true });
  const advanced = dropdown.getByRole("button", { name: "Tìm kiếm nâng cao", exact: true });
  const progress = dropdown.locator(".vk-scroll-area > .vk-scroll-progress");
  await expect(links).toHaveCount(10);
  await expect(more).not.toBeInViewport();
  await expect(advanced).toBeInViewport({ ratio: 1 });
  const advancedPosition = (await advanced.boundingBox()).y;
  await expect(progress).toBeVisible();
  expect((await dropdown.boundingBox()).height).toBeLessThanOrEqual(300);

  await input.press("ArrowDown");
  for (let index = 1; index < 10; index++) await page.keyboard.press("ArrowDown");
  await expect(links.last()).toBeFocused();
  await expect(links.last()).toBeInViewport();
  await page.keyboard.press("ArrowDown");
  await expect(more).toBeFocused();
  // Cho phép sai lệch hiển thị dưới 1% giữa các môi trường trình duyệt.
  await expect(more).toBeInViewport({ ratio: 0.99 });
  await expect(progress.locator(".vk-scroll-progress-fill")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  expect((await advanced.boundingBox()).y).toBe(advancedPosition);

  await page.keyboard.press("Enter");
  const popup = page.locator(".sr-dialog[open]");
  await expect(popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm" })).toHaveValue("a");
});

test("mobile advanced search opens the filter panel above usable results", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(previewHome);
  await page.locator(navbarInput).fill("Bạch Đằng");
  await page.getByRole("button", { name: "Tìm kiếm nâng cao", exact: true }).click();

  const popup = page.locator(".sr-dialog[open]");
  const types = popup.locator("#sr-filter-type");
  const count = popup.locator(".sr-quick-count");
  await expect(types).toBeVisible();
  await expect(popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm" })).toHaveValue("Bạch Đằng");
  await expect(popup.locator(".sr-result-link").first()).toBeInViewport();
  await page.reload();
  await expect(types).toBeVisible();
  await types.getByRole("button", { name: "Địa danh", exact: true }).click();
  await expect(count).toHaveText("1 kết quả");
  await expect(popup.getByRole("link", { name: /Sông Bạch Đằng/ })).toBeInViewport();

  const period = await openFilter(popup, "period");
  await expect(types).toBeVisible();
  await period.getByRole("slider", { name: "Từ năm", exact: true }).press("ArrowRight");
  await expect(count).toHaveText("0 kết quả");
  await page.keyboard.press("Escape");
  await expect(period).toBeHidden();
  await expect(popup.locator("#sr-filter-trigger")).toBeFocused();
  await popup.getByRole("button", { name: "+1 điều kiện", exact: true }).click();
  await popup.getByRole("button", { name: "Bỏ bộ lọc Từ năm 969", exact: true }).click();
  await expect(count).toHaveText("1 kết quả");
});

test("desktop sidebar toggles multiple content types and keeps them when collapsed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 844 });
  await page.goto(previewHome);
  const popup = await openSearch(page, "Bạch Đằng");
  const toggle = popup.locator("#sr-filter-trigger");
  const results = popup.locator(".sr-results-scroll");
  const count = popup.locator(".sr-quick-count");
  await expect(count).toHaveText("3 kết quả");
  const types = await openFilter(popup, "type");
  await expect(popup.locator(".sr-results-heading #sr-filter-trigger")).toBeVisible();
  await expect(popup.locator(".sr-sort-field .sr-select-label")).toBeHidden();
  await expect(popup.getByText("Lọc chi tiết")).toHaveCount(0);
  const sidebar = popup.locator(".sr-filter-sidebar");
  const expanded = await results.boundingBox();
  expect((await sidebar.boundingBox()).x).toBeLessThan(expanded.x);
  const tiles = types.getByRole("button");
  await expect(tiles).toHaveText(["Tất cả", "Sự kiện", "Nhân vật", "Địa danh", "Hiện vật", "Văn hóa"]);
  const all = types.getByRole("button", { name: "Tất cả", exact: true });
  const event = types.getByRole("button", { name: "Sự kiện", exact: true });
  const place = types.getByRole("button", { name: "Địa danh", exact: true });
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await place.click();
  await expect(count).toHaveText("1 kết quả");
  await event.click();
  await expect(count).toHaveText("2 kết quả");
  await expect(all).toHaveAttribute("aria-pressed", "false");
  await expect(place.locator(".sr-quick-type-check")).toBeVisible();
  await expect(event.locator(".sr-quick-type-check")).toBeVisible();
  await toggle.click();
  await expect(types).toBeHidden();
  await expect(toggle).toBeFocused();
  const collapsed = await results.boundingBox();
  expect(collapsed.width).toBeGreaterThan(expanded.width);
  await openFilter(popup, "type");
  await expect(place).toHaveAttribute("aria-pressed", "true");
  await expect(popup.locator("#sr-filter-period")).toBeVisible();
  await expect(count).toHaveText("2 kết quả");
  await event.click();
  await expect(count).toHaveText("1 kết quả");
  await all.click();
  await expect(count).toHaveText("3 kết quả");
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await place.click();
  await sidebar.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
  await expect(count).toHaveText("3 kết quả");
  await expect(place).toHaveAttribute("aria-pressed", "false");
});

for (const width of [390, 1440]) {
  test(`all results are reachable through modal pagination at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(previewHome);
    const input = page.locator(navbarInput);
    await expect(input).toBeVisible();
    await input.fill("Lý");
    await page.getByRole("button", { name: "Xem thêm", exact: true }).click();

    const popup = page.locator(".sr-dialog[open]");
    await expect(popup.locator(".sr-result")).toHaveCount(10);
    const pagination = popup.getByRole("navigation", { name: "Phân trang kết quả" });
    await expect(pagination.getByRole("button", { name: "Trang 1", exact: true })).toHaveAttribute("aria-current", "page");
    await popup.getByRole("button", { name: "Trang sau" }).click();
    await expect(popup.locator(".sr-result")).toHaveCount(9);
    await expect(popup.locator(".sr-quick-count")).toHaveText("19 kết quả");
    await expect(popup.getByRole("button", { name: "Trang sau" })).toBeDisabled();
    await expect(popup.getByRole("button", { name: "Trang trước" })).toBeFocused();
    expect(await popup.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
    await expect(page).toHaveURL(previewHome);

    const query = popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm", exact: true });
    await popup.getByRole("button", { name: "Xóa từ khóa" }).click();
    await expect(popup.locator(".sr-quick-count")).toHaveText("32 kết quả");
    await query.pressSequentially("bach dang");
    await expect(query).toHaveValue("bach dang");
    await expect(popup.locator(".sr-quick-count")).toHaveText("3 kết quả");
    await expect(popup.locator(".sr-result")).toHaveCount(3);
    await query.press("ArrowDown");
    await expect(popup.locator(".sr-result-link").first()).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(popup.getByRole("navigation", { name: "Phân trang kết quả" })).toBeHidden();
    await expect(query).toBeFocused();

    if (width > 680) await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    await expect(page.locator(navbarInput)).toHaveValue("bach dang");
    await expect(page.locator(navbarInput)).toBeFocused();
  });
}

test("multi-select, period bounds, and snapping update results", async ({ page }) => {
  await page.goto(previewHome);
  const popup = await openSearch(page, "Bạch Đằng");
  const sort = popup.getByLabel("Sắp xếp");
  await sort.selectOption("year-desc");
  await expect(popup.locator(".sr-result-title").first()).toHaveText("Trận Bạch Đằng (1288)");
  const types = await openFilter(popup, "type");
  const event = types.getByRole("button", { name: "Sự kiện", exact: true });
  const person = types.getByRole("button", { name: "Nhân vật", exact: true });
  await event.click();
  await person.click();
  await expect(event).toHaveAttribute("aria-pressed", "true");
  await expect(person).toHaveAttribute("aria-pressed", "true");
  const time = await openFilter(popup, "period");
  const period = time.getByLabel("Thời kỳ", { exact: true });
  await period.selectOption("per0003");
  const from = time.getByRole("slider", { name: "Từ năm", exact: true });
  const to = time.getByRole("slider", { name: "Đến năm", exact: true });
  await expect(from).toHaveValue("1009");
  await expect(to).toHaveValue("1225");
  await expect(time.locator(".sr-year-tick")).toHaveCount(4);
  const track = time.locator(".sr-year-track");
  await track.scrollIntoViewIfNeeded();
  const box = await track.boundingBox();
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x, y);
  await page.mouse.down();
  const offset = box.width * (1050 - 1009) / 216;
  await page.mouse.move(box.x + offset - 3, y);
  await expect(from).toHaveValue("1050");
  const badge = popup.locator("#sr-filter-trigger .sr-filter-badge");
  await expect(badge).toHaveText("(3)");
  await page.mouse.up();
  await expect(badge).toHaveText("(4)");

  await period.selectOption("per0004");
  await expect(from).toHaveValue("1225");
  await expect(to).toHaveValue("1400");
  await expect(popup.locator(".sr-quick-count")).toHaveText("2 kết quả");
  await expect(popup.locator(".sr-result-title").first()).toHaveText("Trận Bạch Đằng (1288)");
  await expect(popup.getByRole("searchbox", { name: "Tìm địa phương" })).toHaveCount(0);
  await popup.getByRole("button", { name: "Xóa hết bộ lọc", exact: true }).click();
  await expect(popup.locator(".sr-quick-count")).toHaveText("3 kết quả");
  await expect(sort).toHaveValue("year-desc");

  const query = popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm", exact: true });
  await query.evaluate((input) => {
    input.value = "Trần";
    input.dispatchEvent(new InputEvent("input", { bubbles: true, isComposing: true }));
  });
  await expect(popup.locator(".sr-quick-count")).toHaveText("10 kết quả");
  await query.dispatchEvent("compositionend");
  await expect(popup.locator(".sr-quick-count")).toHaveText("10 kết quả");
  await expect(page).toHaveURL(previewHome);
});

test("pagination groups nearby pages and can jump to either end on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.route("**/data/catalog.json", (route) => route.fulfill({
    json: Array.from({ length: 120 }, (_, index) => ({
      id: `evt${String(index + 1).padStart(4, "0")}`,
      type: "event",
      title: `Sự kiện kiểm thử ${index + 1}`,
      summary: "Dữ liệu kiểm tra phân trang.",
      status: "draft",
      year: null,
      periodId: null,
      periodIds: [],
    })),
  }));
  await page.goto(previewHome);
  const popup = await openSearch(page, "Sự kiện kiểm thử");
  const pagination = popup.getByRole("navigation", { name: "Phân trang kết quả" });
  const number = (value) => pagination.getByRole("button", { name: `Trang ${value}`, exact: true });
  const first = pagination.getByRole("button", { name: "Trang đầu", exact: true });
  const last = pagination.getByRole("button", { name: "Trang cuối", exact: true });
  await expect(first).toBeDisabled();

  const resultArea = popup.locator(".sr-results-scroll");
  const viewport = resultArea.locator(".vk-scroll-area-viewport");
  const progress = resultArea.locator(".vk-scroll-progress");
  const fill = progress.locator(".vk-scroll-progress-fill");
  await expect(progress).toBeVisible();
  await expect(progress).toHaveCSS("inset-inline-start", "0px");
  await expect(progress).toHaveCSS("inset-inline-end", "0px");
  await viewport.evaluate((node) => { node.scrollTop = node.scrollHeight; });
  await expect(fill).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
  await number(4).click();
  await expect(viewport).toHaveJSProperty("scrollTop", 0);
  await expect(fill).toHaveCSS("transform", "matrix(0, 0, 0, 1, 0, 0)");

  for (const target of [5, 6, 7, 8, 9]) await number(target).click();
  await expect(number(9)).toHaveAttribute("aria-current", "page");
  await expect(number(9)).toBeFocused();
  await expect(pagination.locator(".vk-pagination-number")).toHaveText(["7", "8", "9", "10"]);
  await expect(pagination.locator(".vk-pagination-gap")).toHaveCount(2);
  await expect(popup.locator(".sr-quick-count")).toHaveText("120 kết quả");
  expect(await pagination.evaluate((nav) => nav.scrollWidth <= nav.clientWidth)).toBe(true);

  await last.click();
  await expect(number(12)).toHaveAttribute("aria-current", "page");
  await expect(last).toBeDisabled();
  await first.click();
  await expect(number(1)).toHaveAttribute("aria-current", "page");
  await expect(first).toBeDisabled();
});

test("catalog failure can be retried without closing the popup", async ({ page }) => {
  let fail = true;
  await page.route("**/data/catalog.json", (route) =>
    fail ? route.fulfill({ status: 503 }) : route.continue(),
  );
  await page.route("**/data/slug-index.json", (route) => route.fulfill({ status: 503 }));
  await page.goto(previewHome);
  const popup = await openSearch(page, "Bạch Đằng");
  await expect(popup.locator(".sr-state")).toContainText("Không tải được");

  fail = false;
  await popup.getByRole("button", { name: "Thử lại", exact: true }).click();
  await expect(popup.locator(".sr-quick-count")).toHaveText("3 kết quả");
  await expect(
    popup.getByRole("link", { name: /Trận Bạch Đằng \(1288\)/ }),
  ).toHaveAttribute("href", /\/chi-tiet\?id=evt0009$/);

  const query = popup.getByRole("searchbox", { name: "Từ khóa tìm kiếm", exact: true });
  await query.fill("khongtimthayxyz");
  await expect(popup.locator(".sr-state")).toContainText("Chưa tìm thấy");
  await expect(page).toHaveURL(previewHome);
});
