# پلتفرم چندمحصولی دستیار مربی تنیس (Coach Assistant Platform)

پلتفرم جامع و یکپارچه شامل محصولات مستقل تنیس، طراحی‌شده بر پایه **معماری محصول‌محور (Product-Centric Monorepo)**، دیزاین سیستم مشترک بر مبنای Atomic Design، احراز هویت متمرکز و پایگاه داده مشترک PostgreSQL با تفکیک شِماها (Schema Isolation).

---

## ۱. محصولات پلتفرم

1. **مدیریت مربی تنیس (`products/coach-assistant`):**
   - **موبایل:** اپلیکیشن حرفه‌ای React Native (Expo SDK 58 / Expo Router v5) برای مدیریت شاگردان، کلاس‌ها، جلسات کورت، حضور و غیاب، تقویم جلالی، شهریه و حسابداری مربی.
   - **بک‌اند:** سرویس عملیاتی مربی (Python FastAPI + PostgreSQL Schema: `coach_ops`).

2. **دستیار هوش مصنوعی تنیس‌پایلوت (`products/ai-coach`):**
   - **موبایل:** اپلیکیشن React Native برای ثبت بازی‌ها، ثبت زنده امتیازات و ضربات، نمودارهای آماری و گزارش‌های هوش مصنوعی.
   - **بک‌اند:** سرویس مسابقات و تحلیل هوش مصنوعی (Python FastAPI + PostgreSQL Schema: `ai_coach`).

3. **هسته مشترک پلتفرم (`platform-core`):**
   - سرویس مرکزی هویت، احراز هویت (Single Sign-On / JWT)، بانک سراسری بازیکنان و کدهای دعوت شاگرد-مربی (Schema: `core`).

4. **پکیج‌های اشتراکی (`packages/*`):**
   - `@tennis-platform/design-system`: دیزاین‌سیستم بر پایه تم تنیس‌کوچ با فونت وزیرمتن و پشتیبانی از هویت‌های بصری فرعی.
   - `@tennis-platform/shared-types`: تایپ‌های مشترک TypeScript.
   - `@tennis-platform/shared-utils`: توابع تاریخ شمسی جلالی، فرمت پول و اعداد.
   - `@tennis-platform/shared-hooks`: هوک‌های عمومی کلاینت.

---

## ۲. راهنمای شروع سریع و اجرای پروژه‌ها

مستندات گام‌به‌گام و کامل در فایل زیر در دسترس است:
👉 **[راهنمای جامع توسعه‌دهنده (DEVELOPER_GUIDE.md)](docs/DEVELOPER_GUIDE.md)**
👉 **[سند معماری فنی سیستم (TEN_PLATFORM_ARCHITECTURE.md)](docs/TEN_PLATFORM_ARCHITECTURE.md)**

### ۲.۱. روشن کردن دیتابیس مشترک PostgreSQL
```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```
> شِماهای `core`, `coach_ops`, `ai_coach` به صورت خودکار ایجاد می‌شوند.

### ۲.۲. اجرای اپلیکیشن مربی تنیس (coach-assistant)
- **بک‌اند:**
  ```powershell
  cd products/coach-assistant/backend
  .venv\Scripts\Activate.ps1
  python -m uvicorn app.main:app --reload --port 8001
  ```
- **موبایل:**
  ```powershell
  pnpm run dev:coach
  # یا در شبیه‌ساز/گوشی اندروید:
  pnpm run android:coach
  ```

### ۲.۳. اجرای دستیار هوش مصنوعی (ai-coach / TennisPilot)
- **بک‌اند:**
  ```powershell
  cd products/ai-coach/backend
  python -m uvicorn app.main:app --reload --port 8002
  ```
- **موبایل:**
  ```powershell
  pnpm run dev:ai
  # یا در شبیه‌ساز/گوشی اندروید:
  pnpm run android:ai
  ```

### ۲.۴. اجرای هسته مرکزی پلتفرم (platform-core)
```powershell
cd platform-core/backend
python -m uvicorn main:app --reload --port 8000
```

---

## ۳. نقشه پورت‌های محلی

| سرویس | بخش | پورت | آدرس Swagger |
| :--- | :--- | :--- | :--- |
| **PostgreSQL** | پایگاه داده مشترک | `5432` | `localhost:5432` |
| **platform-core** | بک‌اند هسته | `8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **coach-assistant** | بک‌اند مربی | `8001` | [http://localhost:8001/docs](http://localhost:8001/docs) |
| **coach-assistant** | اپ مربی | `8081` | مترو کلاینت |
| **ai-coach** | بک‌اند هوش مصنوعی | `8002` | [http://localhost:8002/docs](http://localhost:8002/docs) |
| **ai-coach** | اپ هوش مصنوعی | `8082` | مترو کلاینت |
