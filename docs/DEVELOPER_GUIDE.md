# راهنمای جامع اجرای مستقل اپلیکیشن‌ها و مدیریت دیتابیس مشترک
### پلتفرم چندمحصولی تنیس (Coach Assistant Platform)

این راهنما شیوه اجرای مستقل هر یک از اپلیکیشن‌ها (فرانت‌اند و بک‌اند) و نحوه اتصال به پایگاه داده مرکزی PostgreSQL را به صورت گام‌به‌گام توضیح می‌دهد.

---

## ۱. نقشه پورت‌ها و سرویس‌های پلتفرم

برای اینکه سرویس‌ها بدون تداخل به صورت هم‌زمان یا مستقل اجرا شوند، پورت‌های زیر استاندارد شده‌اند:

| سرویس | بخش | پورت پیش‌فرض | فناوری | آدرس Swagger / پنل |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL مشترک** | دیتابیس | `5432` | PostgreSQL 16 (داکر) | اتصال محلی |
| **platform-core** | بک‌اند هسته | `8000` | FastAPI | `http://localhost:8000/docs` |
| **coach-assistant** | بک‌اند مربی | `8001` | FastAPI | `http://localhost:8001/docs` |
| **coach-assistant** | کلاینت موبایل | `8081` (Metro) | Expo SDK 58 / React Native | اپلیکیشن مربی |
| **ai-coach** | بک‌اند هوش مصنوعی | `8002` | FastAPI | `http://localhost:8002/docs` |
| **ai-coach** | کلاینت موبایل | `8082` (Metro) | Expo / React Native | اپلیکیشن تنیس‌پایلوت |

---

## ۲. پایگاه داده مرکزی PostgreSQL و مدیریت شِماها (Schemas)

### ۲.۱. ساختار یکپارچه دیتابیس
تمام سرویس‌های پلتفرم از **یک دیتابیس PostgreSQL** مشترک به نام `tennis_platform_db` استفاده می‌کنند. برای جلوگیری از تداخل جداول و حفظ استقلال، داده‌ها در سه شِمای مجزا نگهداری می‌شوند:
1. `core`: جداول کاربران مرکزی، پروفایل مربیان، بازیکنان سراسری، کدهای دعوت و نشست‌ها.
2. `coach_ops`: جداول کلاس‌ها، ترم‌ها، جلسات، حضور و غیاب، حسابداری و شهریه مربی (`tennis-coach`).
3. `ai_coach`: جداول مسابقات، امتیازات زنده، ضربات و تحلیل‌های هوش مصنوعی (`TennisPilot`).

### ۲.۲. روش راه‌اندازی دیتابیس مشترک با Docker (روش استاندارد)
در ریشه پروژه، فایل داکر برای بالا آوردن PostgreSQL همراه با ساخت خودکار شِماها آماده است:

```bash
# راه‌اندازی دیتابیس مشترک در پس‌زمینه
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

> **نکته:** پس از اجرا، فایل `infrastructure/docker/init-schemas.sql` به صورت خودکار سه شِمای `core` و `coach_ops` و `ai_coach` را می‌سازد.

مشخصات اتصال:
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `tennis_platform_db`
- **User:** `tennis_admin`
- **Password:** `tennis_password_dev`

### ۲.۳. تنظیم رشته اتصال (DATABASE_URL) در هر سرویس
برای اینکه هر بک‌اند به شِمای اختصاصی خود وصل شود، در فایل `.env` هر بک‌اند رشته اتصال زیر را قرار دهید:

- **در `platform-core/backend/.env`:**
  ```env
  DATABASE_URL=postgresql+psycopg2://tennis_admin:tennis_password_dev@localhost:5432/tennis_platform_db?options=-csearch_path%3Dcore,public
  ```

- **در `products/coach-assistant/backend/.env`:**
  ```env
  DATABASE_URL=postgresql+psycopg2://tennis_admin:tennis_password_dev@localhost:5432/tennis_platform_db?options=-csearch_path%3Dcoach_ops,public
  ```

- **در `products/ai-coach/backend/.env`:**
  ```env
  DATABASE_URL=postgresql+psycopg2://tennis_admin:tennis_password_dev@localhost:5432/tennis_platform_db?options=-csearch_path%3Dai_coach,public
  ```

### ۲.۴. اجرای سریع در لوکال بدون داکر (حالت SQLite)
اگر در حال حاضر نمی‌خواهید داکر را اجرا کنید، هر دو بک‌اند همچنان قابلیت اجرای محلی با فایل SQLite پیش‌فرض خود را دارند:
- تنیس‌کوچ با `sqlite:///./tennis_coach.db`
- تنیس‌پایلوت با `sqlite:///./tennis.db`

---

## ۳. نحوه اجرای مستقل محصول ۱: مربی تنیس (coach-assistant)

