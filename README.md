# Hệ Thống Quản Lý Mua Sắm Online

Bài tập lớn môn **Phát triển ứng dụng Mobile đa nền tảng**.

## Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Mobile App | .NET MAUI (Android + iOS) |
| Backend API | ASP.NET Core 8 Web API |
| Database | MySQL |
| Auth | JWT + ASP.NET Core Identity |
| Real-time | SignalR (Chat) |
| Thanh toán | VNPay |

## Tính năng

- 🔐 Đăng ký / Đăng nhập (JWT)
- 🛍️ Duyệt & tìm kiếm sản phẩm
- 🛒 Giỏ hàng & đặt hàng
- 💳 Thanh toán (COD / VNPay)
- 📦 Quản lý đơn hàng (Admin)
- ⭐ Đánh giá sản phẩm
- 💬 Chat real-time (SignalR)

## Cấu trúc dự án

```
ShoppingSystem/
├── ShoppingSystem.Domain/        # Entities, Interfaces, Enums
├── ShoppingSystem.Application/   # DTOs, Use Cases, Validators
├── ShoppingSystem.Infrastructure/# EF Core, Repositories, VNPay
├── ShoppingSystem.API/           # Controllers, SignalR Hub
└── ShoppingSystem.Mobile/        # .NET MAUI App (MVVM)
```

## Database

File `sql.sql` chứa schema MySQL đầy đủ cho dự án.

## Cài đặt & Chạy

### Yêu cầu
- .NET 8 SDK
- MySQL 8.x
- `dotnet workload install maui`
- Android Emulator

### Backend
```bash
# Cập nhật connection string trong appsettings.json
cd ShoppingSystem.API
dotnet ef database update
dotnet run
```

### Mobile
```bash
cd ShoppingSystem.Mobile
dotnet build -t:Run -f net8.0-android
```
