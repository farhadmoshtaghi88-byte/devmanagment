
# معماری سیستم DevManager Pro

## ۱. ساختار سیستم (System Architecture)
این سیستم به صورت **Decoupled Architecture** طراحی شده است:
- **Frontend:** React + Tailwind CSS (SPA)
- **Backend:** Django Rest Framework (DRF)
- **Database:** PostgreSQL (رابطه‌ای برای حفظ یکپارچگی داده‌ها)
- **Cache:** Redis (برای نوتیفیکیشن‌ها و تسریع کوئری‌ها)
- **File Storage:** S3 / MinIO (برای پیوست قراردادها و مستندات)

## ۲. مدل داده (Database Schema)
روابط کلیدی:
- **Client (1) -> (*) Project:** هر مشتری چندین پروژه دارد.
- **Project (1) -> (*) Task:** پروژه‌ها شامل وظایف هستند.
- **Project (1) -> (*) Server:** پروژه‌ها روی سرورهای خاص مستقر می‌شوند.
- **Project (1) -> (*) Invoice:** تراکنش‌های مالی مربوط به پروژه.

## ۳. امنیت (Security)
- **Authentication:** JWT با قابلیت Refresh Token.
- **Sensitive Data:** رمزنگاری متقارن (AES) برای پسوردهای سرور و دیتابیس در لایه بک‌اند.
- **Role-Based Access (RBAC):** آماده‌سازی برای SaaS با نقش‌های (Owner, Admin, Viewer).

## ۴. مسیر توسعه (Roadmap)
- **فاز ۱ (MVP):** داشبورد، مدیریت مشتریان، پروژه‌ها و تسک‌های پایه.
- **فاز ۲:** مدیریت سرور و دامنه همراه با سیستم یادآوری انقضا.
- **فاز ۳:** بخش مالی، تولید فاکتور PDF و گزارشات درآمد.
- **فاز ۴:** مستندات پیشرفته و قابلیت چندکاربره (SaaS Ready).
