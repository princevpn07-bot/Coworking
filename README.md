# Coworking Space 管理系統

共享辦公空間的後台系統，包含場地預訂、會員與員工管理、設備追蹤、金流整合等功能。

## 使用技術

**前端**：Angular 21 + TypeScript，搭配 Three.js、Leaflet、GSAP

**後端**：ASP.NET Core 8 + Entity Framework Core

**資料庫**：SQL Server

**第三方整合**：ECPay 綠界金流、LINE Bot、OpenAI

---

## 專案結構

```
webproject/
├── coworking-admin/    # Angular 前端
├── CoworkingAPI/       # .NET 後端
└── CoworkingDB.sql     # 資料庫 Schema
```

---

## 啟動方式

### 後端

```bash
cd CoworkingAPI
dotnet restore
dotnet run
```

Swagger 文件：`http://localhost:{port}/swagger`

### 前端

```bash
cd coworking-admin
npm install
npm start
```

前端運行於 `http://localhost:4200`

---

## 環境設定

將 `CoworkingAPI/appsettings.json` 裡的佔位字串替換成實際的值：

- `ConnectionStrings.DefaultConnection` — SQL Server 連線字串
- `AI.ApiKey` — AI 服務金鑰
- `Line.ChannelSecret` / `ChannelAccessToken` — LINE Bot 設定
- `JwtSettings.Key` — JWT 密鑰（至少 256 bits）
- `EmailSettings` — Gmail 寄件帳號與 App 密碼
- `ECPay` — 綠界特店編號、HashKey、HashIV、回調 URL
