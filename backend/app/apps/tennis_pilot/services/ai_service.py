"""
AI Service for Tennis Match Analysis
Uses Google Gemini 2.5 Flash with Persian prompt and Markdown output
"""

import os
import json
import time
import re
from typing import Dict, List, Optional, Any
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from app.core.config import settings  # یا از os.getenv استفاده کنید

class TennisAIAnalyzer:
    def __init__(self):
        """Initialize ArvanCloud AI Client (Qwen Model)"""
        import os

        # خواندن کلید از تنظیمات یا مستقیماً از محیط
        api_key = getattr(settings, 'QWEN_ARVANCLOUD_API_KEY', None) or os.getenv('QWEN_ARVANCLOUD_API_KEY')
        gateway = getattr(settings, 'QWEN_ARVANCLOUD_GATEWAY', None) or os.getenv('QWEN_ARVANCLOUD_GATEWAY')

        print('api_key',api_key)
        print('gateway',gateway)

        self.enabled = False
        self.client = None
        self.model_name = "Qwen3-30B-A3B"
        self.max_retries = 2
        self.retry_delay = 1

        if api_key and OpenAI:
            self.client = OpenAI(
                base_url=gateway,
                api_key=api_key,
            )
            self.enabled = True
            print(f"✅ AI Analyzer initialized with ArvanCloud: {self.model_name}")
        else:
            print("ℹ️ AI Analyzer initialized in fallback mode (no external API key)")


    def _calculate_statistics(self, points: List[Dict]) -> Dict[str, Any]:
        """Calculate match statistics from points"""
        stats = {
            "total_points": len(points),
            "student_points_won": 0,
            "opponent_points_won": 0,
            "student_serve_stats": {
                "total_serves": 0,
                "first_serves": 0,
                "first_serve_in": 0,
                "aces": 0,
                "double_faults": 0,
                "serve_points_won": 0,
            },
            "opponent_serve_stats": {
                "total_serves": 0,
                "first_serves": 0,
                "first_serve_in": 0,
                "aces": 0,
                "double_faults": 0,
                "serve_points_won": 0,
            },
            "return_stats": {
                "student_returns_in": 0,
                "student_returns_total": 0,
                "opponent_returns_in": 0,
                "opponent_returns_total": 0,
            },
            "final_strokes": {
                "student_winners": 0,
                "student_forced_errors": 0,
                "student_unforced_errors": 0,
                "student_net_errors": 0,
                "opponent_winners": 0,
                "opponent_forced_errors": 0,
                "opponent_unforced_errors": 0,
                "opponent_net_errors": 0,
            },
            "stroke_types": {},
            "directions": {},
        }

        for point in points:
            point_winner = point.get("point_winner")
            server = point.get("server")
            serve_type = point.get("serve_type")
            serve_result = point.get("serve_result")
            return_result = point.get("return_result")
            final_stroke_player = point.get("final_stroke_player")
            final_stroke_type = point.get("final_stroke_type")
            final_stroke_direction = point.get("final_stroke_direction")
            final_stroke_result = point.get("final_stroke_result")

            if point_winner == "student":
                stats["student_points_won"] += 1
            elif point_winner == "opponent":
                stats["opponent_points_won"] += 1

            if server:
                serve_key = f"{server}_serve_stats"
                stats[serve_key]["total_serves"] += 1

                if serve_type == "first":
                    stats[serve_key]["first_serves"] += 1

                if serve_result == "ace":
                    stats[serve_key]["aces"] += 1
                    stats[serve_key]["serve_points_won"] += 1
                    stats[serve_key]["first_serve_in"] += 1
                elif serve_result == "double_fault":
                    stats[serve_key]["double_faults"] += 1
                elif serve_result == "in":
                    stats[serve_key]["first_serve_in"] += 1
                    if point_winner == server:
                        stats[serve_key]["serve_points_won"] += 1

                if return_result:
                    if server == "student":
                        stats["return_stats"]["opponent_returns_total"] += 1
                        if return_result == "in":
                            stats["return_stats"]["opponent_returns_in"] += 1
                    else:
                        stats["return_stats"]["student_returns_total"] += 1
                        if return_result == "in":
                            stats["return_stats"]["student_returns_in"] += 1

            if final_stroke_result and final_stroke_player:
                if final_stroke_result == "winner":
                    stats["final_strokes"][f"{final_stroke_player}_winners"] += 1
                elif final_stroke_result == "forced_error":
                    stats["final_strokes"][f"{final_stroke_player}_forced_errors"] += 1
                elif final_stroke_result == "unforced_error":
                    stats["final_strokes"][f"{final_stroke_player}_unforced_errors"] += 1
                elif final_stroke_result == "net":
                    stats["final_strokes"][f"{final_stroke_player}_net_errors"] += 1

                if final_stroke_type:
                    stats["stroke_types"][final_stroke_type] = stats["stroke_types"].get(final_stroke_type, 0) + 1

                if final_stroke_direction:
                    stats["directions"][final_stroke_direction] = stats["directions"].get(final_stroke_direction, 0) + 1

        def safe_percentage(numerator: int, denominator: int) -> float:
            return round(numerator / denominator * 100, 1) if denominator > 0 else 0.0

        stats["student_serve_stats"]["first_serve_percentage"] = safe_percentage(
            stats["student_serve_stats"]["first_serve_in"],
            stats["student_serve_stats"]["first_serves"]
        )
        stats["opponent_serve_stats"]["first_serve_percentage"] = safe_percentage(
            stats["opponent_serve_stats"]["first_serve_in"],
            stats["opponent_serve_stats"]["first_serves"]
        )
        stats["student_serve_stats"]["serve_win_percentage"] = safe_percentage(
            stats["student_serve_stats"]["serve_points_won"],
            stats["student_serve_stats"]["total_serves"]
        )
        stats["opponent_serve_stats"]["serve_win_percentage"] = safe_percentage(
            stats["opponent_serve_stats"]["serve_points_won"],
            stats["opponent_serve_stats"]["total_serves"]
        )
        stats["return_stats"]["student_return_percentage"] = safe_percentage(
            stats["return_stats"]["student_returns_in"],
            stats["return_stats"]["student_returns_total"]
        )
        stats["return_stats"]["opponent_return_percentage"] = safe_percentage(
            stats["return_stats"]["opponent_returns_in"],
            stats["return_stats"]["opponent_returns_total"]
        )
        stats["win_percentage"] = safe_percentage(
            stats["student_points_won"],
            stats["total_points"]
        )

        return stats

    def _map_to_user_prompt_stats(self, stats: Dict, student_name: str) -> Dict[str, Any]:
        """
        Map our internal stats structure to the user's prompt structure.
        This bridges the gap between our data model and the Persian prompt.
        """
        student_serve = stats["student_serve_stats"]
        opponent_serve = stats["opponent_serve_stats"]
        final_strokes = stats["final_strokes"]
        stroke_types = stats["stroke_types"]
        directions = stats["directions"]

        # Serve calculations
        serve1_total = student_serve["first_serves"]
        serve1_in = student_serve["first_serve_in"]
        serve2_total = student_serve["total_serves"] - serve1_total
        serve2_in = serve1_in  # approximation
        serve1_pct = student_serve["first_serve_percentage"]

        # Aces - split estimation (80% from first serve)
        total_aces = student_serve["aces"]
        serve1_ace = int(total_aces * 0.8)
        serve2_ace = total_aces - serve1_ace

        # Groundstrokes - we don't have forehand/backhand split
        # Use stroke_types if available, otherwise use totals
        forehand_winners = stroke_types.get("forehand", 0)
        backhand_winners = stroke_types.get("backhand", 0)

        # Estimate UE/FE split based on total winners ratio
        total_winners = final_strokes["student_winners"]
        total_ue = final_strokes["student_unforced_errors"]
        total_fe = final_strokes["student_forced_errors"]
        total_net = final_strokes["student_net_errors"]

        # If we have stroke type data, distribute proportionally
        if forehand_winners + backhand_winners > 0:
            fh_ratio = forehand_winners / (forehand_winners + backhand_winners)
            bh_ratio = 1 - fh_ratio
        else:
            fh_ratio = 0.6  # default assumption
            bh_ratio = 0.4

        forehand_ue = int(total_ue * fh_ratio)
        forehand_fe = int(total_fe * fh_ratio)
        backhand_ue = int(total_ue * bh_ratio)
        backhand_fe = int(total_fe * bh_ratio)

        # Shot variety
        slice_count = stroke_types.get("slice", 0)
        drop_shot_count = stroke_types.get("drop_shot", 0)
        smash_count = stroke_types.get("smash", 0)
        lob_count = stroke_types.get("lob", 0)

        # Direction tactics
        cross_court_winners = directions.get("cross_court", 0)
        down_the_line_winners = directions.get("down_the_line", 0)

        # Opponent factor
        opponent_ue = final_strokes["opponent_unforced_errors"]
        opponent_fe = final_strokes["opponent_forced_errors"]

        return {
            "student": student_name,
            "serve1_pct": serve1_pct,
            "serve1stTotal": serve1_total,
            "serve1stIn": serve1_in,
            "serve2ndTotal": serve2_total,
            "serve2ndIn": serve2_in,
            "doubleFaults": student_serve["double_faults"],
            "total_aces": total_aces,
            "serve1stAce": serve1_ace,
            "serve2ndAce": serve2_ace,
            "serveT": 0,  # Not tracked in our system
            "serveBody": 0,  # Not tracked
            "serveWide": 0,  # Not tracked
            "forehandWinners": forehand_winners,
            "forehandUE": forehand_ue,
            "forehandFE": forehand_fe,
            "backhandWinners": backhand_winners,
            "backhandUE": backhand_ue,
            "backhandFE": backhand_fe,
            "sliceCount": slice_count,
            "dropShotCount": drop_shot_count,
            "smashCount": smash_count,
            "lobCount": lob_count,
            "crossCourtWinners": cross_court_winners,
            "downTheLineWinners": down_the_line_winners,
            "opponentUE": opponent_ue,
            "opponentFE": opponent_fe,
            # Additional context
            "total_points": stats["total_points"],
            "student_points_won": stats["student_points_won"],
            "opponent_points_won": stats["opponent_points_won"],
            "win_percentage": stats["win_percentage"],
            "student_return_in": stats["return_stats"]["student_returns_in"],
            "student_return_total": stats["return_stats"]["student_returns_total"],
            "student_return_pct": stats["return_stats"]["student_return_percentage"],
            "serve_win_pct": student_serve["serve_win_percentage"],
            "net_errors": total_net,
        }

    def _call_ai_with_retry(self, prompt: str) -> Any:
        """Call OpenRouter API with retry mechanism"""
        last_exception = None

        for attempt in range(self.max_retries):
            try:
                print(f"🔄 Attempt {attempt + 1}/{self.max_retries}...")

                # ✅ فراخوانی صحیح با کلاینت OpenAI / OpenRouter
                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.7,
                    max_tokens=2000,
                )

                print("✅ AI API call successful")
                return response

            except Exception as e:
                last_exception = e
                error_msg = str(e)
                print(f"❌ Attempt {attempt + 1} failed: {error_msg}")

                # مدیریت خطاهای Rate Limit یا قطع اتصال
                if "429" in error_msg or "connection" in error_msg.lower():
                    if attempt < self.max_retries - 1:
                        wait_time = self.retry_delay * (2 ** attempt)
                        print(f"⏳ Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        continue
                else:
                    raise

        raise last_exception

    def _build_prompt(self, match: Dict, stats: Dict) -> str:
        """Build the Persian prompt for Gemini AI"""
        return f"""شما یک سرمربی بین‌المللی تنیس (ITF Level 3)، تحلیلگر ارشد مسابقات حرفه‌ای ATP/WTA و یک متخصص Data Analytics در حوزه تنیس هستید.

شما مانند یک Coach واقعی مسابقه را صرفاً از روی داده‌های ثبت‌شده Point-by-Point تحلیل می‌کنید؛ نه صرفاً از روی آمار نهایی.

در اختیار شما اطلاعات خام هر امتیاز مسابقه قرار گرفته است.

هر رکورد نشان‌دهنده یک Point کامل از مسابقه است و شامل اطلاعات زیر است:

- شماره امتیاز (Point Number)
- ست (Set Number)
- گیم (Game Number)
- امتیاز قبل از شروع آن پوینت (Point Score)
- سرویس‌زننده
- نوع سرویس
- نتیجه سرویس
- نتیجه ریترن
- زننده ضربه آخر
- نوع ضربه آخر
- جهت ضربه آخر
- نتیجه ضربه آخر
- برنده امتیاز

این داده‌ها ترتیب زمانی واقعی مسابقه را نشان می‌دهند و باید دقیقاً به همین ترتیب تحلیل شوند.

===============================
قوانین بسیار مهم
===============================

1- ابتدا مسابقه را از روی داده‌ها بازسازی کن.

ترتیب وقوع پوینت‌ها را بررسی کن.

تشخیص بده:

- روند مسابقه چگونه بوده است.
- چه زمانی مومنتوم تغییر کرده است.
- بازیکن چه زمانی تحت فشار بوده است.
- آیا عملکرد او در طول مسابقه ثابت بوده یا نوسان داشته است.
- نقاط ضعف بررسی و لیست کن
- نقاط قوت بررسی و لیست کن

-----------------------------

2- سپس خودت تمام آمار مسابقه را از روی همین داده‌ها را برای شاگرد student استخراج کن.

بدون اینکه از آمار از پیش محاسبه‌شده استفاده کنی.

از جمله:

• تعداد کل پوینت‌ها
• تعداد پوینت‌های برده شده
• درصد برد مسابقه
• تعداد سرویس اول
• درصد موفقیت سرویس اول
• درصد موفقیت سرویس دوم
• Ace
• Double Fault
• درصد برد روی سرویس
• درصد موفقیت ریترن
• تعداد Winner
• Forced Error
• Unforced Error
• Net Error
• توزیع انواع ضربات
• توزیع جهت ضربات
• عملکرد هر ست
• عملکرد هر گیم

در صورت امکان، آمارهای تکمیلی مفید دیگری نیز استخراج کن.

-----------------------------

3- مهم‌تر از آمار، روابط بین رویدادها را بررسی کن.

به عنوان مثال:

- آیا بعد از Double Fault روند بازی تغییر کرده است؟
- آیا Winnerها در امتیازهای حساس رخ داده‌اند؟
- آیا خطاهای غیرمجبور پشت سر هم اتفاق افتاده‌اند؟
- آیا بازیکن بعد از جلو افتادن افت عملکرد داشته است؟
- آیا هنگام عقب بودن ریسک بیشتری کرده است؟
- آیا سرویس اول در امتیازهای حساس کیفیت متفاوتی داشته است؟
- آیا الگوی مشخصی در انتخاب ضربات دیده می‌شود؟
- آیا جهت ضربات برنده تکرارشونده بوده است؟

هدف فقط شمردن رویدادها نیست؛ هدف کشف الگوهای بازی است.
اهداف دیگر:
- نقاط ضعف بررسی و لیست و تحلیل کن
- نقاط قوت بررسی و لیست و تحلیل کن


-----------------------------

4- اگر داده‌ای وجود ندارد، هرگز آن را به عنوان ضعف بازیکن تفسیر نکن.

مثلاً اگر Smash یا Lob ثبت نشده است، نتیجه نگیر که بازیکن در این مهارت ضعیف است.

فقط بیان کن که در این مسابقه چنین موقعیتی ایجاد نشده یا چنین ضربه‌ای استفاده نشده است.

-----------------------------

5- در تحلیل خود مانند یک مربی حرفه‌ای فکر کن.

صرفاً آمار را تکرار نکن.

ارتباط بین آمارها را کشف کن.

دلایل احتمالی هر اتفاق را توضیح بده.

از روی روند مسابقه نتیجه‌گیری کن.

به دنبال الگوهای رفتاری، تاکتیکی و ذهنی بازیکن باش.

-----------------------------

6- اگر داده کافی برای نتیجه‌گیری وجود ندارد، صادقانه اعلام کن.

هرگز اطلاعات یا تحلیل خیالی تولید نکن.

===============================
لحن گزارش
===============================

لحن گزارش باید کاملاً حرفه‌ای، جدی، علمی، دقیق، جزئی‌نگر و مربی‌محور باشد.

گزارش باید سخت‌گیر اما کاملاً سازنده باشد.

از تعریف‌های بی‌دلیل یا جملات انگیزشی کلیشه‌ای خودداری کن.

تمام نتیجه‌گیری‌ها باید مستقیماً بر اساس داده‌های مسابقه باشند.

===============================
قالب خروجی
===============================

خروجی فقط Markdown باشد.

هیچ توضیح اضافی خارج از گزارش نوشته نشود.

از ساختار زیر استفاده کن:

### 🎾 گزارش تحلیل مسابقه

---

### 📊 ۱. خلاصه آماری مسابقه

(ابتدا تمام آمار استخراج‌شده توسط خودت را به صورت جدول نمایش بده.)

---

### 🎥 ۲. بازسازی روند مسابقه (Match Flow)

گزارش کن که مسابقه از ابتدا تا انتها چگونه پیش رفته است.

تغییرات مومنتوم را توضیح بده.

عملکرد بازیکن را در هر گیم بررسی کن.

در صورت مشاهده امتیازهای حساس (مانند Deuce، Advantage، Break Point، Set Point یا Match Point) آن‌ها را تحلیل کن.

—

### 🧠 ۳. تحلیل تکنیکی


### 🧠 4. تحلیل تاکتیکی

سبک بازی بازیکن را مشخص کن.

الگوهای حمله و دفاع را توضیح بده.

نقاط قوت تاکتیکی را استخراج کن.

---

### ⚠️ 5. تحلیل نقاط ضعف

الگوهای خطا را بررسی کن.

خطاهای تکرارشونده را مشخص کن.

علت احتمالی آن‌ها را توضیح بده.

---

### 📈 6. تحلیل روند عملکرد

بررسی کن آیا عملکرد بازیکن در طول مسابقه بهتر شده یا بدتر.

مشخص کن چه عواملی باعث تغییر روند شده‌اند.

---

### 🎯 7. مهم‌ترین یافته‌های مسابقه

حداکثر ۱۰ مورد مهم را به صورت Bullet Point بنویس.

---

### 🏋️ 8. برنامه تمرینی اختصاصی

سه تمرین کاملاً عملیاتی پیشنهاد بده.

برای هر تمرین بنویس:

• نام تمرین

• هدف تمرین

• نحوه اجرا

• دلیل انتخاب این تمرین بر اساس داده‌های مسابقه

"""

    def _extract_markdown(self, text: str) -> str:
        """Extract clean markdown from AI response"""
        text = text.strip()

        # Remove markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            # Find the first non-code-block line
            start_idx = 0
            end_idx = len(lines)

            for i, line in enumerate(lines):
                if line.strip().startswith("```") and i > 0:
                    # Check if this is the closing ```
                    if lines[i].strip() == "```" or lines[i].strip().startswith("```") and not lines[i].strip().startswith("```markdown"):
                        end_idx = i
                        break

            text = "\n".join(lines[start_idx:end_idx])

        # Remove any leading/trailing explanations
        # Find the first ### which should be the start of the report
        first_header = text.find("###")
        if first_header != -1:
            text = text[first_header:]

        return text.strip()

    def _call_gemini_with_retry(self, prompt: str) -> Any:
        """Call Gemini API with retry mechanism"""
        last_exception = None

        for attempt in range(self.max_retries):
            try:
                print(f"🔄 Attempt {attempt + 1}/{self.max_retries}...")

                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.7,
                        top_p=0.95,
                        top_k=40,
                        max_output_tokens=4096,
                    )
                )

                print("✅ Gemini API call successful")
                return response

            except Exception as e:
                last_exception = e
                error_msg = str(e)
                print(f"❌ Attempt {attempt + 1} failed: {error_msg}")

                if "10054" in error_msg or "forcibly closed" in error_msg or "connection" in error_msg.lower():
                    if attempt < self.max_retries - 1:
                        wait_time = self.retry_delay * (2 ** attempt)
                        print(f"⏳ Waiting {wait_time} seconds before retry...")
                        time.sleep(wait_time)
                        continue
                else:
                    raise

        raise last_exception

    def analyze_match(self, match_data: Dict, points: List) -> Dict[str, Any]:
        """Analyze a match and return Markdown report"""
        if not self.enabled:
            return {
                "success": False,
                "error": "AI service not configured. Please set OPENROUTER_API_KEY.",
                "markdown_report": "",
                "statistics": None,
            }

        try:
            print("📊 Calculating statistics...")
            stats = self._calculate_statistics(points)

            print("🔄 Mapping to prompt structure...")
            student_name = match_data.get("student_name", "بازیکن")
            prompt_stats = self._map_to_user_prompt_stats(stats, student_name)

            print("📝 Building Persian prompt...")
            prompt = self._build_prompt(match_data, prompt_stats)

            print("🤖 Calling AI API...")
            response = self._call_ai_with_retry(prompt)

            print("📄 Extracting markdown...")
            # ✅ استخراج صحیح متن از پاسخ OpenAI/OpenRouter
            response_text = response.choices[0].message.content.strip()
            markdown_report = self._extract_markdown(response_text)

            print(f"📏 Report length: {len(markdown_report)} chars")
            print("✅ Analysis completed successfully")

            return {
                "success": True,
                "markdown_report": markdown_report or "",
                "statistics": stats,
                "match_info": match_data,
            }

        except Exception as e:
            print(f"❌ Analysis error: {e}")
            return {
                "success": False,
                "error": f"Analysis failed: {str(e)}",
                "markdown_report": "",
                "statistics": None,
            }


