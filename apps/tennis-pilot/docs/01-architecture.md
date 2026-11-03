# 🏗️ معماری سیستم - TennisPilot

**نسخه:** 1.0.0  
**آخرین به‌روزرسانی:** ۱۸ ژوئیه ۲۰۲۶  
**وضعیت:** ✅ فعال و در حال توسعه

---

## 📋 فهرست مطالب

1. [معماری کلی](#معماری-کلی)
2. [ساختار پروژه](#ساختار-پروژه)
3. [الگوهای طراحی](#الگوهای-طراحی)
4. [تکنولوژی‌ها](#تکنولوژی‌ها)
5. [جریان داده](#جریان-داده)
6. [سیستم تم](#سیستم-تم)
7. [سیستم ناوبری](#سیستم-ناوبری)
8. [یکپارچه‌سازی هوش مصنوعی](#یکپارچه‌سازی-هوش-مصنوعی)
9. [مدیریت State](#مدیریت-state)
10. [امنیت](#امنیت)

---

## 🎯 معماری کلی

پروژه **TennisPilot** یک اپلیکیشن مدیریت تنیس است که با معماری **Client-Server** و الگوی **Three-Tier** ساخته شده است:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React Native + Expo)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Screens     │  │  Components  │  │   Services   │          │
│  │  (UI Layer)  │  │  (Reusable)  │  │  (API Call)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Context     │  │   Theme      │  │   Utils      │          │
│  │ (State Mgmt) │  │  (Dark Mode) │  │ (Engines)    │          │
│  └──────────────  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI + Python)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Routers    │  │   Models     │  │   Schemas    │          │
│  │  (Routes)    │  │ (SQLAlchemy) │  │  (Pydantic)  │          │
│  └──────────────  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────  ┌──────────────┐          │
│  │   Services   │  │   Database   │  │  AI Service  │          │
│  │ (Business)   │  │  (SQLite)    │  │ (ArvanCloud) │          │
│  └──────────────┘  └──────────────┘  ──────────────┘          │
─────────────────────────────────────────────────────────────────┘
```

### اصول معماری

- **Separation of Concerns**: جداسازی کامل UI، Business Logic و Data Layer
- **Single Responsibility**: هر کامپوننت/ماژول یک مسئولیت مشخص دارد
- **DRY (Don't Repeat Yourself)**: استفاده از کامپوننت‌های قابل استفاده مجدد
- **Single Source of Truth**: منابع واحد برای کانفیگ (مثل `tabConfig.ts`)

---

## 📁 ساختار پروژه

### Frontend (`src/`)

```
src/
├── screens/                          # صفحات اصلی اپلیکیشن
│   ├── DashboardScreen.tsx           # داشبورد اصلی با فلگ‌های قابل تنظیم
│   ├── StudentsScreen.tsx            # لیست شاگردان
│   ├── StudentDetailsScreen.tsx      # پروفایل شاگرد با آمار کامل
│   ├── EditStudentScreen.tsx         # ویرایش اطلاعات شاگرد
│   ├── AddStudentScreen.tsx          # افزودن شاگرد جدید
│   ├── CreateMatchScreen.tsx         # ایجاد مسابقه جدید
│   ├── LiveMatchScreen.tsx           # ثبت زنده امتیازات
│   ├── MatchDetailsScreen.tsx        # جزئیات مسابقه
│   ├── AIAnalysisScreen.tsx          # تحلیل هوش مصنوعی
│   ├── StatisticsDashboardScreen.tsx # داشبورد آمار کلی
│   └── SettingsScreen.tsx            # تنظیمات اپلیکیشن
│
├── components/                       # کامپوننت‌های UI
│   ├── common/                       # کامپوننت‌های مشترک
│   │   ├── CustomHeader.tsx          # هدر سفارشی با RTL
│   │   ├── AppCard.tsx               # کارت با سایه
│   │   ├── ModernButton.tsx          # دکمه مدرن
│   │   ├── ModernTextInput.tsx       # فیلد متنی
│   │   ├── ConfirmationDialog.tsx    # دیالوگ تأیید
│   │   ├── ActionSheet.tsx           # منوی اکشن
│   │   ├── LoadingScreen.tsx         # صفحه بارگذاری
│   │   ├── EmptyState.tsx            # حالت خالی
│   │   ├── Skeleton.tsx              # انیمیشن skeleton
│   │   ├── SkeletonCard.tsx
│   ├── match/                        # کامپوننت‌های مسابقه
│   │   ├── ScoreBoard.tsx            # نمایش امتیازات
│   │   ├── MatchCard.tsx             # کارت مسابقه
│   │   └── FinalStrokeForm.tsx       # فرم ضربه نهایی
│   ├── analysis/                     # کامپوننت‌های تحلیل
│   │   ├── StatItem.tsx              # آیتم آماری
│   │   ├── MarkdownReport.tsx        # رندر Markdown فارسی
│   │   └── ShotDistributionChart.tsx # نمودار دونات
│   └── student/                      # کامپوننت‌های شاگرد
│       ── StudentCard.tsx           # کارت شاگرد
│
├── navigation/                       # سیستم ناوبری
│   ├── AppNavigator.tsx              # ناوبری اصلی
│   ├── CustomTabBar.tsx              # تب‌بار سفارشی
│   └── tabConfig.ts                  #  Single Source of Truth برای تب‌ها
│
├── services/                         # سرویس‌های API
│   ├── studentService.ts             # API شاگردان
│   ├── matchService.ts               # API مسابقات
│   └── analysisService.ts            # API تحلیل AI
│
├── context/                          # مدیریت State
│   ├── ThemeContext.tsx              # مدیریت تم (Light/Dark/System)
│   └── ToastContext.tsx              # مدیریت اعلان‌ها
│
├── utils/                            # ابزارهای کمکی
│   ├── scoringEngine.ts              # ⭐ موتور امتیازدهی تنیس
│   ├── pointRecordingEngine.ts       # ⭐ موتور ثبت امتیاز
│   └── constants.ts                  # ثابت‌ها
│
├── theme/                            # سیستم تم
│   ├── colors.ts                     # پالت رنگی (Light + Dark)
│   └── index.ts                      # SPACING, TYPOGRAPHY, RADIUS, SHADOWS
│
└── types/                            # تعاریف TypeScript
    └── index.ts                      # اینترفیس‌ها و تایپ‌ها
```

### Backend (`backend/`)

```
backend/
├── app/
│   ├── main.py                       # نقطه ورود FastAPI + CORS + Startup
│   ├── database.py                   # تنظیمات دیتابیس + init_db()
│   ├── config.py                     # تنظیمات عمومی (DATABASE_URL, API_KEY)
│   │
│   ├── models/                       # مدل‌های SQLAlchemy (ORM)
│   │   ├── student.py                # مدل شاگرد
│   │   ├── match.py                  # مدل مسابقه
│   │   ├── point.py                  # مدل امتیاز
│   │   ├── analysis.py               # مدل تحلیل AI ✨
│   │   └── __init__.py               # اکسپورت همه مدل‌ها
│   │
│   ├── schemas/                      # Schema های Pydantic (Validation)
│   │   ├── student.py                # StudentCreate, StudentResponse, StudentWithStats
│   │   ├── match.py                  # MatchCreate, MatchResponse
│   │   ├── point.py                  # PointCreate, PointResponse
│   │   └── analysis.py               # AnalysisResponse, AnalysisRecord ✨
│   │
│   ├── routers/                      # Route های API
│   │   ├── students.py               # CRUD شاگردان + آمار
│   │   ├── matches.py                # CRUD مسابقات + آمار + تکمیل
│   │   ── analysis.py               # تحلیل AI + تاریخچه ✨
│   │
│   └── services/                     # سرویس‌های بک‌اند
│       └── ai_service.py             # یکپارچه‌سازی ArvanCloud AI ✨
│
└── tennis.db                         # دیتابیس SQLite
```

---

## 🎨 الگوهای طراحی (Design Patterns)

### ۱. Context API برای State Management

**کاربرد:** مدیریت state های سراسری بدون prop drilling

```typescript
// ThemeContext - مدیریت تم
<ThemeProvider>
  <AppContent />
</ThemeProvider>

// استفاده در کامپوننت
const { colors, isDark, toggleTheme } = useTheme();
```

**مزایا:**
- ✅ دسترسی آسان به state در هر کامپوننت
- ✅ به‌روزرسانی خودکار UI هنگام تغییر state
- ✅ جداسازی منطق state از UI

---

### ۲. Service Layer Pattern

**کاربرد:** جداسازی منطق API از UI

```typescript
// Service
export const studentService = {
  getAll: async () => await api.get('/students/'),
  getById: async (id) => await api.get(`/students/${id}`),
  create: async (data) => await api.post('/students/', data),
};

// استفاده در Screen
const students = await studentService.getAll();
```

**مزایا:**
- ✅ قابلیت استفاده مجدد
- ✅ تست‌پذیری آسان
- ✅ تغییر آسان endpoint ها

---

### ۳. Engine Pattern برای Game Logic

**کاربرد:** مدیریت منطق پیچیده بازی در کلاس‌های جداگانه

```typescript
// ScoringEngine - مدیریت امتیازات
const engine = new ScoringEngine();
engine.addPoint('student');
const state = engine.getState();

// PointRecordingEngine - مدیریت فازهای ثبت
const pointEngine = new PointRecordingEngine();
pointEngine.startPoint('student');
pointEngine.performAction('ace');
```

**مزایا:**
- ✅ جداسازی کامل منطق بازی از UI
- ✅ قابلیت تست واحد (Unit Test)
- ✅ قابلیت استفاده مجدد

---

### ۴. Single Source of Truth

**کاربرد:** جلوگیری از تکرار کانفیگ

```typescript
// tabConfig.ts - منبع واحد برای تب‌ها
export const BOTTOM_TABS: TabConfigItem[] = [
  { name: 'Dashboard', label: 'داشبورد', icon: 'home-outline', ... },
  { name: 'Students', label: 'شاگردان', icon: 'account-group-outline', ... },
];

// استفاده در CustomTabBar و AppNavigator
```

**مزایا:**
- ✅ تغییر در یک جا، اعمال در همه جا
- ✅ جلوگیری از ناهماهنگی
- ✅ نگهداری آسان

---

### ۵. Feature Flags Pattern

**کاربرد:** کنترل نمایش بخش‌های مختلف Dashboard

```typescript
const DASHBOARD_SECTIONS = {
  showOverview: true,
  showQuickActions: true,
  showRecentMatches: true,
  showTopStudents: false,
};

// در render
{DASHBOARD_SECTIONS.showOverview && <OverviewCard />}
```

**مزایا:**
- ✅ فعال/غیرفعال کردن آسان ویژگی‌ها
- ✅ تست ویژگی‌های جدید
- ✅ شخصی‌سازی برای کاربران مختلف

---

## 🔧 تکنولوژی‌های استفاده شده

### Frontend

| تکنولوژی | نسخه | کاربرد |
|----------|------|--------|
| **React Native** | 0.73+ | فریمورک اصلی موبایل |
| **Expo** | 50+ | توسعه و build |
| **TypeScript** | 5.3+ | Type safety |
| **React Navigation** | 6.x | ناوبری بین صفحات |
| **React Native Paper** | 5.x | کامپوننت‌های UI |
| **react-native-gifted-charts** | 1.x | نمودارها و چارت‌ها |
| **react-native-svg** | 14.x | پشتیبانی از SVG |
| **expo-linear-gradient** | 12.x | گرادیان‌ها |
| **@react-native-async-storage** | 1.x | ذخیره‌سازی محلی |
| **react-native-markdown-display** | 7.x | رندر Markdown |
| **Axios** | 1.x | HTTP Client |

### Backend

| تکنولوژی | نسخه | کاربرد |
|----------|------|--------|
| **FastAPI** | 0.109+ | فریمورک وب |
| **Python** | 3.10+ | زبان برنامه‌نویسی |
| **SQLAlchemy** | 2.x | ORM |
| **SQLite** | 3.x | دیتابیس |
| **Pydantic** | 2.x | Validation |
| **Uvicorn** | 0.27+ | ASGI Server |
| **OpenAI SDK** | 1.x | کلاینت AI |
| **ArvanCloud AI** | - | سرویس هوش مصنوعی |

### هوش مصنوعی

| مورد | جزئیات |
|------|--------|
| **Provider** | ArvanCloud AI |
| **Model** | Qwen3-30B-A3B |
| **زبان** | فارسی (بهینه‌سازی شده) |
| **Context Length** | 400K tokens |
| **کاربرد** | تحلیل مسابقات تنیس |

---

## 🔄 جریان داده (Data Flow)

### جریان اصلی

```
User Action
    ↓
Screen Component
    ↓
Service Layer (studentService, matchService, ...)
    ↓
HTTP Request (Axios)
    ↓
Backend Router (FastAPI)
    ↓
Business Logic (Service)
    ↓
Database (SQLAlchemy + SQLite)
    ↓
Response (JSON)
    ↓
Service Layer
    ↓
Screen Component
    ↓
UI Update (React State)
```

### جریان ثبت امتیاز (Live Match)

```
User taps "Student Point"
    ↓
LiveMatchScreen.handleAction()
    ↓
PointRecordingEngine.performAction()
    ↓
PointRecordingEngine.isPointComplete()
    ↓
savePoint() → matchService.createPoint()
    ↓
Backend: POST /matches/{id}/points
    ↓
Database: INSERT INTO points
    ↓
ScoringEngine.addPoint(winner)
    ↓
PointRecordingEngine.reset()
    ↓
PointRecordingEngine.startPoint(new_server)
    ↓
UI Update (ScoreBoard + Timeline)
```

### جریان تحلیل AI

```
User taps "Analyze with AI"
    ↓
AIAnalysisScreen
    ↓
analysisService.getLatestAnalysis() → Check cache
    ↓
If exists: Return cached analysis
If not: analysisService.analyzeMatch()
    ↓
Backend: POST /matches/{id}/analyze
    ↓
AI Service → ArvanCloud API
    ↓
Qwen3-30B-A3B generates report
    ↓
Backend: Save to analyses table
    ↓
Response with analysis_id
    ↓
UI: Display report + Show "Cached" banner
```

---

##  سیستم تم (Theme System)

### معماری

```
ThemeProvider (Context)
    ↓
useTheme() Hook
    ↓
{ colors, shadows, isDark, mode, setMode, toggleTheme }
    ↓
All Components
```

### حالت‌های تم

1. **Light Mode** - تم روشن (پیش‌فرض)
2. **Dark Mode** - تم تاریک
3. **System** - بر اساس تنظیمات دستگاه

### ذخیره‌سازی

- **مکان:** AsyncStorage
- **Key:** `@app_theme_mode`
- **Values:** `'light' | 'dark' | 'system'`

### استفاده

```typescript
const { colors, isDark, toggleTheme } = useTheme();

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

---

## 🧭 سیستم ناوبری (Navigation)

### ساختار

```
AppNavigator (Tab Navigator)
├── DashboardStack (Stack Navigator)
│   ├── Dashboard
│   ├── CreateMatch
│   ├── MatchDetails
│   ├── LiveMatch
│   ├── AIAnalysis
│   ├── StatisticsDashboard
│   └── Settings
│
└── StudentsStack (Stack Navigator)
    ├── StudentsList
    ├── AddStudent
    ├── StudentDetails
    ├── EditStudent
    └── CreateMatch
```

### تب‌های پایین صفحه

**منبع واحد:** `src/navigation/tabConfig.ts`

```typescript
export const BOTTOM_TABS: TabConfigItem[] = [
  {
    name: 'Dashboard',
    label: 'داشبورد',
    icon: 'home-outline',
    iconFocused: 'home',
    isCenter: true, // دکمه وسط برجسته
  },
  {
    name: 'Students',
    label: 'شاگردان',
    icon: 'account-group-outline',
    iconFocused: 'account-group',
  },
];
```

### CustomTabBar

- دکمه وسط بزرگتر و برجسته (برای Dashboard)
- پشتیبانی کامل از Dark Mode
- انیمیشن focus
- نقطه indicator زیر آیتم فعال

---

##  یکپارچه‌سازی هوش مصنوعی

### معماری

```
Frontend (AIAnalysisScreen)
    ↓
analysisService.analyzeMatch()
    ↓
Backend (analysis.py router)
    ↓
AI Service (ai_service.py)
    ↓
ArvanCloud API (Qwen3-30B-A3B)
    ↓
Generate Persian Report
    ↓
Save to Database (analyses table)
    ↓
Return to Frontend
```

### ویژگی‌ها

- ✅ تحلیل فارسی با لحن دیسیپلین‌محور
- ✅ ذخیره خودکار در دیتابیس
- ✅ تاریخچه تحلیل‌ها
- ✅ قابلیت re-analysis
- ✅ کش برای کاهش هزینه

### مدل AI

- **نام:** Qwen3-30B-A3B
- **Provider:** ArvanCloud AI
- **زبان:** فارسی (بهینه‌سازی شده)
- **قیمت:** بسیار مقرون‌به‌صرفه

---

## 📊 مدیریت State

### State های سراسری (Global State)

1. **ThemeContext**
    - mode: 'light' | 'dark' | 'system'
    - isDark: boolean
    - colors: Colors object
    - toggleTheme: () => void

2. **ToastContext**
    - showSuccess(message)
    - showError(message)
    - showInfo(message)

### State های محلی (Local State)

هر صفحه state های محلی خود را مدیریت می‌کند:

```typescript
const [loading, setLoading] = useState(true);
const [data, setData] = useState<any>(null);
const [error, setError] = useState('');
```

### State های Engine

- **ScoringEngine:** امتیازات، گیم‌ها، ست‌ها
- **PointRecordingEngine:** فاز ثبت، اکشن‌ها

---

##  امنیت

### Frontend

- ✅ Validation در فرم‌ها
- ✅ Error handling در API calls
- ✅ ذخیره API Key در `.env` (نه در کد)

### Backend

- ✅ CORS middleware
- ✅ Validation با Pydantic
- ✅ SQL Injection prevention (SQLAlchemy ORM)
- ✅ Error handling جامع

### دیتابیس

- ✅ استفاده از ORM (SQLAlchemy)
- ✅ Cascade delete برای حفظ یکپارچگی
- ✅ Backup منظم (توصیه شده)

---

## 📈 مقیاس‌پذیری

### فعلی

- **دیتابیس:** SQLite (مناسب برای MVP و تک‌کاربره)
- **Backend:** Single instance (مناسب برای تست)
- **Frontend:** Mobile app (iOS + Android)

### آینده (پیشنهادی)

- **دیتابیس:** PostgreSQL (برای چندکاربره)
- **Backend:** Docker + Load Balancer
- **Frontend:** Web version (React.js)
- **Authentication:** JWT + OAuth
- **Cloud:** AWS / ArvanCloud

---

##  تست

### Frontend

- **Unit Tests:** Jest + React Native Testing Library
- **Integration Tests:** Detox (E2E)
- **Manual Tests:** Expo Go

### Backend

- **Unit Tests:** pytest
- **API Tests:** HTTPX + pytest
- **Manual Tests:** Swagger UI (`/docs`)

---

##  Deployment

### Frontend

```bash
# Build برای iOS
eas build --platform ios

# Build برای Android
eas build --platform android

# Publish
eas submit
```

### Backend

```bash
# Local
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Production (Docker)
docker build -t tennis-pilot-backend .
docker run -p 8000:8000 tennis-pilot-backend
```

---

## 🤝 Contributing

### اضافه کردن ویژگی جدید

1. **صفحه جدید:**
    - بساز در `src/screens/`
    - اضافه کن به `AppNavigator.tsx`
    - اضافه کن به Stack مناسب

2. **تب جدید:**
    - اضافه کن به `tabConfig.ts`
    - اضافه کن به `AppNavigator.tsx`

3. **Endpoint جدید:**
    - بساز Router در `backend/app/routers/`
    - Register کن در `main.py`
    - بساز Schema مربوطه

### Best Practices

- ✅ استفاده از `useTheme` برای رنگ‌ها
- ✅ پشتیبانی از RTL برای فارسی
- ✅ TypeScript strict mode
- ✅ Error handling در همه API calls
- ✅ Loading states مناسب
- ✅ Feature flags برای کنترل نمایش

---

## 📚 داکیومنت‌های مرتبط

- [02-database-schema.md](./02-database-schema.md) - ساختار دیتابیس
- [03-game-logic.md](./03-game-logic.md) - منطق بازی
- [04-api-reference.md](./04-api-reference.md) - مستندات API
- [05-ui-components.md](./05-ui-components.md) - کامپوننت‌های UI
- [06-development-guide.md](./06-development-guide.md) - راهنمای توسعه
- [07-ai-integration.md](./07-ai-integration.md) - یکپارچه‌سازی AI
- [08-theme-system.md](./08-theme-system.md) - سیستم تم

---

**آخرین به‌روزرسانی:** ۱۸ ژوئیه ۲۰۲۶  
**توسط:** تیم توسعه TennisPilot