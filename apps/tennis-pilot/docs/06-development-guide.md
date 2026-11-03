# Tennis AI Coach - Development Guide

## Setup Instructions

### Backend Setup
1. Navigate to `backend/` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Run server: `uvicorn app.main:app --reload`
4. Access API docs: `http://localhost:8000/docs`

### Frontend Setup
1. Navigate to `frontend/` directory
2. Install dependencies: `npm install`
3. Start Expo: `npx expo start`
4. Scan QR code with Expo Go app

## Project Structure

### Backend
- `app/models/` - Database models
- `app/schemas/` - Pydantic schemas
- `app/routers/` - API endpoints
- `app/services/` - Business logic
- `app/utils/` - Helper functions

### Frontend
- `src/screens/` - Screen components
- `src/components/` - Reusable components
- `src/services/` - API calls
- `src/navigation/` - Navigation setup
- `src/utils/` - Constants and helpers

## API Configuration

Backend runs on: `http://localhost:8000`
Frontend connects to: `http://localhost:8000/api`

For production, update `src/utils/constants.js`

## Testing

### Backend Testing
Use Swagger UI at `http://localhost:8000/docs`

### Frontend Testing
Use Expo Go app on physical device or emulator

---

# ️ راهنمای توسعه - TennisPilot (نسخه خلاصه)

**نسخه:** 1.0.0 | **آخرین به‌روزرسانی:** ۱۸ ژوئیه ۲۰۲۶

---

## 🚀 راه‌اندازی سریع

### Frontend
```bash
npm install
npx expo start --clear
```

### Backend
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*(داکیومنت Swagger: `http://localhost:8000/docs`)*

---

## 🎨 سیستم تم و UI

- **همیشه از `useTheme` استفاده کنید:**
  ```typescript
  const { colors, shadows, isDark } = useTheme();
  <View style={{ backgroundColor: colors.background }} />
  ```
- **قانون طلایی:** هرگز از `COLORS` (استاتیک) در استایل‌ها استفاده نکنید تا Dark Mode درست کار کند.
- **کامپوننت‌های پایه:** از `CustomHeader`, `AppCard`, `ModernButton`, `ModernTextInput` استفاده کنید.

---

##  ناوبری (Navigation)

- **منبع واحد تب‌ها:** فایل `src/navigation/tabConfig.ts`
- **افزودن تب جدید:**
    1. آیتم را به آرایه `BOTTOM_TABS` در `tabConfig.ts` اضافه کنید.
    2. `<Tab.Screen>` مربوطه را در `AppNavigator.tsx` بسازید.
- **ساختار Stack:** صفحات مرتبط در `DashboardStack` و `StudentsStack` دسته‌بندی شده‌اند.

---

## ➕ افزودن قابلیت جدید

### ۱. صفحه جدید
1. فایل را در `src/screens/` بسازید.
2. در `AppNavigator.tsx` ایمپورت و به Stack مناسب اضافه کنید.

### ۲. Endpoint جدید (Backend)
1. مسیر جدید را در فایل مربوطه در `backend/app/routers/` بسازید.
2. Schema آن را در `backend/app/schemas/` تعریف کنید.
3. اگر Router جدید است، در `main.py` ثبت (`include_router`) کنید.

### ۳. کنترل بخش‌های داشبورد
از فلگ‌های `DASHBOARD_SECTIONS` در `DashboardScreen.tsx` برای نمایش/مخفی کردن بخش‌ها استفاده کنید.

---

## 🐛 دیباگ و ریست دیتابیس

### فرانت‌اند
اگر تغییرات اعمال نشد:
```bash
npx expo start --clear
```

### بک‌اند و دیتابیس
اگر خطای Schema یا `missing column` گرفتید:
1. سرور را متوقف کنید (`Ctrl+C`).
2. فایل `backend/tennis.db` را **حذف** کنید.
3. سرور را دوباره اجرا کنید (جداول خودکار ساخته می‌شوند).

---

##  Best Practices (چک‌لیست سریع)

- [ ] **RTL:** برای متون فارسی `textAlign: 'right'` بگذارید.
- [ ] **TypeScript:** تا حد امکان از `any` پرهیز کنید.
- [ ] **API:** تمام فراخوانی‌های سرویس را در `try/catch` بگذارید.
- [ ] **Loading:** برای لودینگ از `Skeleton` یا `ActivityIndicator` استفاده کنید.
- [ ] **Toast:** برای فیدبک به کاربر از `useToast` استفاده کنید.
- [ ] **Engines:** منطق بازی فقط در `ScoringEngine` و `PointRecordingEngine` باشد، نه در UI.

---

## 📚 سایر داکیومنت‌ها

- `01-architecture.md` - معماری کلی
- `02-database-schema.md` - جداول دیتابیس
- `03-game-logic.md` - منطق موتورهای بازی
- `04-api-reference.md` - لیست API ها
- `05-ui-components.md` - راهنمای کامپوننت‌ها
- `07-ai-integration.md` - تنظیمات هوش مصنوعی
- `08-theme-system.md` - جزئیات سیستم تم