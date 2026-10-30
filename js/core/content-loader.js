import { resolveId } from "./id-resolver.js";

/** Tải một object JSON; caller chịu trách nhiệm hiển thị dữ liệu hoặc lỗi. */
export async function loadContent(id) {
  const url = resolveId(id);
  let response;

  try {
    response = await fetch(url);
  } catch (cause) {
    throw new Error(`Không thể tải tài nguyên "${id}". Kiểm tra kết nối mạng.`, { cause });
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Không tìm thấy tài nguyên "${id}" (HTTP 404).`);
    }

    throw new Error(`Không thể tải tài nguyên "${id}" (HTTP ${response.status}).`);
  }

  let content;

  try {
    content = await response.json();
  } catch (cause) {
    throw new Error(`JSON của tài nguyên "${id}" không hợp lệ.`, { cause });
  }

  if (content === null || typeof content !== "object" || Array.isArray(content)) {
    throw new Error(`Dữ liệu của tài nguyên "${id}" phải là object JSON.`);
  }

  if ("id" in content && content.id !== id) {
    throw new Error(`ID trong JSON không khớp: yêu cầu "${id}", nhận ${JSON.stringify(content.id)}.`);
  }

  return content;
}
