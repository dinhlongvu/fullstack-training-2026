# Test Case Template

Dùng template này khi viết test case cho mỗi feature. Copy file này, đổi tên theo feature
(vd: `auth/01-register.md`, `auth/02-login.md`) rồi điền nội dung.

Một test case tốt phải **cụ thể, lặp lại được, không mơ hồ** — người khác cầm vào chạy được ngay
mà không cần hỏi lại. Tham khảo `docs/pre-study/qa-02-test-case-design.md` cho kỹ thuật thiết kế
(Equivalence Partitioning, Boundary Value Analysis, Decision Table, State Transition).

---

# Test Cases: [Tên Feature]

- **Feature:** (link đến feature issue gốc, vd: #12)
- **Endpoint / Page:** (vd: `POST /api/auth/login` hoặc `/login`)
- **Author:** Phúc
- **Date:** YYYY-MM-DD
- **Test Data chung:** (tài khoản/seed dữ liệu dùng lại nhiều lần, nếu có)

---

## TC-XXX-001: [Tiêu đề ngắn, mô tả mục tiêu kiểm thử]

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-XXX-001 |
| **Loại** | Positive / Negative |
| **Kỹ thuật** | (vd: Boundary Value — password 7 ký tự) |
| **Precondition** | (điều kiện trước khi chạy, vd: user `a@b.com` đã tồn tại) |
| **Test Data** | (input cụ thể, vd: email=`a@b.com`, password=`1234567`) |
| **Test Steps** | 1. ... <br> 2. ... <br> 3. ... |
| **Expected Result** | (kết quả mong đợi: HTTP status + body/UI cụ thể) |
| **Actual Result** | _(để trống — điền khi chạy)_ |
| **Status** | ⬜ Not Run / ✅ Pass / ❌ Fail / ⛔ Blocked |
| **Bug link** | _(nếu Fail, link đến issue bug đã tạo)_ |

---

## TC-XXX-002: [Tiêu đề]

| Field | Nội dung |
|-------|----------|
| **Test Case ID** | TC-XXX-002 |
| **Loại** | Positive / Negative |
| **Kỹ thuật** | |
| **Precondition** | |
| **Test Data** | |
| **Test Steps** | 1. ... <br> 2. ... |
| **Expected Result** | |
| **Actual Result** | _(để trống)_ |
| **Status** | ⬜ Not Run |
| **Bug link** | |

---

## Checklist độ phủ (xoá phần không liên quan)

- [ ] **Happy path** — input hợp lệ, luồng chính chạy đúng
- [ ] **Validation** — thiếu field bắt buộc, sai định dạng (email, độ dài password)
- [ ] **Boundary** — giá trị ở biên (vd: password đúng 8 ký tự vs 7 ký tự)
- [ ] **Negative** — input sai, sai credentials, trùng dữ liệu (duplicate)
- [ ] **Auth/Authorization** — không token / token sai / token hết hạn (nếu endpoint cần auth)
- [ ] **Error shape** — body lỗi đúng cấu trúc (`errors[]`, `error`), đúng HTTP status

---

## Tổng kết (điền sau khi chạy hết)

| Tổng số TC | Pass | Fail | Blocked | Not Run |
|:---:|:---:|:---:|:---:|:---:|
| 0 | 0 | 0 | 0 | 0 |

Bug đã tạo: _(liệt kê link issue)_
