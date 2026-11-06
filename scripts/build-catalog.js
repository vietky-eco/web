import { readdir, readFile, writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { validateCatalog } from "../js/core/catalog-loader.js";

const DATA_URL = new URL("../data/", import.meta.url);
const CATALOG_URL = new URL("catalog.json", DATA_URL);

async function readJSON(url) {
  const raw = await readFile(url, "utf8");
  if (!raw.trim()) throw new Error("File tham chiếu đang rỗng: " + url.pathname);
  try {
    return JSON.parse(raw);
  } catch (cause) {
    throw new Error("JSON không hợp lệ: " + url.pathname, {cause});
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && args[0] !== "--check")) {
    throw new Error("Cách dùng: node scripts/build-catalog.js [--check]");
  }
  const records = [];
  let skipped = 0;
  for (const prefix of ["evt", "ppl", "plc"]) {
    const directory = new URL(prefix + "/", DATA_URL);
    const entries = await readdir(directory, {withFileTypes: true});
    for (const entry of entries.filter(item => item.isFile() && item.name.endsWith(".json")).sort((a, b) => a.name.localeCompare(b.name))) {
      const url = new URL(entry.name, directory);
      const raw = await readFile(url, "utf8");
      if (!raw.trim()) { skipped++; continue; }
      let entity;
      try { entity = JSON.parse(raw); }
      catch (cause) { throw new Error("JSON không hợp lệ: " + url.pathname, {cause}); }
      if (!entity || entity.id !== entry.name.slice(0, -5) ||
          typeof entity.id !== "string" || !entity.id.startsWith(prefix)) {
        throw new Error("ID không khớp file nguồn: " + url.pathname);
      }
      const periodIds = entity.periodIds === undefined ? [] : entity.periodIds;
      const record = {
        id: entity.id, type: entity.type, title: entity.title, summary: entity.summary,
        year: entity.time?.sortYear ?? null,
        periodId: Array.isArray(periodIds) && periodIds.length === 1 ? periodIds[0] : null,
        periodIds, status: entity.status
      };
      if (entity.time !== undefined) record.time = entity.time;
      if (entity.articleId !== undefined) record.articleId = entity.articleId;
      try { validateCatalog([record]); }
      catch (cause) { throw new Error(url.pathname + ": " + cause.message, {cause}); }

      for (const id of [...record.periodIds, ...(record.articleId ? [record.articleId] : [])]) {
        const targetURL = new URL(id.slice(0, 3) + "/" + id + ".json", DATA_URL);
        const target = await readJSON(targetURL);
        if (!target || target.id !== id || (id.startsWith("per") && target.type !== "period")) {
          throw new Error("Tham chiếu không khớp " + id + ": " + targetURL.pathname);
        }
      }
      records.push(record);
    }
  }
  records.sort((a, b) => a.id.localeCompare(b.id));
  validateCatalog(records);
  if (args[0] === "--check") {
    if (!isDeepStrictEqual(await readJSON(CATALOG_URL), records)) {
      throw new Error("Catalog chưa khớp JSON gốc. Chạy node scripts/build-catalog.js để tạo lại.");
    }
  } else {
    await writeFile(CATALOG_URL, JSON.stringify(records, null, 2) + "\n", "utf8");
  }
  console.log("Catalog " + (args[0] === "--check" ? "khớp" : "đã tạo") + ": " + records.length +
    " record; bỏ qua " + skipped + " placeholder rỗng. Giữ nguyên status từ Entity.");
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