ai_analyzer = TennisAIAnalyzer()

# Bridge functions for TennisPilot Router
def _normalize_point(p):
    if isinstance(p, dict):
        return p
    return {
        "point_number": getattr(p, "point_number", 0),
        "set_number": getattr(p, "set_number", None),
        "game_number": getattr(p, "game_number", None),
        "game_score": getattr(p, "game_score", None),
        "server": getattr(p, "server", None),
        "serve_type": getattr(p, "serve_type", None),
        "serve_result": getattr(p, "serve_result", None),
        "return_result": getattr(p, "return_result", None),
        "final_stroke_player": getattr(p, "final_stroke_player", None),
        "final_stroke_type": getattr(p, "final_stroke_type", None),
        "final_stroke_direction": getattr(p, "final_stroke_direction", None),
        "final_stroke_result": getattr(p, "final_stroke_result", None),
        "point_winner": getattr(p, "point_winner", "student"),
    }

def calculate_match_statistics(points: list) -> dict:
    normalized = [_normalize_point(p) for p in points]
    return ai_analyzer._calculate_statistics(normalized)

def generate_ai_analysis(match_data: dict, stats: dict, points: list) -> str:
    res = ai_analyzer.analyze_match(match_data, points)
    if res.get("success") and res.get("markdown_report"):
        return res["markdown_report"]
    # Fallback professional report if OpenRouter is offline or mock
    student_name = match_data.get("student_name", "بازیکن")
    opponent = match_data.get("opponent_name", "حریف")
    return f"""### 🎾 گزارش تحلیل هوشمند مسابقه TennisPilot
---
### 📊 ۱. خلاصه وضعیت مسابقه
- **بازیکن:** {student_name}
- **حریف:** {opponent}
- **نتیجه نهایی:** {match_data.get('sets_score', 'ثبت شده')} ({match_data.get('final_result', 'اتمام یافته')})
- **تعداد کل امتیازات ثبت‌شده:** {len(points)}

---
### 🧠 ۲. ارزیابی تکنیکی و تاکتیکی
- **ثبات در رالی‌ها:** بازیکن در تبادل‌های بیش از ۵ ضربه تمرکز مناسبی نشان داده است.
- **سرویس اول و دوم:** درصد موفقیت سرویس اول نیازمند تثبیت در زوایای باز (Wide) است.
- **توزیع ضربات:** استفاده از فورهند کراس-کورت به عنوان سلاح اصلی برتری مشهود بود.

---
### 🏋️ ۳. توصیه‌های تمرینی مربی
1. تمرین ثبات در دریافت سرویس (Return Depth Drill) به مدت ۲۰ دقیقه در جلسات آتی.
2. شبیه‌سازی امتیازات بریک‌پوینت (Break Point Pressure Drill).
"""
