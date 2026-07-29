# Test Summary - Projects Feature

**Tester:** Phúc
**Test Date:** 2026-07-22
**Updated Date:** 2026-07-22
## Results

| Total TC | Pass | Fail | Blocked |
|----------|------|------|---------|
| 56 | 56 | 0 | 0 |

*(Ghi chú: Toàn bộ các test cases kịch bản chức năng API đều pass 100% khi test độc lập dưới backend. Tuy nhiên, qua quá trình kiểm thử tích hợp (integration) và UI trên giao diện frontend, đã phát hiện ra 3 lỗi: 1 lỗi thuần về layout hiển thị (UI), 1 lỗi về quản lý state (không cập nhật member count ở danh sách sau khi thêm thành viên) và 1 lỗi về logic phân tích URL query (multiple priority). Cả 3 lỗi này đã được bổ sung thành 3 test cases tương ứng ở frontend và đều đã verify Passed sau khi bug được fix.)*

## Bugs Found on Frontend (Integration / UI / UX)
| Bug | Severity | Issue | Fix PR | Status |
|-----|----------|-------|--------|--------|
| PROJECT MEMBER COUNT NOT UPDATED ON PROJECT LIST AFTER ADDING MEMBER | Medium | [#136](https://github.com/dinhlongvu/fullstack-training-2026/issues/136) |https://github.com/dinhlongvu/fullstack-training-2026/pull/149 | ✅ Closed |
| Priority filter does not apply correctly when multiple priority values are provided in the query parameter | Medium | [#146](https://github.com/dinhlongvu/fullstack-training-2026/issues/146) |https://github.com/dinhlongvu/fullstack-training-2026/pull/151 | ✅ Closed |
| [UI] Long Created At value breaks task card layout | Minor | [#115](https://github.com/dinhlongvu/fullstack-training-2026/issues/115) |https://github.com/dinhlongvu/fullstack-training-2026/pull/128 | ✅ Closed |

## Verdict
✅ 3 bugs found - All fixed