این محصول مدیریت شاگردان، ترم‌ها، جلسات کورت، حضور و غیاب و شهریه را بر عهده دارد.

### ۳.۱. اجرای بک‌اند مربی (FastAPI)
در ترمینال اول:
```powershell
# ورود به پوشه بک‌اند مربی
cd products/coach-assistant/backend

# فعال‌سازی محیط مجازی پایتون (در ویندوز)
.venv\Scripts\Activate.ps1

# اجرای سرور روی پورت 8001
python -m uvicorn app.main:app --reload --port 8001
```
> مستندات Swagger بک‌اند در دسترس است: [http://localhost:8001/docs](http://localhost:8001/docs)

### ۳.۲. اجرای کلاینت موبایل مربی (React Native)
در ترمینال دوم:

**روش الف) از ریشه پروژه با pnpm (سریع‌ترین روش):**
```powershell
pnpm run dev:coach
# یا برای اجرای مستقیم روی شبیه‌ساز/گوشی اندروید:
pnpm run android:coach
```

**روش ب) مستقیماً از درون پوشه محصول:**
```powershell
cd products/coach-assistant/mobile
npx expo start
# یا:
npm run android
```

---

## ۴. نحوه اجرای مستقل محصول ۲: دستیار هوش مصنوعی (ai-coach / TennisPilot)

این محصول ثبت بازی، ثبت زنده امتیازات و ضربات و تحلیل عملکرد بازیکن با هوش مصنوعی را انجام می‌دهد.

### ۴.۱. اجرای بک‌اند هوش مصنوعی (FastAPI)
در ترمینال سوم:
```powershell
# ورود به پوشه بک‌اند تنیس‌پایلوت
cd products/ai-coach/backend

# در صورت نیاز به ساخت venv مجزا:
# python -m venv .venv
# .venv\Scripts\Activate.ps1
# pip install -r requirements.txt

# اجرای سرور روی پورت 8002
python -m uvicorn app.main:app --reload --port 8002
```
> مستندات Swagger بک‌اند تنیس‌پایلوت در دسترس است: [http://localhost:8002/docs](http://localhost:8002/docs)

### ۴.۲. اجرای کلاینت موبایل هوش مصنوعی (React Native)
در ترمینال چهارم:

**روش الف) از ریشه پروژه با pnpm:**
```powershell
pnpm run dev:ai
# یا برای اجرای مستقیم روی اندروید:
pnpm run android:ai
```

**روش ب) مستقیماً از درون پوشه محصول:**
```powershell
cd products/ai-coach/mobile
npx expo start --port 8082
# یا:
npm run android
```

---

## ۵. نحوه اجرای سرویس مرکزی (platform-core)

این سرویس برای احراز هویت متمرکز (Central Auth)، صدور توکن مشترک JWT و کدهای اتصال شاگرد-مربی است:

```powershell
cd platform-core/backend
# اجرای سرور روی پورت 8000
python -m uvicorn main:app --reload --port 8000
```
> مستندات Swagger هسته پلتفرم: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ۶. استفاده از پکیج‌های اشتراکی در کلاینت‌ها

تمام کامپوننت‌های بصری و استایل‌های تنیس‌کوچ در پکیج `@tennis-platform/design-system` قرار گرفته‌اند.

### ۶.۱. استفاده در تنیس‌کوچ (`coach-assistant/mobile`)
پروژه تنیس‌کوچ بدون هیچ‌گونه تغییری در مسیرهای قبلی (`src/shared/components/...`) به کار خود ادامه می‌دهد.

### ۶.۲. استفاده در تنیس‌پایلوت (`ai-coach/mobile`)
در هر صفحه‌ای از تنیس‌پایلوت برای استفاده از دکمه‌ها، فیلدهای ورودی و تم یکپارچه تنیس‌کوچ، کافیست کامپوننت‌ها را از دیزاین‌سیستم فراخوانی کنید:
```tsx
import { Button, AppText, Card, TextField } from '@tennis-platform/design-system';
```

---

## ۷. خلاصه دستورات کلیدی (Cheatsheet)

| دستور | کاربرد |
| :--- | :--- |
| `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d` | روشن کردن دیتابیس مشترک PostgreSQL |
| `docker compose -f infrastructure/docker/docker-compose.dev.yml down` | خاموش کردن دیتابیس مشترک |
| `pnpm run dev:coach` | استارت مترو اپلیکیشن مربی تنیس |
| `pnpm run android:coach` | نصب و بیلد اندروید اپلیکیشن مربی |
| `pnpm run dev:ai` | استارت مترو اپلیکیشن هوش مصنوعی (تنیس‌پایلوت) |
| `pnpm run android:ai` | نصب و بیلد اندروید اپلیکیشن هوش مصنوعی |
