import { expect, test } from "@playwright/test";

const firstPath = "/chuyen-su/su-kien/thong-nhat-dat-nuoc-lap-dai-co-viet-968";
const secondPath = "/chuyen-su/su-kien/bien-co-cung-dinh-nha-dinh-979";

for (const [path, id, title, year] of [
  [firstPath, "evt0001", "Thống nhất đất nước, lập Đại Cồ Việt (968)", "968"],
  [secondPath, "evt0002", "Biến cố cung đình nhà Đinh (979)", "979"],
]) {
  test(`slug tải đúng ${id} qua Content Loader và giữ URL khi tải lại`, async ({ page }) => {
    const errors = [];
    const requests = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => requests.push(new URL(request.url()).pathname));
    await page.goto(path);
    await expect(page.locator("#detail-title")).toHaveText(title);
    await expect(page.locator("#detail-article")).toBeVisible();
    await expect(page.locator("#detail-summary")).not.toBeEmpty();
    await expect(page.locator("#detail-meta")).toHaveText(year);
    await expect(page.locator("#detail-sources")).toBeVisible();
    await expect(page.locator("#detail-source-list a")).toHaveAttribute("href", /^https:\/\/baotanglichsu.vn\//);
    await expect(page.locator("#detail-loading")).toBeHidden();
    await expect(page.locator("#detail-error")).toBeHidden();
    await expect(page).toHaveTitle(`${title} | Việt Ký`);
    await expect(page).toHaveURL(path);
    expect(requests).toContain("/data/slug-index.json");
    expect(requests).toContain(`/data/evt/${id}.json`);
    await page.reload();
    await expect(page.locator("#detail-title")).toHaveText(title);
    expect(errors).toEqual([]);
  });
}

test("liên kết bài liên quan dùng slug và điều hướng đúng", async ({ page }) => {
  await page.goto(firstPath);
  await page.locator("#detail-related-list a").click();
  await expect(page).toHaveURL(secondPath);
  await expect(page.locator("#detail-title")).toHaveText("Biến cố cung đình nhà Đinh (979)");
  await expect(page.locator("#detail-category-link")).toHaveAttribute("href", "/chuyen-su/su-kien");
});

test("URL cũ ?id= và thực thể thời kỳ vẫn hoạt động", async ({ page }) => {
  await page.goto("/pages/detail.html?id=evt0001");
  await expect(page.locator("#detail-title")).toContainText("Đại Cồ Việt");
  await page.goto("/chuyen-su/cac-thoi-ky/thoi-dinh");
  await expect(page.locator("#detail-title")).toHaveText("Thời Đinh (968–980)");
  await expect(page.locator("#detail-category-link")).toHaveText("Các thời kỳ");
  await expect(page.locator("#detail-meta")).toBeHidden();
});

for (const [path, message] of [
  ["/chi-tiet", /chưa có ID/],
  ["/chi-tiet?id=evt-0001", /ID không hợp lệ/],
  ["/chi-tiet?id=evt9999", /HTTP 404/],
  ["/chuyen-su/su-kien/khong-ton-tai", /Không có bài viết/],
  ["/chuyen-su/su-kien/khong-ton-tai?id=evt0001", /Không có bài viết/],
]) {
  test(`thông báo lỗi cho ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("#detail-error")).toBeVisible();
    await expect(page.locator("#detail-error-title")).toHaveText("Không tìm thấy bài viết");
    await expect(page.locator("#detail-error-message")).toContainText(message);
    await expect(page.locator("#detail-loading")).toBeHidden();
    await expect(page.locator("#detail-article")).toBeHidden();
  });
}

test("slug của Đinh Bộ Lĩnh tải được dữ liệu nhân vật", async ({ page }) => {
  await page.goto("/chuyen-su/nhan-vat/dinh-bo-linh");
  await expect(page.locator("#detail-title")).toHaveText("Đinh Bộ Lĩnh (Đinh Tiên Hoàng)");
  await expect(page.locator("#detail-article")).toBeVisible();
});

test("slug có trong index nhưng JSON không hợp lệ được báo rõ", async ({ page }) => {
  await page.route("**/data/ppl/ppl0001.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "",
  }));
  await page.goto("/chuyen-su/nhan-vat/dinh-bo-linh");
  await expect(page.locator("#detail-error-title")).toHaveText("Không thể tải bài viết");
  await expect(page.locator("#detail-error-message")).toContainText(/JSON.*không hợp lệ/);
  await expect(page.locator("#detail-loading")).toBeHidden();
});

test("lỗi tải index phân biệt với slug không tồn tại; URL cũ vẫn hoạt động", async ({ page }) => {
  await page.route("**/data/slug-index.json", route => route.fulfill({ status: 503, body: "unavailable" }));
  await page.goto(firstPath);
  await expect(page.locator("#detail-error-title")).toHaveText("Không thể tải bài viết");
  await expect(page.locator("#detail-error-message")).toContainText("danh mục bài viết");
  await page.goto("/chi-tiet?id=evt0001");
  await expect(page.locator("#detail-article")).toBeVisible();
});

test("renderer đọc articleId, context, sections và hiển thị văn bản an toàn", async ({ page }) => {
  const text = '<img src=x onerror="alert(1)">';
  await page.route("**/data/evt/evt0001.json", async route => {
    const response = await route.fetch();
    await route.fulfill({ json: { ...await response.json(), articleId: "art9900" } });
  });
  await page.route("**/data/art/art9900.json", route => route.fulfill({ json: {
    id: "art9900", entityId: "evt0001", title: "Fixture kỹ thuật",
    context: "Bối cảnh thử nghiệm.",
    sections: [{ id: "sec001", heading: "Phần thử nghiệm", body: `Đoạn một.\n\n${text}` }],
    sourceIds: ["src0002"],
  } }));
  await page.goto(firstPath);
  await expect(page.locator("#detail-context")).toHaveText("Bối cảnh thử nghiệm.");
  await expect(page.locator("#sec001 h2")).toHaveText("Phần thử nghiệm");
  await expect(page.locator("#sec001 p")).toHaveCount(2);
  await expect(page.locator("#sec001")).toContainText(text);
  await expect(page.locator("#sec001 img")).toHaveCount(0);
  await expect(page.locator("#detail-source-list li")).toHaveCount(2);
  await expect(page.locator("#detail-content")).not.toContainText("đang được biên soạn");
});

test("nguồn lỗi không làm mất bài; chặn URL nguồn không an toàn", async ({ page }) => {
  await page.route("**/data/src/src0001.json", route => route.fulfill({ json: {
    id: "src0001", title: "Nguồn thử nghiệm", url: "javascript:alert(1)",
  } }));
  await page.goto(firstPath);
  await expect(page.locator("#detail-source-list")).toHaveText("Nguồn thử nghiệm");
  await expect(page.locator("#detail-source-list a")).toHaveCount(0);
  await page.unroute("**/data/src/src0001.json");
  await page.route("**/data/src/src0001.json", route => route.fulfill({ status: 404, body: "not found" }));
  await page.reload();
  await expect(page.locator("#detail-article")).toBeVisible();
  await expect(page.locator("#detail-source-list")).toContainText("Nguồn src0001 hiện chưa tải được");
});

test("không tràn ngang trên mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(firstPath);
  await expect(page.locator("#detail-article")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
