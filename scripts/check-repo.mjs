import { readdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// Thư mục gốc repository
const ROOT = fileURLToPath(
  new URL("../", import.meta.url)
);

// Những thư mục cần kiểm tra
const DIRECTORIES = [
  "data",
  "schemas",
  "js",
  "scripts"
];

// Duyệt đệ quy để lấy danh sách file
function getFiles(directory) {
  const fullPath = join(ROOT, directory);

  return readdirSync(fullPath, {
    withFileTypes: true
  }).flatMap((entry) => {
    const relativePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return getFiles(relativePath);
    }

    if (entry.isFile()) {
      return [relativePath];
    }

    return [];
  });
}

let checkedJSON = 0;
let checkedJS = 0;
let skippedEmpty = 0;
let errors = 0;

// Lấy tất cả file cần kiểm tra
const files = DIRECTORIES.flatMap(getFiles);

for (const path of files) {
  const extension = extname(path);

  if (![".json", ".js", ".mjs"].includes(extension)) {
    continue;
  }

  const fullPath = join(ROOT, path);
  const content = readFileSync(fullPath, "utf8");

  // Bỏ qua placeholder chưa triển khai
  if (content.trim() === "") {
    skippedEmpty++;
    continue;
  }

  try {
    if (extension === ".json") {
      JSON.parse(content);
      checkedJSON++;
    } else {
      execFileSync(
        process.execPath,
        ["--check", fullPath],
        { stdio: "pipe" }
      );

      checkedJS++;
    }

    console.log(`PASS: ${path}`);

  } catch (error) {
    errors++;

    console.error(`FAIL: ${path}`);

    console.error(
      error.stderr?.toString() ?? error.message
    );
  }
}

console.log("\nValidation summary:");
console.log(`JSON checked: ${checkedJSON}`);
console.log(`JavaScript checked: ${checkedJS}`);
console.log(`Empty placeholders skipped: ${skippedEmpty}`);
console.log(`Errors: ${errors}`);

if (checkedJSON === 0) {
  console.warn(
    "WARNING: Chưa có JSON có nội dung để kiểm tra."
  );
}

if (errors > 0) {
  process.exitCode = 1;
}