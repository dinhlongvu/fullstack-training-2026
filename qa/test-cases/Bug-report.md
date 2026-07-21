# Test Summary - Comments Feature

**Tester:** Phúc
**Test Date:** 2026-07-12
**Updated Date:** 2026-07-21

## Results

| Total TC | Pass | Fail | Blocked |
|----------|------|------|---------|
| 25 | 23 | 2 | 0 |

*(Ghi chú: 23 test cases chức năng (functional) ban đầu đều pass 100%. Tuy nhiên, trong quá trình kiểm thử thăm dò (exploratory testing) với các trường hợp nhập liệu ngẫu nhiên, mình đã phát hiện thêm 2 bug UI/UX nên đã bổ sung thành 2 test cases mới (TC-11 và TC-12) và đánh Fail để ghi nhận lỗi layout/hiển thị.)*

## Bugs Found on UI/UX
| Bug | Severity | Issue | Fix PR | Status |
|-----|----------|-------|--------|--------|
| Long comment string (no spaces) overflows layout | Minor | #192 | #194 | Fixed |
| Unexpected large gap within comment content | Minor | #193 | #196 | In Progress |

## Verdict
⚠️ 2 bugs found - #192 already fixed, #193 not fixed yet
