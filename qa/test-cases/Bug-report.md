# Test Summary - Comments Feature

**Tester:** Phúc
**Test Date:** 2026-07-12
**Updated Date:** 2026-07-21
## Results

| Total TC | Pass | Fail | Blocked |
|----------|------|------|---------|
| 23 | 23 | 0 | 0 |

*(Ghi chú: Toàn bộ 23 test cases kịch bản chức năng (functional) đều pass 100%. Tuy nhiên, 2 bug UI/UX liệt kê bên dưới được phát hiện thêm trong lúc kiểm thử thăm dò (exploratory testing) với các trường hợp nhập liệu ngẫu nhiên (chuỗi quá dài, nhiều khoảng trắng). Do các lỗi này thuần túy về layout và trải nghiệm hiển thị chứ không làm gãy luồng logic của chức năng chính, nên số lượng TC Fail được ghi nhận là 0, nhưng bug vẫn được log lại để cải thiện UI.)*

## Bugs Found on UI/UX
| Bug | Severity | Issue | Fix PR | Status |
|-----|----------|-------|--------|--------|
| Long comment string (no spaces) overflows layout | Minor | #192 | https://github.com/dinhlongvu/fullstack-training-2026/pull/194 | ✅ Fixed |
| Unexpected large gap within comment content | Minor | #193 | https://github.com/dinhlongvu/fullstack-training-2026/pull/196 | ✅ Fixed |

## Verdict
✅ 2 bugs found - All fixed
