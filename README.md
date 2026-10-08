# مربی تنیس — Tennis Coach Manager

اپلیکیشن موبایل حرفه‌ای برای مدیریت شاگردان، کلاس‌ها، جلسات، حضور و غیاب، شهریه و برنامه‌های تمرینی مربی تنیس.

- **موبایل:** React Native (Expo SDK 57) + TypeScript + Expo Router — طراحی‌شده برای Android، آماده انتشار iOS از همان کد
- **بک‌اند:** Python FastAPI (REST، JWT + Refresh Token، RBAC)
- **دیتابیس:** PostgreSQL (برای تست سریع، SQLite هم پشتیبانی می‌شود)

---

## اجرای سریع (۳ قدم)

### ۱) بالا آوردن بک‌اند و دیتابیس با Docker (پیشنهادی)

پیش‌نیاز: Docker Desktop

```bash
cd tennis-coach
docker compose up -d --build          # PostgreSQL + API روی پورت 8000
docker compose exec api python -m app.jobs.seed   # داده نمایشی (اختیاری)
```

بررسی سلامت: <http://localhost:8000/health> — مستندات تعاملی API: <http://localhost:8000/docs>

### ۱-ب) اجرای بک‌اند بدون Docker

پیش‌نیاز: Python 3.11+ و PostgreSQL

```bash
cd tennis-coach/backend
python -m venv .venv
source .venv/bin/activate              # ویندوز: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                   # DATABASE_URL و JWT_SECRET را تنظیم کنید
alembic upgrade head                   # ساخت جداول
python -m app.jobs.seed                # داده نمایشی (اختیاری)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> بدون PostgreSQL، برای تست سریع: در `.env` مقدار `DATABASE_URL=sqlite:///./dev.db` بگذارید.
> `--host 0.0.0.0` لازم است تا گوشی شما در همان وای‌فای به API دسترسی داشته باشد.

### ۲) اجرای اپ موبایل

پیش‌نیاز: Node.js 20+ و روی گوشی اپ **Expo Go** (یا شبیه‌ساز Android Studio)

```bash
cd tennis-coach/mobile
npm install
cp .env.example .env    # آدرس API را تنظیم کنید (پایین را ببینید)
npx expo start
```

- **گوشی واقعی:** QR کد را با Expo Go اسکن کنید. گوشی و کامپیوتر باید در یک وای‌فای باشند و آدرس API برابر IP کامپیوتر باشد، مثلاً `EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api/v1`
  (IP را در ویندوز با `ipconfig` و در مک/لینوکس با `ifconfig` یا `ip a` پیدا کنید.)
- **شبیه‌ساز اندروید:** در ترمینال Expo کلید `a` را بزنید. آدرس پیش‌فرض `http://10.0.2.2:8000/api/v1` است و نیازی به تنظیم ندارد.
- **مرورگر (برای دیدن سریع UI):** کلید `w`.
- آدرس سرور را از صفحه ورود ← «تنظیمات سرور» هم می‌توانید بدون ری‌استارت عوض کنید.

### ۳) ورود با حساب‌های نمایشی (بعد از seed)

| نقش | ایمیل | موبایل | رمز |
|---|---|---|---|
| مربی | coach@demo.ir | 09120000000 | Demo1234 |
| شاگرد | ali@demo.ir | 09121111111 | Demo1234 |

در نسخه توسعه، دکمه‌های پرکردن خودکار این حساب‌ها روی صفحه ورود هست.

---

## ساخت APK / نسخه نهایی

Expo Go برای توسعه کافی است؛ برای **Push Notification واقعی** و **RTL بومی کامل** یک Development Build یا APK بسازید:

```bash
cd mobile
npx expo run:android                 # نیاز به Android Studio و SDK
# یا ساخت ابری بدون Android Studio:
npm i -g eas-cli && eas login
eas build -p android --profile preview      # خروجی APK قابل نصب
eas build -p android --profile production   # خروجی AAB برای Google Play
```

