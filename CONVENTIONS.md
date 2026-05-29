# Coding Conventions

Quy ước code chung cho dự án Fullstack Training 2026.

---

## General

- **Ngôn ngữ**: Code và comment bằng tiếng Anh
- **Indentation**: 4 spaces (không dùng tab)
- **Line ending**: LF (\\n)
- **File encoding**: UTF-8
- **Trailing whitespace**: Không để khoảng trắng cuối dòng

## Git

### Branch Naming

```
intern-X/task-XX-short-description

Ví dụ:
intern-a/task-01-user-crud-api
intern-b/task-03-product-list-ui
```

### Commit Messages

```
type(scope): short description

Types: feat, fix, refactor, docs, style, test, chore

Ví dụ:
feat(api): add GET /api/users endpoint
fix(ui): resolve login button not responding
docs(readme): update setup instructions
refactor(service): extract validation logic
```

### Pull Requests

Mỗi PR phải có:
- **Title**: ngắn gọn mô tả thay đổi
- **Description**:
  - Mục đích của PR
  - Cách test (manual test cases)
  - Screenshot (nếu thay đổi UI)
- **Linked Issue**: `Closes #XX`

---

## Backend (C#)

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Class | PascalCase | `UserController` |
| Method | PascalCase | `GetUserById` |
| Property | PascalCase | `FirstName` |
| Variable | camelCase | `userId` |
| Private field | _camelCase | `_dbContext` |
| Constant | PascalCase | `MaxRetryCount` |
| Interface | IPascalCase | `IUserService` |
| Async method | PascalCase + Async | `GetUsersAsync` |

### File Structure

```
Controllers/
├── UserController.cs       ← Mỗi controller 1 file
├── ProductController.cs
Services/
├── IUserService.cs         ← Interface + implementation
├── UserService.cs
Models/
├── User.cs                 ← Entity models
├── CreateUserDto.cs        ← DTOs tách riêng
```

### API Conventions

- Sử dụng attribute routing: `[Route("api/[controller]")]`
- Return `ActionResult<T>` hoặc `IActionResult`
- Validate input với Data Annotations hoặc FluentValidation
- Dùng async/await cho tất cả I/O operations
- Trả về đúng HTTP status codes:
  - `200 OK` — success
  - `201 Created` — resource created
  - `400 Bad Request` — invalid input
  - `404 Not Found` — resource not found
  - `500 Internal Server Error` — unexpected errors

---

## Frontend (React + TypeScript)

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Component file | PascalCase.tsx | `UserTable.tsx` |
| Hook file | camelCase.ts | `useUsers.ts` |
| Service file | camelCase.ts | `userService.ts` |
| CSS Module | PascalCase.module.css | `UserTable.module.css` |
| Interface/Type | PascalCase | `User`, `CreateUserDto` |
| Variable/Function | camelCase | `userList`, `fetchUsers` |

### Component Structure

```tsx
// 1. Imports (React → third-party → local)
import { useState, useEffect } from 'react';
import axios from 'axios';
import { User } from '../types';

// 2. Types/Interfaces (nếu chỉ dùng trong file này)
interface Props {
  onSelect: (user: User) => void;
}

// 3. Component
export function UserTable({ onSelect }: Props) {
  // State hooks
  const [users, setUsers] = useState<User[]>([]);
  
  // Effects
  useEffect(() => { /* ... */ }, []);
  
  // Event handlers
  const handleClick = (user: User) => { /* ... */ };
  
  // Render
  return ( /* JSX */ );
}
```

### API Calls

- Tất cả API calls thông qua service functions trong `services/`
- Dùng `axios` hoặc `fetch` với error handling
- Không gọi API trực tiếp trong component

### Styling

- CSS Modules (mặc định) hoặc Tailwind CSS
- Không inline styles (trừ dynamic values)
- Responsive design: mobile-first

---

## General Best Practices

1. **DRY** — đừng lặp code, extract thành function/component
2. **Single Responsibility** — mỗi function/class chỉ làm 1 việc
3. **Early return** — ưu tiên return sớm thay vì nested if
4. **Meaningful names** — đặt tên rõ ràng, không viết tắt khó hiểu
5. **No dead code** — không comment-out code, xóa hẳn đi
6. **Error handling** — luôn bắt và xử lý lỗi, không bỏ qua
7. **TypeScript strict mode** — tránh dùng `any`

---

*Có gì không rõ thì hỏi mentor — không có câu hỏi nào là ngớ ngẩn!*
