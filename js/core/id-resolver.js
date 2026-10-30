const RESOURCE_DIRECTORIES = {
  evt: "evt",
  per: "per",
  ppl: "ppl",
  plc: "plc",
  src: "src"
};

const DATA_BASE_URL = new URL("../../data/", import.meta.url);

/** Chuyển Resource ID hợp lệ thành URL JSON, độc lập với trang đang mở. */
export function resolveId(id) {
  if (typeof id !== "string" || id.length !== 7 || !/^[a-z]{3}[0-9]{4}$/.test(id)) {
    throw new TypeError("ID không hợp lệ. Dùng prefix và 4 chữ số, ví dụ evt0001, không có dấu gạch nối.");
  }

  const prefix = id.slice(0, 3);
  const directory = RESOURCE_DIRECTORIES[prefix];

  if (!directory) {
    throw new Error(`Prefix "${prefix}" chưa được hỗ trợ. Chỉ hỗ trợ evt/per/ppl/plc/src.`);
  }

  return new URL(`${directory}/${id}.json`, DATA_BASE_URL);
}