برای iOS همان کد با `eas build -p ios` ساخته می‌شود (نیاز به حساب Apple Developer).

---

## امکانات اصلی

**مربی**
- داشبورد: جلسه بعدی با شمارش معکوس و دکمه حضور و غیاب، جلسات امروز/آینده، تعداد شاگردان، درآمد ماه جاری و روند ۶ ماهه، بدهکاران، آخرین پرداخت‌ها، شاگردان با جلسات کم، یادآوری‌ها (حضور ثبت‌نشده، جبرانی معوق، پرداخت معوق، پایان ترم)
- شاگردان: افزودن/ویرایش/غیرفعال/حذف، سطح، نقاط قوت و ضعف، اهداف، یادداشت، تاریخچه حضور، وضعیت مالی، ترم‌ها و برنامه‌ها
- کلاس‌ها: خصوصی، نیمه‌خصوصی، گروهی، آکادمی، با ظرفیت/مدت/قیمت دلخواه (هیچ قیمتی Hard Code نیست) و تفکیک **قیمت جلسه = هزینه زمین + درآمد مربی**
- ترم: تعداد جلسه ثابت (۱۰/۲۰/…)، ماهانه یا دلخواه؛ زمان‌بندی تکراری (پیش‌فرض روزهای فرد/زوج، ساعت جدا برای هر روز) یا تاریخ‌های دلخواه؛ پیش‌نمایش زنده سهم هر نفر و مبلغ کل
- نیمه‌خصوصی: تقسیم خودکار (مثلاً ۱٬۴۰۰٬۰۰۰ بین ۳ نفر ← ۴۶۶٬۶۶۷) با امکان تغییر دستی سهم هر نفر؛ پرداخت جدا یا یک‌جا
- روش پرداخت ترم: قبل از ترم، هر جلسه، اقساطی، دستی؛ پرداخت ناقص؛ تخصیص خودکار پرداخت به قدیمی‌ترین بدهی
- حضور و غیاب یک‌لمسی: حاضر/غایب/موجه/غیرموجه/جبرانی + دلیل غیبت + «طبق قانون / کسر شود / کسر نشود»؛ قوانین کسر جلسه در تنظیمات قابل تغییر است؛ ثبت آفلاین با ارسال خودکار پس از اتصال
- جلسات: تغییر زمان، لغو، بازگردانی، حذف، جلسه اضافه، جلسه جبرانی با پیشنهاد زمان بدون تداخل و تاریخچه کامل تغییرات
- تقویم روزانه/هفتگی/ماهانه شمسی (شروع هفته از شنبه) با رنگ مجزا برای هر نوع کلاس
- مالی: درآمد ماهانه، به تفکیک نوع کلاس/کلاس/شاگرد/روش پرداخت، سهم مربی و هزینه زمین، بدهی‌ها و بستانکاری
- برنامه تمرینی: فنی، تاکتیکی، ذهنی، بدنی با مهارت‌ها، ست، تکرار، زمان، شدت و پیشرفت
- اعلان‌ها: یادآوری جلسه، تغییر زمان، جلسه جدید، جبرانی، لغو، سررسید پرداخت، بدهی، ثبت پرداخت

**شاگرد** — فقط داده‌های خودش: جلسه بعدی، کلاس‌ها، جلسات باقی‌مانده، وضعیت شهریه، پرداخت‌ها، بدهی، برنامه تمرینی (علامت‌زدن تمرین‌ها)، سابقه جلسات و حضور، اعلان‌ها.
اتصال خودکار: اگر شاگرد با همان ایمیل یا موبایلی که مربی ثبت کرده عضو شود، به پرونده‌اش وصل می‌شود.

---

## معماری

