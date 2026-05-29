# Setup Guide

Hướng dẫn cài đặt môi trường phát triển local cho dự án Fullstack Training 2026.

## Prerequisites

Cài đặt các công cụ sau (theo thứ tự):

### 1. .NET SDK 8.0

```bash
# macOS (Homebrew)
brew install dotnet-sdk

# Windows — tải từ: https://dotnet.microsoft.com/download

# Verify
dotnet --version  # phải hiện 8.0.x
```

### 2. Node.js 20 LTS

```bash
# macOS (Homebrew)
brew install node@20

# Windows — tải từ: https://nodejs.org/

# Verify
node --version   # phải hiện v20.x.x
npm --version    # phải hiện 10.x.x
```

### 3. Visual Studio Code (recommended)

Tải từ: https://code.visualstudio.com/

Extensions nên cài:
- C# Dev Kit (Microsoft)
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter

### 4. Git

```bash
# macOS — đã có sẵn
git --version

# Windows — tải từ: https://git-scm.com/
```

## Clone & Run

```bash
# 1. Clone repository
git clone https://github.com/dinhlongvu/fullstack-training-2026.git
cd fullstack-training-2026

# 2. Run Backend
cd backend
dotnet restore
dotnet run
# API chạy tại: https://localhost:5001

# 3. Run Frontend (mở terminal mới)
cd frontend
npm install
npm run dev
# App chạy tại: http://localhost:5173
```

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|----------|
| `dotnet: command not found` | Cài .NET SDK (bước 1) |
| `npm: command not found` | Cài Node.js (bước 2) |
| `dotnet restore` lỗi | Kiểm tra kết nối mạng, thử `dotnet nuget locals all --clear` |
| `npm install` lỗi | Xóa `node_modules` và `package-lock.json`, chạy lại |
| Port 5001 đã dùng | Đổi port trong `backend/Properties/launchSettings.json` |
| Port 5173 đã dùng | Vite sẽ tự động chọn port khác |

## Database

Mặc định dùng SQLite (file-based, không cần cài thêm). Connection string trong `appsettings.Development.json`.

---

*Có vấn đề gì thì hỏi mentor nhé!*
