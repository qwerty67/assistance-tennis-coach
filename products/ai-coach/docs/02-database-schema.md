# ️ ساختار دیتابیس - TennisPilot

**نسخه:** 1.0.0  
**آخرین به‌روزرسانی:** ۱۸ ژوئیه ۲۲۶  
**نوع دیتابیس:** SQLite  
**ORM:** SQLAlchemy 2.x

---

## 📋 فهرست مطالب

1. [overview کلی](#overview-کلی)
2. [جدول students (شاگردان)](#جدول-students-شاگردان)
3. [جدول matches (مسابقات)](#جدول-matches-مسابقات)
4. [جدول points (امتیازات)](#جدول-points-امتیازات)
5. [جدول analyses (تحلیل‌های AI)](#جدول-analyses-تحلیل‌های-ai)
6. [روابط بین جدول‌ها](#روابط-بین-جدول‌ها)
7. [Enums و مقادیر مجاز](#enums-و-مقادیر-مجاز)
8. [محاسبات آماری](#محاسبات-آماری)
9. [Migration و مدیریت Schema](#migration-و-مدیریت-schema)
10. [نکات مهم](#نکات-مهم)

---

##  overview کلی

دیتابیس TennisPilot از **SQLite** استفاده می‌کند و با **SQLAlchemy ORM** مدیریت می‌شود. این دیتابیس برای MVP و استفاده تک‌کاربره (مربی تنیس) طراحی شده است.

### فایل دیتابیس

```
backend/tennis.db
```

### ویژگی‌ها

- ✅ Auto-increment برای Primary Key ها
- ✅ Foreign Key با Cascade Delete
- ✅ Timestamp خودکار (created_at, updated_at)
- ✅ پشتیبانی از JSON برای داده‌های پیچیده
- ✅ Enum برای فیلدهای محدود

---

## 📊 جدول students (شاگردان)

### توضیحات

این جدول اطلاعات پایه شاگردان (بازیکنان تنیس) را ذخیره می‌کند.

### ساختار جدول

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Integer (PK) | ❌ No | Auto Increment | شناسه یکتا |
| `name` | String(100) | ❌ No | - | نام و نام خانوادگی شاگرد |
| `phone` | String(20) | ✅ Yes | NULL | شماره تماس |
| `email` | String(100) | ✅ Yes | NULL | آدرس ایمیل |
| `notes` | Text | ✅ Yes | NULL | یادداشت‌ها و توضیحات |
| `created_at` | DateTime (TZ) | ❌ No | `now()` | تاریخ و زمان ایجاد رکورد |
| `updated_at` | DateTime (TZ) | ✅ Yes | `now()` | تاریخ و زمان آخرین ویرایش |

### Relationships

```python
matches = relationship("Match", back_populates="student", cascade="all, delete-orphan")
```

**توضیح:** هر شاگرد می‌تواند چندین مسابقه داشته باشد. با حذف شاگرد، تمام مسابقات او نیز حذف می‌شوند (Cascade Delete).

### مثال داده

```json
{
  "id": 1,
  "name": "طه احمدی",
  "phone": "09123456789",
  "email": "taha@example.com",
  "notes": "شاگرد پیشرفته، سطح ۴.",
  "created_at": "2026-07-18T10:00:00+03:30",
  "updated_at": "2026-07-18T10:00:00+03:30"
}
```

### Model Code

```python
from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    matches = relationship("Match", back_populates="student", cascade="all, delete-orphan")
```

---

##  جدول matches (مسابقات)

### توضیحات

این جدول اطلاعات مسابقات تنیس را ذخیره می‌کند. هر مسابقه متعلق به یک شاگرد است و شامل اطلاعات حریف، تاریخ، نتیجه و وضعیت می‌باشد.

### ساختار جدول

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Integer (PK) | ❌ No | Auto Increment | شناسه یکتا |
| `student_id` | Integer (FK) | ❌ No | - | شناسه شاگرد (ارجاع به `students.id`) |
| `opponent_name` | String(100) | ❌ No | - | نام حریف |
| `match_date` | String(20) | ❌ No | - | تاریخ مسابقه (فرمت: YYYY-MM-DD) |
| `location` | String(100) | ✅ Yes | NULL | مکان مسابقه |
| `match_type` | String(50) | ✅ Yes | `'singles'` | نوع مسابقه (singles/doubles) |
| `status` | Enum (MatchStatus) | ✅ Yes | `'ongoing'` | وضعیت مسابقه |
| `sets_score` | String(50) | ✅ Yes | NULL | نتیجه ست‌ها (مثال: "6-4, 6-3") |
| `final_result` | Enum (MatchResult) | ✅ Yes | NULL | نتیجه نهایی برای شاگرد |
| `notes` | Text | ✅ Yes | NULL | یادداشت‌های مسابقه |
| `student_games_won` | Integer | ✅ Yes | `0` | تعداد گیم‌های برده شاگرد |
| `opponent_games_won` | Integer | ✅ Yes | `0` | تعداد گیم‌های برده حریف |
| `created_at` | DateTime (TZ) | ❌ No | `now()` | تاریخ و زمان ایجاد |
| `updated_at` | DateTime (TZ) | ✅ Yes | `now()` | تاریخ و زمان آخرین ویرایش |

### Foreign Keys

```python
student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
```

### Relationships

```python
student = relationship("Student", back_populates="matches")
points = relationship("Point", back_populates="match", cascade="all, delete-orphan")
analyses = relationship("Analysis", back_populates="match", cascade="all, delete-orphan")
```

**توضیح:** با حذف مسابقه، تمام امتیازات و تحلیل‌های آن نیز حذف می‌شوند.

### مثال داده

```json
{
  "id": 1,
  "student_id": 1,
  "opponent_name": "رضا محمدی",
  "match_date": "2026-07-18",
  "location": "زمین شماره ۱، باشگاه تنیس",
  "match_type": "singles",
  "status": "completed",
  "sets_score": "6-4, 6-3",
  "final_result": "win",
  "notes": "بازی خوب، سرویس قوی",
  "student_games_won": 12,
  "opponent_games_won": 7,
  "created_at": "2026-07-18T10:00:00+03:30",
  "updated_at": "2026-07-18T12:00:00+03:30"
}
```

### Model Code

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class MatchStatus(str, enum.Enum):
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"

class MatchResult(str, enum.Enum):
    win = "win"
    loss = "loss"
    draw = "draw"

class Match(Base):
    __tablename__ = "matches"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    opponent_name = Column(String(100), nullable=False)
    match_date = Column(String(20), nullable=False)
    location = Column(String(100), nullable=True)
    match_type = Column(String(50), default="singles")
    status = Column(Enum(MatchStatus), default=MatchStatus.ongoing)
    sets_score = Column(String(50), nullable=True)
    final_result = Column(Enum(MatchResult), nullable=True)
    notes = Column(Text, nullable=True)
    student_games_won = Column(Integer, default=0)
    opponent_games_won = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    student = relationship("Student", back_populates="matches")
    points = relationship("Point", back_populates="match", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="match", cascade="all, delete-orphan")
```

---

##  جدول points (امتیازات)

### توضیحات

این جدول جزئیات هر امتیاز (Point) در مسابقه را ذخیره می‌کند. شامل اطلاعات سرویس، ریترن، ضربه نهایی و برنده امتیاز می‌باشد.

### ساختار جدول

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Integer (PK) | ❌ No | Auto Increment | شناسه یکتا |
| `match_id` | Integer (FK) | ❌ No | - | شناسه مسابقه (ارجاع به `matches.id`) |
| `point_number` | Integer | ❌ No | - | شماره امتیاز در مسابقه |
| `set_number` | Integer | ✅ Yes | NULL | شماره ست |
| `game_number` | Integer | ✅ Yes | NULL | شماره گیم |
| `game_score` | String(20) | ✅ Yes | NULL | امتیاز گیم در لحظه ثبت (مثال: "30-15") |
| `server` | String(20) | ✅ Yes | NULL | سرویس‌دهنده (`student` یا `opponent`) |
| `serve_type` | String(20) | ✅ Yes | NULL | نوع سرویس (`first` یا `second`) |
| `serve_result` | String(20) | ✅ Yes | NULL | نتیجه سرویس |
| `return_result` | String(20) | ✅ Yes | NULL | نتیجه ریترن |
| `final_stroke_player` | String(20) | ✅ Yes | NULL | بازیکن ضربه نهایی |
| `final_stroke_type` | String(50) | ✅ Yes | NULL | نوع ضربه نهایی |
| `final_stroke_direction` | String(50) | ✅ Yes | NULL | جهت ضربه نهایی |
| `final_stroke_result` | String(50) | ✅ Yes | NULL | نتیجه ضربه نهایی |
| `point_winner` | String(20) | ❌ No | - | برنده امتیاز (`student` یا `opponent`) |
| `created_at` | DateTime (TZ) | ✅ Yes | `now()` | تاریخ و زمان ثبت |

### Foreign Keys

```python
match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
```

### Relationships

```python
match = relationship("Match", back_populates="points")
```

### مثال داده

```json
{
  "id": 1,
  "match_id": 1,
  "point_number": 1,
  "set_number": 1,
  "game_number": 1,
  "game_score": "0-0",
  "server": "student",
  "serve_type": "first",
  "serve_result": "ace",
  "return_result": null,
  "final_stroke_player": null,
  "final_stroke_type": null,
  "final_stroke_direction": null,
  "final_stroke_result": null,
  "point_winner": "student",
  "created_at": "2026-07-18T10:05:00+03:30"
}
```

### Model Code

```python
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Point(Base):
    __tablename__ = "points"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    point_number = Column(Integer, nullable=False)
    set_number = Column(Integer, nullable=True)
    game_number = Column(Integer, nullable=True)
    game_score = Column(String(20), nullable=True)
    server = Column(String(20), nullable=True)
    serve_type = Column(String(20), nullable=True)
    serve_result = Column(String(20), nullable=True)
    return_result = Column(String(20), nullable=True)
    final_stroke_player = Column(String(20), nullable=True)
    final_stroke_type = Column(String(50), nullable=True)
    final_stroke_direction = Column(String(50), nullable=True)
    final_stroke_result = Column(String(50), nullable=True)
    point_winner = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    match = relationship("Match", back_populates="points")
```

---

## 🤖 جدول analyses (تحلیل‌های AI) ✨ جدید

### توضیحات

این جدول نتایج تحلیل‌های هوش مصنوعی را ذخیره می‌کند. هر تحلیل شامل گزارش Markdown، آمار مسابقه و اطلاعات مدل AI استفاده‌شده می‌باشد.

### ساختار جدول

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | Integer (PK) | ❌ No | Auto Increment | شناسه یکتا |
| `match_id` | Integer (FK) | ❌ No | - | شناسه مسابقه (ارجاع به `matches.id`) |
| `markdown_report` | Text | ❌ No | - | گزارش تحلیل به فرمت Markdown (فارسی) |
| `statistics` | JSON | ✅ Yes | NULL | آمار کامل مسابقه (JSON object) |
| `match_info` | JSON | ✅ Yes | NULL | اطلاعات مسابقه (JSON object) |
| `model_used` | String(100) | ✅ Yes | NULL | نام مدل AI استفاده‌شده |
| `prompt_tokens` | Integer | ✅ Yes | NULL | تعداد توکن‌های ورودی |
| `completion_tokens` | Integer | ✅ Yes | NULL | تعداد توکن‌های خروجی |
| `created_at` | DateTime (TZ) |  No | `now()` | تاریخ و زمان ایجاد تحلیل |

### Foreign Keys

```python
match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
```

### Relationships

```python
match = relationship("Match", back_populates="analyses")
```

### مثال داده

```json
{
  "id": 1,
  "match_id": 1,
  "markdown_report": "### 🎾 گزارش آنالیز دیسیپلین‌محور...\n\n...",
  "statistics": {
    "total_points": 45,
    "student_points_won": 30,
    "win_percentage": 66.7,
    "student_serve_stats": {
      "aces": 5,
      "double_faults": 2
    }
  },
  "match_info": {
    "student_name": "طه احمدی",
    "opponent_name": "رضا محمدی",
    "match_date": "2026-07-18",
    "final_result": "win"
  },
  "model_used": "Qwen3-30B-A3B",
  "prompt_tokens": 2150,
  "completion_tokens": 1680,
  "created_at": "2026-07-18T12:30:00+03:30"
}
```

### Model Code

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    markdown_report = Column(Text, nullable=False)
    statistics = Column(JSON, nullable=True)
    match_info = Column(JSON, nullable=True)
    model_used = Column(String(100), nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    match = relationship("Match", back_populates="analyses")
```

---

## 🔗 روابط بین جدول‌ها (Relationships)

### نمودار ERD

```
┌──────────────┐
│   students   │
│──────────────│
│ id (PK)      │
│ name         │
│ phone        │
│ email        │
│ notes        │
│ created_at   │
│ updated_at   │
└──────┬───────
       │
       │ 1:N (Cascade Delete)
       │
       ▼
┌──────────────┐
│   matches    │
│──────────────│
│ id (PK)      │
│ student_id (FK) │
│ opponent_name│
│ match_date   │
│ status       │
│ final_result │
│ sets_score   │
│ created_at   │
│ updated_at   │
└──────┬───────┘
       │
       ├──────────────┐
       │ 1:N          │ 1:N
       │ (Cascade)    │ (Cascade)
       ▼              ▼
┌──────────────┐  ┌──────────────┐
│   points     │  │  analyses    │
│──────────────│  │──────────────│
│ id (PK)      │  │ id (PK)      │
│ match_id(FK) │  │ match_id(FK) │
│ point_number │  │ markdown_rpt │
│ game_score   │  │ statistics   │
│ server       │  │ match_info   │
│ serve_result │  │ model_used   │
│ point_winner │  │ created_at   │
│ created_at   │  └──────────────┘
└──────────────┘
```

### خلاصه روابط

| رابطه | نوع | Cascade Delete | توضیحات |
|-------|-----|----------------|---------|
| `students` → `matches` | One-to-Many | ✅ Yes | با حذف شاگرد، مسابقات او حذف می‌شوند |
| `matches` → `points` | One-to-Many | ✅ Yes | با حذف مسابقه، امتیازات حذف می‌شوند |
| `matches` → `analyses` | One-to-Many | ✅ Yes | با حذف مسابقه، تحلیل‌ها حذف می‌شوند |

---

## 🎨 Enums و مقادیر مجاز

### MatchStatus (وضعیت مسابقه)

```python
class MatchStatus(str, enum.Enum):
    ongoing = "ongoing"      # مسابقه در جریان
    completed = "completed"  # مسابقه تکمیل شده
    cancelled = "cancelled"  # مسابقه لغو شده
```

### MatchResult (نتیجه نهایی)

```python
class MatchResult(str, enum.Enum):
    win = "win"    # برد شاگرد
    loss = "loss"  # باخت شاگرد
    draw = "draw"  # مساوی
```

### Serve Result (نتیجه سرویس)

مقادیر مجاز برای `serve_result`:
- `ace` - ایس
- `fault` - فالت
- `double_fault` - دبل فالت
- `in` - سرویس داخل زمین

### Final Stroke Result (نتیجه ضربه نهایی)

مقادیر مجاز برای `final_stroke_result`:
- `winner` - ضربه برنده
- `unforced_error` - خطای غیرمجبور
- `forced_error` - خطای مجبور
- `net` - برخورد با تور

### Point Winner (برنده امتیاز)

مقادیر مجاز برای `point_winner`:
- `student` - شاگرد
- `opponent` - حریف

---

## 📈 محاسبات آماری

آمار شاگردان به صورت **on-the-fly** (در زمان درخواست) محاسبه می‌شود و در دیتابیس ذخیره **نمی‌شود**.

### آمارهای محاسبه‌شده

| فیلد | فرمول محاسبه | منبع |
|------|-------------|------|
| `total_matches` | `COUNT(matches)` | جدول matches |
| `completed_matches` | `COUNT(matches WHERE status='completed')` | جدول matches |
| `ongoing_matches` | `COUNT(matches WHERE status='ongoing')` | جدول matches |
| `total_wins` | `COUNT(matches WHERE final_result='win')` | جدول matches |
| `total_losses` | `COUNT(matches WHERE final_result='loss')` | جدول matches |
| `win_percentage` | `(total_wins / completed_matches) * 100` | محاسبه شده |
| `total_points_won` | `COUNT(points WHERE point_winner='student')` | جدول points |
| `total_points_lost` | `COUNT(points WHERE point_winner='opponent')` | جدول points |
| `average_points_per_match` | `(total_points_won + total_points_lost) / total_matches` | محاسبه شده |
| `total_aces` | `COUNT(points WHERE serve_result='ace')` | جدول points |
| `total_double_faults` | `COUNT(points WHERE serve_result='double_fault')` | جدول points |

### مثال کوئری SQL

```sql
-- محاسبه آمار شاگرد با ID=1
SELECT 
    COUNT(m.id) as total_matches,
    SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END) as completed_matches,
    SUM(CASE WHEN m.final_result = 'win' THEN 1 ELSE 0 END) as total_wins,
    ROUND(
        (SUM(CASE WHEN m.final_result = 'win' THEN 1 ELSE 0 END) * 100.0) / 
        NULLIF(SUM(CASE WHEN m.status = 'completed' THEN 1 ELSE 0 END), 0), 
        1
    ) as win_percentage
FROM matches m
WHERE m.student_id = 1;
```

---

## 🔄 Migration و مدیریت Schema

### رویکرد فعلی: Auto-Creation

در حال حاضر، جداول به صورت خودکار هنگام startup بک‌اند ساخته می‌شوند:

```python
# backend/app/database.py
def init_db():
    from app.models import Student, Match, Point, Analysis
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created/verified")

# backend/app/main.py
@app.on_event("startup")
def startup_event():
    init_db()
```

### اعمال تغییرات در Schema

اگر ساختار جدول تغییر کند (مثلاً ستون جدید اضافه شود):

1. **توقف سرور بک‌اند** (`Ctrl + C`)
2. **حذف فایل دیتابیس قدیمی:**
   ```bash
   rm backend/tennis.db
   ```
3. **ری‌استارت سرور:**
   ```bash
   uvicorn app.main:app --reload
   ```
4. **جداول جدید به صورت خودکار ساخته می‌شوند**

### رویکرد آینده: Alembic

برای پروژه‌های production، توصیه می‌شود از **Alembic** برای migration استفاده شود:

```bash
# نصب Alembic
pip install alembic

# راه‌اندازی
alembic init alembic

# ساخت migration
alembic revision --autogenerate -m "Add new column"

# اعمال migration
alembic upgrade head
```

---

## ️ نکات مهم

### ۱. Cascade Delete

تمام روابط با `ondelete="CASCADE"` تنظیم شده‌اند. این یعنی:
- حذف شاگرد → حذف تمام مسابقات، امتیازات و تحلیل‌های او
- حذف مسابقه → حذف تمام امتیازات و تحلیل‌های آن

### ۲. Timestamp ها

- `created_at`: فقط هنگام ایجاد رکورد تنظیم می‌شود
- `updated_at`: هنگام ایجاد و هر بار به‌روزرسانی تنظیم می‌شود

### ۳. JSON Fields

فیلدهای `statistics` و `match_info` در جدول `analyses` از نوع JSON هستند. این اجازه می‌دهد داده‌های پیچیده بدون نیاز به جدول جداگانه ذخیره شوند.

### ۴. Nullable Fields

بسیاری از فیلدها Nullable هستند تا انعطاف‌پذیری بیشتری داشته باشند. مثلاً:
- `phone` و `email` در students اختیاری هستند
- `location` در matches اختیاری است
- بسیاری از فیلدهای points فقط در صورت ثبت ضربه نهایی پر می‌شوند

### ۵. Index ها

در حال حاضر فقط Primary Key ها index دارند. برای بهبود performance در آینده می‌توان index های زیر را اضافه کرد:

```python
# مثال
student_id = Column(Integer, ForeignKey("students.id"), index=True)
match_date = Column(String(20), index=True)
status = Column(Enum(MatchStatus), index=True)
```

### ۶. Backup

برای دیتابیس SQLite، backup ساده است:

```bash
# کپی فایل دیتابیس
cp backend/tennis.db backend/tennis_backup_$(date +%Y%m%d).db
```

---

## 📊 آمار دیتابیس

### حجم تقریبی

| رکورد | حجم تقریبی |
|-------|-----------|
| 1 Student | ~500 bytes |
| 1 Match | ~1 KB |
| 1 Point | ~300 bytes |
| 1 Analysis | ~10-50 KB (بسته به گزارش) |

### مثال: ۱۰۰ مسابقه با میانگین ۵۰ امتیاز

- 100 Students: ~50 KB
- 100 Matches: ~100 KB
- 5000 Points: ~1.5 MB
- 100 Analyses: ~5 MB
- **مجموع:** ~6.6 MB

---

## 🔍 کوئری‌های پرکاربرد

### دریافت همه مسابقات یک شاگرد

```sql
SELECT * FROM matches WHERE student_id = 1 ORDER BY match_date DESC;
```

### دریافت آمار کلی یک شاگرد

```sql
SELECT 
    COUNT(*) as total_matches,
    SUM(CASE WHEN final_result = 'win' THEN 1 ELSE 0 END) as wins,
    ROUND(AVG(CASE WHEN final_result = 'win' THEN 100.0 ELSE 0 END), 1) as win_rate
FROM matches 
WHERE student_id = 1 AND status = 'completed';
```

### دریافت آخرین تحلیل یک مسابقه

```sql
SELECT * FROM analyses 
WHERE match_id = 1 
ORDER BY created_at DESC 
LIMIT 1;
```

### دریافت امتیازات یک مسابقه

```sql
SELECT * FROM points 
WHERE match_id = 1 
ORDER BY point_number ASC;
```

---

## 📚 داکیومنت‌های مرتبط

- [01-architecture.md](./01-architecture.md) - معماری سیستم
- [03-game-logic.md](./03-game-logic.md) - منطق بازی
- [04-api-reference.md](./04-api-reference.md) - مستندات API

---

**آخرین به‌روزرسانی:** ۱۸ ژوئیه ۲۰۶  
**توسط:** تیم توسعه TennisPilot