```
tennis-coach/
├── docker-compose.yml
├── docs/schema_postgres.sql          # DDL کامل PostgreSQL
├── backend/                          # FastAPI – Clean Architecture
│   ├── app/
│   │   ├── api/                      # لایه API: routers، وابستگی‌ها (auth/RBAC)
│   │   ├── application/              # لایه Application: services (use-caseها)، schemas
│   │   ├── domain/                   # لایه Domain: قوانین خالص (قیمت‌گذاری، مالی، حضور، زمان‌بندی، تقویم شمسی)
│   │   ├── infrastructure/           # لایه Infrastructure: SQLAlchemy models، repository، push gateway
│   │   ├── core/                     # تنظیمات، امنیت (bcrypt، JWT)، rate limit، خطاها
│   │   └── jobs/                     # seed و ارسال یادآوری‌ها
│   ├── migrations/                   # Alembic
│   └── tests/                        # pytest
└── mobile/                           # Expo + TypeScript
    └── src/
        ├── app/                      # مسیرها (Expo Router): (auth)، coach/، student/
        ├── features/                 # auth, students, classes, sessions, attendance, finance,
        │                             # training, notifications, dashboard, calendar, profile, student
        │   └── <feature>/{api.ts, schemas.ts, components/, screens/}
        └── shared/
            ├── components/           # کامپوننت‌های قابل استفاده مجدد (Button, Card, Sheet, Charts, DatePicker شمسی, …)
            ├── hooks/ services/ types/ utils/ theme/
            └── i18n/locales/{fa,en}.ts   # همه متن‌ها اینجا – هیچ متنی در کد Hard Code نیست
```

- **State:** TanStack Query برای داده سرور (کش، refetch، invalidation) و Zustand برای state محلی (احراز هویت، بازخورد)
- **فرم‌ها:** react-hook-form + zod
- **API Client:** axios با تمدید خودکار توکن (refresh) و نگاشت کد خطا به پیام فارسی
- **Offline-ready:** صف `outbox` برای عملیات حیاتی (حضور و غیاب) با `client_mutation_id` (idempotent) + endpoint `sync/changes` برای همگام‌سازی آینده
- **RTL و فارسی:** فونت وزیرمتن، اعداد فارسی، تاریخ شمسی (dayjs + jalaliday)، RTL بومی در build و fallback در Expo Go/وب؛ زبان انگلیسی آماده تکمیل در `en.ts`
- **امنیت:** bcrypt، JWT دسترسی کوتاه‌مدت + Refresh Token با چرخش و ابطال، RBAC (coach/student)، جداسازی کامل داده هر مربی و هر شاگرد، اعتبارسنجی Pydantic، ORM (محافظت در برابر SQL Injection)، CORS، Rate limiting روی ورود/ثبت‌نام، optimistic locking روی جلسات

### API

۵۳ endpoint زیر `/api/v1` — مستندات کامل در `http://localhost:8000/docs`. گروه‌ها: `auth`، `students`، `classes`، `terms`، `sessions` (cancel/restore/makeup/history)، `makeups`، `attendance` (+bulk)، `payments`، `charges`، `financial-summary`، `training-plans`، `dashboard/coach`، `me/*`، `notifications`، `coach/settings`، `sync/changes`.

### یادآوری‌ها و Push

```bash
cd backend && python -m app.jobs.reminders     # هر ۱۵ دقیقه با cron اجرا شود
```
با `PUSH_PROVIDER=expo` اعلان‌ها از طریق Expo Push (FCM/APNs) ارسال می‌شوند؛ در غیر این صورت فقط در صندوق اعلان داخل اپ ذخیره می‌شوند.

### تست‌ها

```bash
cd backend && pip install -r requirements-dev.txt && pytest -q
cd mobile && npm run typecheck
```

---

## توسعه‌های آینده (معماری آماده است)

دستیار هوش مصنوعی، آمار پیشرفته بازیکن، مدیریت تورنمنت، آنالیز ویدیو، چند مربی و آکادمی با چند شعبه (مدل داده بر اساس `coach_id` جداسازی شده و قابل ارتقا به `organization_id` است)، فروش دوره‌ها، نسخه iOS.
