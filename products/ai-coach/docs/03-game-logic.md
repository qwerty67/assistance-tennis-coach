# 🎾 منطق بازی - TennisPilot

**نسخه:** 1.0.0  
**آخرین به‌روزرسانی:** ۱۸ ژوئیه ۲۰۲۶  
**وضعیت:** ✅ پیاده‌سازی شده و تست شده

---

## 📋 فهرست مطالب

1. [overview کلی](#overview-کلی)
2. [سیستم امتیازدهی تنیس](#سیستم-امتیازدهی-تنیس)
3. [معماری Engine ها](#معماری-engine-ها)
4. [ScoringEngine](#scoringengine)
5. [PointRecordingEngine](#pointrecordingengine)
6. [انواع ضربات](#انواع-ضربات)
7. [جریان ثبت امتیاز](#جریان-ثبت-امتیاز)
8. [قوانین تنیس](#قوانین-تنیس)
9. [کامپوننت‌های UI مرتبط](#کامپوننت‌های-ui-مرتبط)
10. [عیب‌یابی](#عیب‌یابی)

---

##  overview کلی

سیستم منطق بازی TennisPilot از دو **Engine** اصلی تشکیل شده است که به صورت کاملاً مستقل از UI کار می‌کنند:

```
┌─────────────────────────────────────────────────────────────┐
│                    LiveMatchScreen (UI)                     │
│  ┌──────────────────┐         ┌──────────────────────┐     │
│  │ PointRecording   │───────►│   ScoringEngine      │     │
│  │ Engine           │         │                      │     │
│  │                  │         │  - Points (0,15,30)  │     │
│  │ - فازهای ثبت     │         │  - Games             │     │
│  │ - اکشن‌ها        │         │  - Sets              │     │
│  │ - ضربه نهایی     │         │  - Server            │     │
│  └──────────────────┘         └──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### اصول طراحی

- **Separation of Concerns**: منطق بازی کاملاً از UI جدا است
- **Stateless UI**: UI فقط state را نمایش می‌دهد، منطق ندارد
- **Testable**: Engine ها قابل تست واحد (Unit Test) هستند
- **Reconstructable**: state بازی از تاریخچه امتیازات قابل بازسازی است

---

## 🎾 سیستم امتیازدهی تنیس

### ساختار سلسله‌مراتبی

```
Point (امتیاز) → Game (گیم) → Set (ست) → Match (مسابقه)
```

### امتیازات در یک Game

```
0 → 15 → 30 → 40 → Game
```

**نمایش امتیازات:**

| امتیاز عددی | نمایش تنیس |
|------------|-----------|
| 0 | 0 |
| 1 | 15 |
| 2 | 30 |
| 3 | 40 |
| 4+ | 40 (یا AD) |

---

### قوانین Deuce و Advantage

```
شرط Deuce:
  اگر هر دو بازیکن به 40 (3 امتیاز) برسند → Deuce

شرط Advantage:
  بعد از Deuce، بازیکنی که یک امتیاز بگیرد → Advantage

شرط برد Game:
  - اگر بازیکنی با اختلاف 2 امتیاز برنده شود → Game
  - اگر بازیکن Advantage داشته باشد و امتیاز بعدی را بگیرد → Game
  - اگر بازیکن دیگر امتیاز بگیرد → برگشت به Deuce
```

**مثال:**

```
40-40 → Deuce
AD-40 → Advantage شاگرد
40-40 → برگشت به Deuce (حریف امتیاز گرفت)
40-AD → Advantage حریف
Game  → حریف Game را برد (امتیاز بعدی را گرفت)
```

---

### برنده شدن Set

**قانون استاندارد:**
- اولین بازیکنی که **6 game** ببرد (با اختلاف حداقل **2 game**)
- مثال: 6-4, 6-3, 7-5

**حالت Tiebreak:**
- اگر نتیجه 6-6 شود → Tiebreak (در نسخه‌های بعدی پیاده‌سازی می‌شود)
- در Tiebreak، اولین بازیکنی که 7 امتیاز بگیرد (با اختلاف 2) Set را می‌برد

---

### برنده شدن Match

**فرمت‌های پشتیبانی‌شده:**
- **Best of 3**: اولین بازیکنی که 2 Set ببرد (فرمت پیش‌فرض)
- **Best of 5**: اولین بازیکنی که 3 Set ببرد (اختیاری)

---

## 🏗️ معماری Engine ها

### overview

```typescript
// ScoringEngine - مدیریت state امتیازات
interface ScoringState {
  studentSets: number;      // ست‌های برده شاگرد
  opponentSets: number;     // ست‌های برده حریف
  studentGames: number;     // گیم‌های برده شاگرد (در ست جاری)
  opponentGames: number;    // گیم‌های برده حریف (در ست جاری)
  studentPoints: number;    // امتیازات شاگرد (در گیم جاری)
  opponentPoints: number;   // امتیازات حریف (در گیم جاری)
  currentSet: number;       // شماره ست جاری
  currentGame: number;      // شماره گیم جاری
  server: 'student' | 'opponent';  // سرویس‌دهنده فعلی
}

// PointRecordingEngine - مدیریت فازهای ثبت
type RecordingPhase = 
  | 'idle'           // حالت اولیه
  | 'first_serve'    // سرویس اول
  | 'second_serve'   // سرویس دوم
  | 'return'         // ریترن
  | 'final_stroke';  // ضربه نهایی
```

### جریان کار

```
1. startPoint(server)
   ↓
2. first_serve → [ace, fault, in]
   ↓ (اگر fault)
3. second_serve → [ace, double_fault, in]
   ↓ (اگر in)
4. return → [error, in]
   ↓ (اگر in)
5. final_stroke → [winner, error, net]
   ↓
6. savePoint() → addPoint(winner) → startPoint(new_server)
```

---

## 🎯 ScoringEngine

### مسئولیت

مدیریت state کامل امتیازات تنیس شامل Points, Games, Sets و Server.

### ساختار کلاس

```typescript
export class ScoringEngine {
  private state: ScoringState;
  
  constructor() {
    // ✅ مقداردهی اولیه از صفر
    this.state = {
      studentSets: 0,
      opponentSets: 0,
      studentGames: 0,
      opponentGames: 0,
      studentPoints: 0,
      opponentPoints: 0,
      currentSet: 1,
      currentGame: 1,
      server: 'student',
    };
  }
  
  // متدهای اصلی
  public addPoint(winner: 'student' | 'opponent'): void
  public getState(): ScoringState
  public setState(state: ScoringState): void
  public reset(): void
  public getGameScoreDisplay(): string
  public getMatchScoreDisplay(): string
}
```

### متد `addPoint`

این متد قلب ScoringEngine است و منطق کامل تنیس را پیاده‌سازی می‌کند:

```typescript
public addPoint(winner: 'student' | 'opponent'): void {
  // 1. افزایش امتیاز برنده
  if (winner === 'student') {
    this.state.studentPoints++;
  } else {
    this.state.opponentPoints++;
  }
  
  // 2. بررسی Deuce/Advantage
  const isDeuce = this.state.studentPoints >= 3 && 
                  this.state.opponentPoints >= 3;
  
  if (isDeuce) {
    const diff = this.state.studentPoints - this.state.opponentPoints;
    if (Math.abs(diff) >= 2) {
      // برد Game
      this.winGame(winner);
    }
    // در غیر این صورت، Deuce یا Advantage ادامه دارد
  } else {
    // بررسی برد Game (بدون Deuce)
    if (this.state.studentPoints >= 4 || this.state.opponentPoints >= 4) {
      const winner = this.state.studentPoints > this.state.opponentPoints 
        ? 'student' : 'opponent';
      this.winGame(winner);
    }
  }
}
```

### متد `winGame`

```typescript
private winGame(winner: 'student' | 'opponent'): void {
  // افزایش گیم برنده
  if (winner === 'student') {
    this.state.studentGames++;
  } else {
    this.state.opponentGames++;
  }
  
  // ریست امتیازات
  this.state.studentPoints = 0;
  this.state.opponentPoints = 0;
  
  // تغییر سرویس
  this.state.server = this.state.server === 'student' 
    ? 'opponent' : 'student';
  
  // افزایش شماره گیم
  this.state.currentGame++;
  
  // بررسی برد Set
  this.checkSetWin();
}
```

### متد `checkSetWin`

```typescript
private checkSetWin(): void {
  const studentWon = this.state.studentGames >= 6 && 
                     (this.state.studentGames - this.state.opponentGames) >= 2;
  const opponentWon = this.state.opponentGames >= 6 && 
                      (this.state.opponentGames - this.state.studentGames) >= 2;
  
  if (studentWon || opponentWon) {
    // افزایش ست برنده
    if (studentWon) {
      this.state.studentSets++;
    } else {
      this.state.opponentSets++;
    }
    
    // ریست گیم‌ها
    this.state.studentGames = 0;
    this.state.opponentGames = 0;
    
    // افزایش شماره ست
    this.state.currentSet++;
    this.state.currentGame = 1;
  }
}
```

### متدهای نمایش

```typescript
// نمایش امتیاز گیم (مثال: "30-15")
public getGameScoreDisplay(): string {
  const studentScore = this.convertToTennisScore(this.state.studentPoints);
  const opponentScore = this.convertToTennisScore(this.state.opponentPoints);
  return `${studentScore}-${opponentScore}`;
}

// تبدیل امتیاز عددی به تنیس
private convertToTennisScore(points: number): string {
  if (points === 0) return '0';
  if (points === 1) return '15';
  if (points === 2) return '30';
  if (points === 3) return '40';
  return '40';
}

// نمایش نتیجه مسابقه (مثال: "6-4, 6-3")
public getMatchScoreDisplay(): string {
  // در نسخه فعلی، فقط ست‌های تکمیل‌شده نمایش داده می‌شوند
  return `${this.state.studentSets}-${this.state.opponentSets}`;
}
```

### بازسازی state از تاریخچه

```typescript
// بازسازی state از امتیازات ذخیره‌شده
public reconstructFromHistory(points: Point[]): void {
  this.reset();
  for (const point of points) {
    if (point.point_winner) {
      this.addPoint(point.point_winner);
    }
  }
}
```

---

## 🎯 PointRecordingEngine

### مسئولیت

مدیریت فازهای ثبت یک امتیاز از شروع تا پایان.

### فازهای ثبت (RecordingPhase)

```typescript
type RecordingPhase = 
  | 'idle'           // حالت اولیه (قبل از شروع امتیاز)
  | 'first_serve'    // ثبت سرویس اول
  | 'second_serve'   // ثبت سرویس دوم (بعد از fault)
  | 'return'         // ثبت ریترن حریف
  | 'final_stroke';  // ثبت ضربه نهایی
```

### نمودار حالت (State Diagram)

```
                    ┌─────────┐
                    │  idle   │
                    └────┬────┘
                         │ startPoint()
                         ▼
                 ┌───────────────┐
         ┌──────►│ first_serve   │──────┐
         │       └───────┬───────┘      │
         │               │              │
    ┌────┴────┐    ┌─────┴─────┐  ┌─────┴─────┐
    │  ace    │    │   fault   │  │    in     │
    └─────────┘    └─────┬─────┘  └─────┬─────┘
                         │              │
                         ▼              ▼
                 ┌───────────────┐  ┌──────────┐
                 │ second_serve  │  │  return  │
                 └───────┬───────┘  └────┬─────
                         │               │
                    ┌────────┐    ┌─────┴─────┐
                    │  ace    │    │   error   │
                    │double   │    └───────────┘
                    │_fault   │
                    └─────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ final_stroke  │
                 └───────┬───────┘
                         │
                    ┌────┴────┐
                    │ winner  │
                    │ error   │
                    │  net    │
                    └─────────┘
```

### ساختار کلاس

```typescript
export class PointRecordingEngine {
  private phase: RecordingPhase = 'idle';
  private state: PointState = {};
  private server: 'student' | 'opponent' = 'student';
  
  // متدهای اصلی
  public startPoint(server: 'student' | 'opponent'): void
  public performAction(actionId: string): boolean
  public setFinalStroke(data: FinalStrokeData): boolean
  public isPointComplete(): boolean
  public getPointWinner(): 'student' | 'opponent' | null
  public getCurrentPhase(): RecordingPhase
  public getAvailableActions(): Action[]
  public toPointCreate(matchId, pointNumber, set, game, gameScore): PointCreate
  public reset(): void
}
```

### متد `startPoint`

```typescript
public startPoint(server: 'student' | 'opponent'): void {
  this.server = server;
  this.phase = 'first_serve';
  this.state = {
    server,
    serveType: 'first',
  };
}
```

### متد `performAction`

```typescript
public performAction(actionId: string): boolean {
  switch (this.phase) {
    case 'first_serve':
      return this.handleFirstServe(actionId);
    case 'second_serve':
      return this.handleSecondServe(actionId);
    case 'return':
      return this.handleReturn(actionId);
    default:
      return false;
  }
}

private handleFirstServe(actionId: string): boolean {
  switch (actionId) {
    case 'ace':
      this.state.serveResult = 'ace';
      this.state.pointWinner = this.server;
      this.phase = 'idle'; // امتیاز تمام شد
      return true;
    case 'fault':
      this.state.serveResult = 'fault';
      this.phase = 'second_serve';
      this.state.serveType = 'second';
      return true;
    case 'in':
      this.state.serveResult = 'in';
      this.phase = 'return';
      return true;
    default:
      return false;
  }
}

private handleSecondServe(actionId: string): boolean {
  switch (actionId) {
    case 'ace':
      this.state.serveResult = 'ace';
      this.state.pointWinner = this.server;
      this.phase = 'idle';
      return true;
    case 'double_fault':
      this.state.serveResult = 'double_fault';
      this.state.pointWinner = this.server === 'student' ? 'opponent' : 'student';
      this.phase = 'idle';
      return true;
    case 'in':
      this.state.serveResult = 'in';
      this.phase = 'return';
      return true;
    default:
      return false;
  }
}

private handleReturn(actionId: string): boolean {
  switch (actionId) {
    case 'error':
      this.state.returnResult = 'error';
      this.state.pointWinner = this.server; // سرویس‌دهنده برد
      this.phase = 'idle';
      return true;
    case 'in':
      this.state.returnResult = 'in';
      this.phase = 'final_stroke';
      return true;
    default:
      return false;
  }
}
```

### متد `setFinalStroke`

```typescript
public setFinalStroke(data: FinalStrokeData): boolean {
  if (this.phase !== 'final_stroke') {
    return false;
  }
  
  this.state.finalStroke = {
    player: data.player,
    type: data.type,
    direction: data.direction,
    result: data.result,
  };
  
  // تعیین برنده بر اساس نتیجه ضربه
  if (data.result === 'winner') {
    this.state.pointWinner = data.player;
  } else if (data.result === 'unforced_error' || 
             data.result === 'forced_error' || 
             data.result === 'net') {
    this.state.pointWinner = data.player === 'student' ? 'opponent' : 'student';
  }
  
  this.phase = 'idle';
  return true;
}
```

### متد `getAvailableActions`

این متد بر اساس فاز فعلی، اکشن‌های مجاز را برمی‌گرداند:

```typescript
public getAvailableActions(): Action[] {
  switch (this.phase) {
    case 'first_serve':
      return [
        { id: 'ace', label: 'Ace', category: 'success' },
        { id: 'fault', label: 'Fault', category: 'warning' },
        { id: 'in', label: 'In', category: 'success' },
      ];
    case 'second_serve':
      return [
        { id: 'ace', label: 'Ace', category: 'success' },
        { id: 'double_fault', label: 'Double Fault', category: 'error' },
        { id: 'in', label: 'In', category: 'success' },
      ];
    case 'return':
      return [
        { id: 'error', label: 'Return Error', category: 'error' },
        { id: 'in', label: 'In', category: 'success' },
      ];
    default:
      return [];
  }
}
```

### متد `toPointCreate`

تبدیل state به داده قابل ارسال به بک‌اند:

```typescript
public toPointCreate(
  matchId: number,
  pointNumber: number,
  setNumber: number,
  gameNumber: number,
  gameScore: string
): PointCreate {
  return {
    match_id: matchId,
    point_number: pointNumber,
    set_number: setNumber,
    game_number: gameNumber,
    game_score: gameScore,
    server: this.state.server,
    serve_type: this.state.serveType,
    serve_result: this.state.serveResult,
    return_result: this.state.returnResult,
    final_stroke_player: this.state.finalStroke?.player,
    final_stroke_type: this.state.finalStroke?.type,
    final_stroke_direction: this.state.finalStroke?.direction,
    final_stroke_result: this.state.finalStroke?.result,
    point_winner: this.state.pointWinner,
  };
}
```

---

## 🎨 انواع ضربات

### Serve Results (نتایج سرویس)

| مقدار | توضیحات | امتیاز |
|-------|---------|--------|
| `ace` | ایس (سرویس برنده بدون ریترن) | سرویس‌دهنده |
| `fault` | فالت (سرویس اول ناموفق) | - |
| `double_fault` | دبل فالت (دو فالت متوالی) | حریف |
| `in` | سرویس داخل زمین | ادامه رالی |

### Return Results (نتایج ریترن)

| مقدار | توضیحات | امتیاز |
|-------|---------|--------|
| `in` | ریترن موفق | ادامه رالی |
| `error` | خطای ریترن | سرویس‌دهنده |
| `net` | برخورد با تور | سرویس‌دهنده |

### Final Stroke Types (انواع ضربه نهایی)

| مقدار | توضیحات |
|-------|---------|
| `forehand` | فورهند |
| `backhand` | بکهند |
| `forehand_volley` | والی فورهند |
| `backhand_volley` | والی بکهند |
| `overhead` | اسمش |
| `drop_shot` | دراپ شات |
| `lob` | لوب |
| `slice` | اسلایس |

### Final Stroke Directions (جهت ضربات)

| مقدار | توضیحات |
|-------|---------|
| `cross_court` | کراس کورت (مورب) |
| `down_the_line` | داون د لاین (مستقیم) |
| `center` | مرکز زمین |

### Final Stroke Results (نتایج ضربه نهایی)

| مقدار | توضیحات | برنده |
|-------|---------|-------|
| `winner` | ضربه برنده | زننده ضربه |
| `unforced_error` | خطای غیرمجبور | حریف |
| `forced_error` | خطای مجبور (تحت فشار) | حریف |
| `net` | برخورد با تور | حریف |

---

## 🔄 جریان ثبت امتیاز

### سناریوی ۱: ایس (Ace)

```
1. startPoint('student')
   ↓ phase: 'first_serve'
2. performAction('ace')
   ↓ serveResult: 'ace', pointWinner: 'student'
3. isPointComplete() → true
4. savePoint() → addPoint('student')
5. reset() → startPoint('opponent')
```

### سناریوی ۲: دبل فالت

```
1. startPoint('student')
   ↓ phase: 'first_serve'
2. performAction('fault')
   ↓ serveResult: 'fault', phase: 'second_serve'
3. performAction('double_fault')
   ↓ serveResult: 'double_fault', pointWinner: 'opponent'
4. isPointComplete() → true
5. savePoint() → addPoint('opponent')
6. reset() → startPoint('student') // سرویس تغییر نمی‌کند
```

### سناریوی ۳: رالی کامل

```
1. startPoint('student')
   ↓ phase: 'first_serve'
2. performAction('in')
   ↓ serveResult: 'in', phase: 'return'
3. performAction('in')
   ↓ returnResult: 'in', phase: 'final_stroke'
4. setFinalStroke({
     player: 'student',
     type: 'forehand',
     direction: 'cross_court',
     result: 'winner'
   })
   ↓ pointWinner: 'student'
5. isPointComplete() → true
6. savePoint() → addPoint('student')
7. reset() → startPoint('opponent')
```

### سناریوی ۴: Let (سرویس تکراری)

```
1. startPoint('student')
   ↓ phase: 'first_serve'
2. performAction('let')
   ↓ نمایش پیام "Let - Serve will be replayed"
   ↓ state تغییر نمی‌کند
3. کاربر دوباره سرویس می‌زند
```

---

## 📜 قوانین تنیس

### قوانین سرویس

1. **سرویس اول**: بازیکن یک شانس دارد
2. **Fault**: اگر سرویس اول ناموفق باشد → سرویس دوم
3. **Double Fault**: اگر سرویس دوم هم ناموفق باشد → امتیاز به حریف
4. **Let**: اگر توپ به تور بخورد و داخل بیفتد → سرویس تکرار می‌شود
5. **تغییر سرویس**: بعد از هر Game، سرویس تغییر می‌کند

### قوانین امتیازدهی

1. **برد Game**: بازیکنی که 4 امتیاز بگیرد (با اختلاف 2 در صورت Deuce)
2. **برد Set**: بازیکنی که 6 Game ببرد (با اختلاف 2)
3. **برد Match**: بازیکنی که 2 Set ببرد (Best of 3)

### قوانین Tiebreak (برای آینده)

1. وقتی نتیجه Set به 6-6 برسد → Tiebreak
2. اولین بازیکنی که 7 امتیاز بگیرد (با اختلاف 2) → Set
3. سرویس هر 2 امتیاز تغییر می‌کند

---

## 🎨 کامپوننت‌های UI مرتبط

### ScoreBoard

نمایش state فعلی ScoringEngine:

```typescript
interface ScoreBoardProps {
  scoreState: ScoringState;
  studentName: string;
  opponentName: string;
}

// نمایش:
// Sets: studentSets - opponentSets
// Games: studentGames - opponentGames
// Points: convertToTennisScore(studentPoints) - convertToTennisScore(opponentPoints)
```

### FinalStrokeForm

فرم ثبت ضربه نهایی:

```typescript
interface FinalStrokeFormProps {
  onSubmit: (data: FinalStrokeData) => void;
  onCancel: () => void;
  studentName: string;
  opponentName: string;
}

interface FinalStrokeData {
  player: 'student' | 'opponent';
  type: string;        // forehand, backhand, ...
  direction: string;   // cross_court, down_the_line, center
  result: 'winner' | 'unforced_error' | 'forced_error' | 'net';
}
```

### Points Timeline

نمایش تاریخچه امتیازات:

```typescript
// نمایش 5 امتیاز آخر به صورت معکوس (جدیدترین بالا)
{points.slice(-5).reverse().map(point => (
  <TimelineItem
    key={point.id}
    winner={point.point_winner}
    gameScore={point.game_score}
    pointNumber={point.point_number}
  />
))}
```

---

## 🐛 عیب‌یابی

### مشکل: امتیازات از 1-1 شروع می‌شوند

**علت:** مقدار پیش‌فرض در `ScoringEngine` اشتباه است.

**راه‌حل:**
```typescript
// ❌ اشتباه
private state = {
  studentSets: 1,
  opponentSets: 1,
  studentGames: 1,
  opponentGames: 1,
};

// ✅ درست
private state = {
  studentSets: 0,
  opponentSets: 0,
  studentGames: 0,
  opponentGames: 0,
};
```

---

### مشکل: state بعد از Undo درست بازسازی نمی‌شود

**علت:** `reconstructScoringState` به درستی implement نشده است.

**راه‌حل:**
```typescript
const reconstructScoringState = (pointsData: Point[]) => {
  const engine = new ScoringEngine();
  
  // اگر امتیازی نیست، state پیش‌فرض (0-0) باقی می‌ماند
  if (pointsData && pointsData.length > 0) {
    for (const point of pointsData) {
      if (point.point_winner) {
        engine.addPoint(point.point_winner);
      }
    }
  }
  
  scoringEngine.setState(engine.getState());
};
```

---

### مشکل: فاز ثبت بعد از savePoint ریست نمی‌شود

**علت:** `reset()` و `startPoint()` صدا زده نمی‌شوند.

**راه‌حل:**
```typescript
const savePoint = async () => {
  // ... ذخیره در بک‌اند ...
  
  // ✅ ریست و شروع امتیاز بعدی
  pointEngine.reset();
  pointEngine.startPoint(scoringEngine.getState().server);
  setCurrentPhase(pointEngine.getCurrentPhase());
};
```

---

### مشکل: دکمه‌های اکشن نمایش داده نمی‌شوند

**علت:** `currentPhase` به درستی update نمی‌شود.

**راه‌حل:**
```typescript
const handleAction = async (actionId: string) => {
  const success = pointEngine.performAction(actionId);
  
  if (!success) {
    toast.error('Invalid action');
    return;
  }
  
  if (pointEngine.isPointComplete()) {
    await savePoint();
  } else {
    // ✅ update فاز فعلی
    setCurrentPhase(pointEngine.getCurrentPhase());
    forceUpdate({}); // Force re-render
  }
};
```

---

## 📊 آمار قابل استخراج

از داده‌های points می‌توان آمارهای زیر را استخراج کرد:

### آمار سرویس

```typescript
// درصد سرویس اول
const firstServePercentage = (firstServesIn / totalFirstServes) * 100;

// تعداد Ace
const aces = points.filter(p => p.serve_result === 'ace').length;

// تعداد Double Fault
const doubleFaults = points.filter(p => p.serve_result === 'double_fault').length;
```

### آمار ضربات برنده

```typescript
// Winners
const winners = points.filter(p => p.final_stroke_result === 'winner').length;

// Unforced Errors
const unforcedErrors = points.filter(p => p.final_stroke_result === 'unforced_error').length;

// Forced Errors
const forcedErrors = points.filter(p => p.final_stroke_result === 'forced_error').length;
```

### آمار جهت ضربات

```typescript
// Cross Court
const crossCourt = points.filter(p => p.final_stroke_direction === 'cross_court').length;

// Down the Line
const downTheLine = points.filter(p => p.final_stroke_direction === 'down_the_line').length;
```

---

##  تست

### Unit Test برای ScoringEngine

```typescript
describe('ScoringEngine', () => {
  it('should start from 0-0', () => {
    const engine = new ScoringEngine();
    const state = engine.getState();
    expect(state.studentSets).toBe(0);
    expect(state.opponentSets).toBe(0);
    expect(state.studentGames).toBe(0);
    expect(state.opponentGames).toBe(0);
  });
  
  it('should handle Deuce correctly', () => {
    const engine = new ScoringEngine();
    // 40-40
    engine.addPoint('student'); // 0
    engine.addPoint('student'); // 15
    engine.addPoint('student'); // 30
    engine.addPoint('opponent'); // 0-15
    engine.addPoint('opponent'); // 15-15
    engine.addPoint('opponent'); // 30-30
    engine.addPoint('opponent'); // 40-30
    
    const state = engine.getState();
    expect(state.studentPoints).toBe(3);
    expect(state.opponentPoints).toBe(3);
  });
});
```

### Unit Test برای PointRecordingEngine

```typescript
describe('PointRecordingEngine', () => {
  it('should handle Ace correctly', () => {
    const engine = new PointRecordingEngine();
    engine.startPoint('student');
    engine.performAction('ace');
    
    expect(engine.isPointComplete()).toBe(true);
    expect(engine.getPointWinner()).toBe('student');
  });
  
  it('should handle Double Fault correctly', () => {
    const engine = new PointRecordingEngine();
    engine.startPoint('student');
    engine.performAction('fault');
    engine.performAction('double_fault');
    
    expect(engine.isPointComplete()).toBe(true);
    expect(engine.getPointWinner()).toBe('opponent');
  });
});
```

---

## 📚 داکیومنت‌های مرتبط

- [01-architecture.md](./01-architecture.md) - معماری سیستم
- [02-database-schema.md](./02-database-schema.md) - ساختار دیتابیس
- [04-api-reference.md](./04-api-reference.md) - مستندات API
- [05-ui-components.md](./05-ui-components.md) - کامپوننت‌های UI

---

**آخرین به‌روزرسانی:** ۱ ژوئیه ۲۰۲۶  
**توسط:** تیم توسعه TennisPilot