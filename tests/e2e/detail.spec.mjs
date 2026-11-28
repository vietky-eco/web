import { expect, test } from "@playwright/test";

const firstPath = "/chuyen-su/su-kien/thong-nhat-dat-nuoc-lap-dai-co-viet-968";
const secondPath = "/chuyen-su/su-kien/bien-co-cung-dinh-nha-dinh-979";
const personPath = "/chuyen-su/nhan-vat/dinh-bo-linh";
const hoaLuPath = "/dau-xua/dia-danh/hoa-lu";

async function attachSampleArticle(page, entity = "evt/evt0001", articleId = "art0001") {
  await page.route(`**/data/${entity}.json`, async route => {
    const response = await route.fetch();
    await route.fulfill({ json: { ...await response.json(), articleId } });
  });
}

test("ảnh bài viết có chú thích và bài vẫn đọc được khi ảnh lỗi", async ({ page }) => {
  await attachSampleArticle(page);
  await attachSampleArticle(page, "plc/plc0001", "art0081");
  await page.goto(firstPath);
  const cover = page.locator("#detail-cover");
  await expect(cover.getByRole("img", { name: /Cố đô Hoa Lư/ })).toBeVisible();
  await expect.poll(() => cover.getByRole("img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(cover.locator("figcaption")).toContainText("Ảnh chụp hiện đại");
  await expect(cover.getByRole("link", { name: /lumoplank.*CC0/ })).toHaveAttribute(
    "href", "https://commons.wikimedia.org/wiki/File:Ninh_Binh_-_NinhBinh1659.jpg",
  );

  await expect(page.locator("#sec003 figure")).toHaveCount(0);
  await page.getByRole("link", { name: "Tìm hiểu thêm về kinh đô Hoa Lư" }).click();
  await expect(page).toHaveURL(hoaLuPath);
  const inlineFigure = page.locator("#sec002 figure");
  await inlineFigure.scrollIntoViewIfNeeded();
  await expect.poll(() => inlineFigure.getByRole("img").evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(inlineFigure.getByRole("link", { name: "Ảnh: Nguyễn Thanh Quang" })).toHaveAttribute(
    "href", /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/,
  );
  await expect(inlineFigure.getByRole("link", { name: "CC BY-SA 3.0" })).toHaveAttribute(
    "href", "https://creativecommons.org/licenses/by-sa/3.0/",
  );

  await page.route("**/assets/img/img0001.webp", route => route.fulfill({ status: 404 }));
  await page.goto(firstPath);
  await expect(page.locator("#sec003")).toBeVisible();
  await expect(cover).toBeHidden();
});

test("mục lục lấy đúng đề mục và sao chép liên kết trên điện thoại", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await attachSampleArticle(page);
  await page.goto(firstPath);

  const contents = page.getByRole("navigation", { name: "Mục lục bài viết" });
  await expect(contents.getByRole("link")).toHaveText([
    "Bối cảnh lịch sử",
    "Từ căn cứ Hoa Lư đến thống nhất",
    "Năm 968, triều Đinh ra đời",
    "Vì sao chọn Hoa Lư làm kinh đô?",
    "Nguồn tư liệu",
  ]);
  await expect(contents.getByRole("button")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  const target = contents.getByRole("link", { name: "Năm 968, triều Đinh ra đời" });
  await target.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(`${firstPath}#sec002`);
  await expect(page.locator("#sec002 h2")).toBeInViewport();
  const section = page.locator("#sec002");
  await section.getByRole("button", { name: /Sao chép liên kết đến mục Năm 968/ }).click();
  await expect(section.getByRole("status")).toHaveText("Đã sao chép liên kết");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(new URL(`${firstPath}#sec002`, page.url()).href);
});

test("liên kết tới đề mục cuộn đúng vị trí sau khi tải dữ liệu", async ({ page }) => {
  await attachSampleArticle(page);
  await page.goto(`${firstPath}#sec002`);
  await expect(page.locator("#sec002 h2")).toBeInViewport();
  await page.reload();
  await expect(page.locator("#sec002 h2")).toBeInViewport();
});

test("bài chỉ có tóm tắt ẩn mục lục; mã đề mục sai không làm mất bài", async ({ page }) => {
  await page.goto(`${firstPath}#khong-co-muc-nay`);
  await expect(page.locator("#detail-article")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Mục lục bài viết" })).toHaveCount(0);

  await attachSampleArticle(page);
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Mục lục bài viết" })).toBeVisible();
  await expect(page.locator("#detail-error")).toBeHidden();
});

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
  await page.getByRole("link", { name: "Biến cố kế vị cuối thời Đinh" }).click();
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
