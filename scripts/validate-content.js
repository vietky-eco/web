// Kiểm tra JSON/ID/nguồn/tham chiếu; không thay thế kiểm định JSON Schema hoặc review sử liệu.
import { readdir, readFile } from "node:fs/promises";
import { resolveId } from "../js/core/id-resolver.js";

const DATA_URL = new URL("../data/", import.meta.url);
const ENTITY_TYPES = { evt: "event", per: "period", ppl: "person", plc: "place", cul: "culture" };
const PREFIXES = ["evt", "per", "ppl", "plc", "cul", "src", "art", "sty", "tml"];
const REFERENCE_PREFIXES = {
  sourceIds: ["src"], periodIds: ["per"], parentId: ["per"], childIds: ["per"],
  personIds: ["ppl"], placeIds: ["plc"], eventIds: ["evt"], parentEventId: ["evt"],
  articleId: ["art"], articleIds: ["art"], storyIds: ["sty"], timelineIds: ["tml"],
  entityId: Object.keys(ENTITY_TYPES), targetId: ["evt", "ppl", "plc"]
};

function requireText(value, message) {
  if (typeof value !== "string" || !value.trim()) throw new Error(message);
}

function validateSource(source) {
  for (const field of ["citation", "publisher"]) {
    requireText(source[field], source.id + ": thiếu " + field + " của nguồn.");
  }
  if (!source.url && !source.locator) {
    throw new Error(source.id + ": nguồn phải có url hoặc locator để truy xuất.");
  }
  if (source.locator !== undefined) requireText(source.locator, source.id + ": locator không hợp lệ.");
  if (source.url !== undefined) {
    let url;
    try { url = new URL(source.url); } catch { /* Báo lỗi thống nhất bên dưới. */ }
    if (typeof source.url !== "string" || !/^https?:\/\//.test(source.url) ||
        /\s/.test(source.url) || !url?.hostname || url.username || url.password) {
      throw new Error(source.id + ": url nguồn phải là HTTP(S) hợp lệ, không có khoảng trắng hoặc thông tin đăng nhập.");
    }
  }
  if (source.status === "published" && source.reviewStatus !== "verified") {
    throw new Error(source.id + ": nguồn published phải có reviewStatus verified.");
  }
}

async function main() {
  if (process.argv.length > 2) throw new Error("Cách dùng: node scripts/validate-content.js");
  const records = new Map();
  const placeholders = new Set();
  for (const prefix of PREFIXES) {
    const directory = new URL(prefix + "/", DATA_URL);
    const entries = await readdir(directory, { withFileTypes: true }).catch(error => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    for (const entry of entries.filter(item => item.isFile() && item.name.endsWith(".json"))
      .sort((a, b) => a.name.localeCompare(b.name))) {
      const file = prefix + "/" + entry.name;
      const id = entry.name.slice(0, -5);
      try { resolveId(id); } catch (cause) { throw new Error(file + ": " + cause.message); }
      if (!id.startsWith(prefix)) throw new Error(file + ": ID không khớp thư mục.");
      const raw = await readFile(new URL(entry.name, directory), "utf8");
      if (!raw.trim()) { placeholders.add(id); continue; }
      let record;
      try { record = JSON.parse(raw); }
      catch (cause) { throw new Error(file + ": JSON không hợp lệ.", { cause }); }
      if (!record || typeof record !== "object" || Array.isArray(record)) {
        throw new Error(file + ": nội dung phải là object JSON.");
      }
      if (record.id !== id) throw new Error(file + ": ID không khớp tên file.");
      if (records.has(id)) throw new Error(file + ": ID trùng " + id + ".");
      requireText(record.title, id + ": title không hợp lệ.");
      if (!["draft", "review", "published"].includes(record.status)) {
        throw new Error(id + ": status không hợp lệ.");
      }
      if (ENTITY_TYPES[prefix] && record.type !== ENTITY_TYPES[prefix]) {
        throw new Error(id + ": type không khớp prefix " + prefix + ".");
      }
      if (ENTITY_TYPES[prefix] || prefix === "art") {
        if (!Array.isArray(record.sourceIds)) throw new Error(id + ": sourceIds phải là mảng.");
        if ((prefix === "evt" || record.status === "published") && !record.sourceIds.length) {
          throw new Error(id + ": sourceIds phải có ít nhất một nguồn.");
        }
      }
      if (prefix === "src") validateSource(record);
      records.set(id, record);
    }
  }

  let references = 0;
  function checkReference(id, field, owner) {
    try { resolveId(id); }
    catch (cause) { throw new Error(owner + ": " + field + ": " + cause.message); }
    const prefixes = REFERENCE_PREFIXES[field];
    if (prefixes && !prefixes.includes(id.slice(0, 3))) {
      throw new Error(owner + ": " + field + " có prefix không hợp lệ: " + id + ".");
    }
    if (!records.has(id)) {
      const reason = placeholders.has(id) ? "file đích rỗng (placeholder)" : "không có bản ghi đích";
      throw new Error(owner + ": " + field + " → " + id + ": " + reason + ".");
    }
    references++;
  }

  // Kiểm tra tham chiếu JSON có cấu trúc, không dò ID trong nội dung văn bản.
  // sectionIds là anchor nội bộ Article, không phải Resource ID.
  function walk(value, owner) {
    if (Array.isArray(value)) { value.forEach(item => walk(item, owner)); return; }
    if (!value || typeof value !== "object") return;
    for (const [field, child] of Object.entries(value)) {
      if (field === "periodId" || field === "relatedIds") {
        throw new Error(owner + ": dùng periodIds và related[].targetId theo schema hiện tại; không dùng " + field + ".");
      }
      if (field === "id" || field === "sectionIds") continue;
      if (field === "related" && (!Array.isArray(child) ||
          child.some(item => !item || typeof item.targetId !== "string" ||
            typeof item.label !== "string" || !item.label.trim()))) {
        throw new Error(owner + ": related phải có targetId và label hợp lệ.");
      }
      if (field.endsWith("Ids")) {
        if (!Array.isArray(child)) throw new Error(owner + ": " + field + " phải là mảng.");
        if (new Set(child).size !== child.length) throw new Error(owner + ": " + field + " chứa ID trùng.");
        child.forEach(id => checkReference(id, field, owner));
      } else if (field.endsWith("Id")) {
        if (child !== null) checkReference(child, field, owner);
      } else {
        walk(child, owner);
      }
    }
  }
  for (const record of records.values()) walk(record, record.id);
  const events = [...records.values()].filter(record => record.type === "event").length;
  console.log("Hợp lệ: " + records.size + " bản ghi JSON; " + events + " sự kiện có nguồn; " + references + " tham chiếu.");
  console.log("Bỏ qua " + placeholders.size + " placeholder rỗng chưa được tham chiếu. Không thay đổi dữ liệu.");
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
