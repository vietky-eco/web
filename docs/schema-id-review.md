# IE104-45 — Báo cáo JSON Schema và quy tắc ID tài nguyên

## 1. Phạm vi và hiện trạng

Cập nhật ngày **30/10/2026**, múi giờ Asia/Bangkok. Issue: [IE104-45 — Rà soát JSON Schema và quy tắc ID tài nguyên](https://ie104.atlassian.net/browse/IE104-45).

- Thư mục ứng dụng: `D:/HK1-NAM3/ie104-web/DoAn104-VietKy/web`.
- Nhánh tại thời điểm kiểm tra: `shcemas/IE104-20-JsonSchema-ID-Resolver-Sample-data`.
- HEAD tại thời điểm kiểm tra: `3f75b615fd50e2c454831f0f16d15969e066a4b3`.
- Cả năm file trong `schemas/` đã có nội dung JSON Schema Draft 2020-12; không còn là placeholder rỗng.
- Đây là trạng thái triển khai local. Việc đã có schema không thay thế sự thống nhất thiết kế và review của nhóm.

Lượt cập nhật này chỉ viết lại `docs/schema-id-review.md`. Giữ nguyên năm schema, dữ liệu, mã nguồn, nhánh và Git index. Không tạo thư mục đề xuất, file ví dụ hoặc file test; không commit, push, tạo PR hay cập nhật Jira.

Căn cứ đối chiếu: [Product Specification](https://github.com/vietky-eco/hub/wiki/Product-Specification), [Technical Design](https://github.com/vietky-eco/hub/wiki/Technical-Design) và [Decision Log](https://github.com/vietky-eco/hub/wiki/Decision-Log), theo bản wiki đã đọc ở revision `eaa6b9a644430d134f0194b44d3a63dc018a5a85`. Danh mục nội bộ là kế hoạch biên tập; ID có trong danh mục không chứng minh nội dung đã được kiểm chứng hoặc xuất bản. Story/Map vẫn là hướng mở rộng, không tự trở thành yêu cầu triển khai MVP.

## 2. Các schema và trường bắt buộc

### Trường bắt buộc cho mọi bản ghi

| File | Trách nhiệm | Trường bắt buộc |
|---|---|---|
| [entity.schema.json](../schemas/entity.schema.json) | Định danh, phân loại, tóm tắt, thời gian và quan hệ | `id`, `type`, `title`, `status`, `sourceIds` |
| [source.schema.json](../schemas/source.schema.json) | Thông tin tài liệu tham khảo | `id`, `title`, `status` |
| [article.schema.json](../schemas/article.schema.json) | Bối cảnh và nội dung bài đọc | `id`, `entityId`, `title`, `status`, `sections`, `sourceIds` |
| [story.schema.json](../schemas/story.schema.json) | Thứ tự scene và tham chiếu tài nguyên | `id`, `entityId`, `articleId`, `title`, `status`, `scenes` |
| [timeline.schema.json](../schemas/timeline.schema.json) | Tập Event được lựa chọn | `id`, `title`, `status`, `eventIds` |

Các schema dùng `additionalProperties: false` để bắt trường không được khai báo. Trường văn bản nội dung khi được cung cấp phải có ký tự khác whitespace. `status` nhận `draft`, `review`, `published`; trạng thái này không tự đồng bộ với Jira hoặc bảng quản lý nội bộ.

### Điều kiện cấu trúc khi `status = published`

| Schema/loại | Điều kiện bổ sung |
|---|---|
| Mọi Entity | Có `summary` và ít nhất một `sourceIds` |
| Entity event/person/place | Có `periodIds` không rỗng và `articleId` là art ID, không nhận null |
| Entity event | Có `time` và ít nhất một `related` |
| Source | Có `citation` và ít nhất một trong `url`, `locator` |
| Article | Có `context`, ít nhất một section, mọi section có `body`, ít nhất một src ID |
| Story | Có ít nhất một scene |
| Timeline | Có ít nhất một Event ID |

`draft` và `review` được phép chưa đủ nội dung công bố nhưng vẫn phải đúng kiểu dữ liệu và các trường bắt buộc chung. Chuyển trạng thái thành `published` không chứng minh nguồn đáng tin hoặc tham chiếu đã tồn tại.

### Chi tiết các cấu trúc con

- **Entity:** `type` gồm event/period/person/place/culture và phải khớp prefix ID. `related` gồm object có `targetId` và `label`; đích chỉ nhận evt/ppl/plc. Khi có `time`, bắt buộc `sortYear` là integer và `label` có nội dung; `order` tùy chọn, integer không âm. Nhãn hiển thị giữ độ chính xác của nguồn, không tự suy từ năm thành ngày/tháng. Period/culture không bị bắt buộc có Article trong schema hiện tại.
- **Source:** tùy chọn `author`, `publisher`, `publicationYear`, `citation`, `url`, `locator`. URL khi có chỉ nhận HTTP(S), host không rỗng, không whitespace hoặc userinfo; có `format: uri`. Kiểm tra đầy đủ URI cần bật FormatChecker trong validator. Schema không xác nhận URL truy cập được hoặc nguồn đúng về lịch sử.
- **Article:** mỗi section bắt buộc `id`, `heading`; `body` bắt buộc khi bài published. `context` là bối cảnh dẫn nhập trước thân bài. Summary lấy từ Entity. Không bắt mọi bài phải có cùng số section. Schema hiện dùng `sections[].body`; fixture playground trước đây dùng `content` và cần được nhóm đồng bộ khi tích hợp, chưa được sửa trong lượt này.
- **Story:** tham chiếu một Article gốc bằng `articleId`; `sectionIds` được hiểu trong phạm vi bài đó. `heading`, `narration` tùy chọn. `sourceIds` tùy chọn cho nguồn bổ sung; nguồn nội dung gốc được truy qua Article. Chưa định nghĩa effect, camera, duration hoặc trạng thái lớp bản đồ.
- **Timeline:** `eventIds` là mảng evt ID duy nhất; `description` tùy chọn. `periodIds` tùy chọn nhưng khi có phải là mảng per ID duy nhất, không rỗng. Timeline không chép năm, nhãn thời gian hoặc nguồn của Event. Thứ tự mảng là thứ tự biên tập lưu trữ; Timeline theo niên đại vẫn cần dùng khóa thời gian của Event theo yêu cầu sản phẩm.

### Các loại scene hiện có trong Story

Mỗi scene bắt buộc `id`, `type`; chỉ nhận trường được khai báo cho loại tương ứng.

| `type` | Payload bắt buộc | Payload tùy chọn ngoài heading/narration |
|---|---|---|
| `hero` | Không thêm payload bắt buộc | `imageId` |
| `narrative` | `sectionIds` không rỗng | Không |
| `image` | `imageId` | `sectionIds` |
| `map` | `mapId` | `sectionIds` |
| `timeline` | `timelineId` | `sectionIds` |

`sectionIds` khi có phải không rỗng và không lặp. Schema cấu hình scene không đồng nghĩa engine đã hỗ trợ scene đó; `article-renderer.js` và `story-renderer.js` hiện còn rỗng.

## 3. Quy tắc prefix và ID

Resource ID có đúng **7 ký tự**: prefix chữ thường và **4 chữ số ASCII `[0-9]`**, không gạch nối, khoảng trắng hoặc xuống dòng. Các nhóm đánh số độc lập; không suy Article ID từ phần số của Entity ID.

| Prefix | Loại | Ví dụ hợp lệ | Địa chỉ JSON theo quy ước |
|---|---|---|---|
| evt | Sự kiện | `evt0001` | `data/evt/evt0001.json` |
| per | Thời kỳ | `per0001` | `data/per/per0001.json` |
| ppl | Nhân vật | `ppl0001` | `data/ppl/ppl0001.json` |
| plc | Địa danh | `plc0001` | `data/plc/plc0001.json` |
| src | Nguồn | `src0001` | `data/src/src0001.json` |

Schema còn sử dụng `cul` cho văn hóa, `art` cho Article, `sty` cho Story, `tml` cho Timeline, `img`/`map` cho tham chiếu media. Định dạng ID không chứng minh file tương ứng có nội dung hoặc media đã tồn tại.

`sec001` và `scn001` là anchor nội bộ gồm prefix và ba chữ số, lần lượt trong Article và Story; chúng không phải Resource ID toàn hệ thống. Cần kiểm tra riêng ID section/scene duy nhất trong mỗi tài nguyên: `uniqueItems` không bắt hai object khác nội dung nhưng trùng `.id`.

Các dạng bị từ chối: `evt-0001`, `evt001`, `evt00001`, `EVT0001`, chữ số Unicode, newline cuối ID và ký tự chữ thay cho số.

## 4. Ví dụ JSON và kiểm tra cú pháp

Ví dụ kỹ thuật dưới đây đạt Entity Schema hiện tại ở trạng thái draft. Ví dụ nằm ngay trong báo cáo và được kiểm tra trong bộ nhớ; không tạo file JSON bổ sung hoặc ghi đè dữ liệu ứng dụng.

```json
{
  "id": "evt0001",
  "type": "event",
  "title": "Dữ liệu kỹ thuật kiểm tra schema",
  "status": "draft",
  "sourceIds": []
}
```

Đây không phải nội dung lịch sử để xuất bản. Nếu chỉ đổi thành `published`, bản ghi chưa đạt vì thiếu Summary, nguồn, thời kỳ, Article, thời gian và quan hệ theo các điều kiện ở mục 2.

Trong môi trường Python phát triển đã có `jsonschema`, có thể kiểm tra năm meta-schema và ví dụ trên mà không tạo file:

```python
import json
from pathlib import Path
from jsonschema import Draft202012Validator

schemas = {
    p.name: json.loads(p.read_text(encoding="utf-8"))
    for p in Path("schemas").glob("*.schema.json")
}
assert len(schemas) == 5
for schema in schemas.values():
    Draft202012Validator.check_schema(schema)
example = {
    "id": "evt0001", "type": "event",
    "title": "Dữ liệu kỹ thuật kiểm tra schema",
    "status": "draft", "sourceIds": []
}
Draft202012Validator(schemas["entity.schema.json"]).validate(example)
print("PASS: 5 meta-schema và ví dụ Entity")
```

Validator là công cụ phát triển; không thêm dependency này vào frontend. Chạy từ thư mục gốc `web`. Kiểm tra cú pháp repository bằng `node scripts/check-repo.mjs`; script này bỏ qua file rỗng và không thay thế schema validation hoặc kiểm tra tham chiếu liên file.

## 5. Kết quả kiểm tra ngày 30/10/2026

| Kiểm tra | Kết quả và phạm vi |
|---|---|
| Parse JSON và Draft 2020-12 meta-schema | 5/5 schema đạt |
| Cấu trúc Article/Story/Timeline | 79 ca đúng/sai đạt; fixture kỹ thuật trong bộ nhớ |
| Prefix evt/per/ppl/plc/src | 40 ca ID đúng/sai đạt trên schema tương ứng |
| Ví dụ Entity trong mục 4 | Parse JSON và validation đạt; không ghi thêm file |
| HTTP localhost | 5/5 schema trả 200, MIME application/json; bytes khớp file local, JSON tải qua HTTP đạt meta-schema |
| `node scripts/check-repo.mjs` | JSON 5, JavaScript 1, placeholder rỗng bỏ qua 156, lỗi 0 |
| Browser Console | Chưa kiểm tra lại trong lượt viết báo cáo này; không suy kết quả Console từ HTTP |

Các ca cấu trúc bao gồm thiếu trường, văn bản trắng, trường lạ, trạng thái sai, Article published thiếu Context/body/nguồn, scene thiếu hoặc sai payload, tham chiếu sai loại và ID lặp. Ca ID gồm một ID đúng và bảy ID sai cho mỗi prefix. Các fixture published dùng dữ liệu tổng hợp để kiểm tra cấu trúc, không được coi là tài nguyên lịch sử đã công bố.

Checkout hiện tại **không có `tests/test_schema_contract.py`**. Các con số 79 và 40 là ca kiểm tra chạy trong bộ nhớ từ công cụ kiểm tra local, không phải một test suite đã thêm vào repository. Không sử dụng lại kết quả “20/20 test” của checkout trước để mô tả hiện trạng.

Đã rà tám tên file JSON thuộc năm nhóm được giao: evt 1, per 4, ppl 1, plc 1, src 1. Tên file đúng quy tắc ID, nhưng cả tám file vẫn **0 byte**, chưa phải JSON hợp lệ. Kết quả schema đạt không có nghĩa dataset đã hoàn chỉnh. HTTP server chỉ bind localhost và đã dừng sau kiểm tra.

Lượt Console trước ngày 29/10/2026 không ghi nhận warn/error khi mở trang scaffold và các URL JSON đã kiểm tra tại thời điểm đó. Kết quả cũ không thay thế kiểm tra Console của bản cuối hoặc kiểm thử đầy đủ luồng sản phẩm. Không có kết luận về Chrome/Firefox, responsive hoặc renderer hoàn chỉnh trong báo cáo này.

## 6. Giới hạn và phần cần nhóm review

Schema một file chưa kiểm tra được:

1. Resource ID duy nhất giữa các file, tên file khớp `id`, tham chiếu tồn tại và đích đủ điều kiện công bố.
2. `Entity.articleId` chọn đúng bài chính và bài đó có `Article.entityId` trỏ lại Entity. Các bài khác cùng đề cập một Entity không tự trở thành bài chính.
3. Entity và Article cùng đủ điều kiện hiển thị trong danh mục; Source thực sự truy lại được; các nhận định có nguồn phù hợp.
4. Story trỏ đúng Article/chủ thể; mọi section/media/timeline có thật; lời dẫn có nguồn; media có alt, chú thích và quyền sử dụng cần thiết.
5. Timeline dùng Event hợp lệ, giữ nhãn niên đại gốc, sắp theo `time.sortYear`, thứ tự biên soạn và ID; không tạo độ chính xác lịch sử từ vị trí trong mảng.
6. Quan hệ không tự liên kết, không lặp target dưới nhãn khác, chỉ tới bài được công bố. Không tự suy quan hệ ngược hoặc tính đúng lịch sử từ ID.

`scripts/validate-content.js` còn placeholder. Cần review nhóm về tên trường Article (`body` so với fixture `content`), anchor section/scene, điều kiện published, nguồn của Story và cách biên tập thứ tự Timeline trước khi tích hợp các phần phụ thuộc. Báo cáo ghi nhận schema local hiện có, không tuyên bố nhóm đã duyệt các contract này.

## 7. Đối chiếu công việc và nghiệm thu

| Yêu cầu | Trạng thái |
|---|---|
| Đọc schema và ghi trường bắt buộc | Đã ghi cho đủ 5 schema, bao gồm điều kiện published |
| Kiểm tra evt/per/ppl/plc/src | 40 ca ID đạt; tên tám file dữ liệu phù hợp quy tắc |
| Xác nhận prefix + bốn chữ số, không gạch nối | Đã kiểm tra; anchor nội bộ section/scene được phân biệt rõ |
| Có ví dụ JSON đúng schema và kiểm tra cú pháp | Có ví dụ trong mục 4, đã parse/validate trong bộ nhớ theo yêu cầu không tạo thêm file ví dụ |
| Schema thống nhất, không tự đổi thiết kế khi chưa trao đổi nhóm | Cấu trúc local cùng dùng Draft 2020-12; việc chấp thuận contract của nhóm vẫn còn chờ. Lượt này không sửa schema |
| Kiểm tra HTTP, không lỗi Console nghiêm trọng | HTTP đạt; Console bản cuối chưa kiểm tra lại, chưa xác nhận đầy đủ tiêu chí |
| PR gắn issue, thành viên khác review trước Done | Chưa tạo PR trong phiên làm việc; chưa có bằng chứng review của thành viên nhóm |

**Chưa đủ điều kiện ghi Done cho IE104-45.** PR cần gắn issue IE104-45 và dùng template nhóm cung cấp; reviewer của nhóm xác nhận phạm vi, quy ước code, lỗi, thông tin bí mật và bằng chứng kiểm thử. Lệnh cấm commit/push vẫn có hiệu lực; báo cáo này không tạo PR hoặc thay đổi trạng thái Jira.
