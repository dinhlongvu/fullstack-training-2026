# Test Summary - Comments Feature

**Tester:** Phúc
**Test Date:** 2026-07-12
**Updated Date:** 2026-07-21
## Results

| Total TC | Pass | Fail | Blocked |
|----------|------|------|---------|
| 25 | 23 | 2 | 0 |

*(Ghi chú: Trong tổng số 25 test cases, có 23 test cases kịch bản chức năng (functional) đều pass 100%. 2 test cases Fail (TC-TASK-COMMENTS-CREATE-011 và 012) là các trường hợp kiểm thử UI/UX được bổ sung sau khi phát hiện qua kiểm thử thăm dò (exploratory testing) với các trường hợp nhập liệu ngẫu nhiên. Các lỗi này thuần túy về layout và trải nghiệm hiển thị chứ không làm gãy luồng logic của chức năng chính.)*

## Bugs Found on UI/UX
| Bug | Severity | Issue | Fix PR | Status |
|-----|----------|-------|--------|--------|
| Long comment string (no spaces) overflows layout | Minor | #192 | https://github.com/dinhlongvu/fullstack-training-2026/pull/194 | ✅ Fixed |
| Unexpected large gap within comment content | Minor | #193 | https://github.com/dinhlongvu/fullstack-training-2026/pull/196 | ✅ Fixed |

## Verdict
✅ 2 bugs found - All fixed
