"""
AI Service for Tennis Match Analysis
Uses Google Gemini 2.5 Flash with retry and robust JSON parsing
"""

import os
import json
import time
import re
from typing import Dict, List, Optional, Any
from google import genai
from google.genai import types
from app.config import settings


class TennisAIAnalyzer:
    """AI-powered tennis match analyzer using Gemini 2.5 Flash"""

    def __init__(self):
        """Initialize Gemini AI with new SDK"""
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            self.model_name = "gemini-2.5-flash"
            self.enabled = True
            self.max_retries = 3
            self.retry_delay = 2
            print(f"✅ AI Analyzer initialized with model: {self.model_name}")
        else:
            self.client = None
            self.enabled = False
            print("⚠️ Warning: GEMINI_API_KEY not set. AI analysis disabled.")

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
            if denominator > 0:
                return round(numerator / denominator * 100, 1)
            return 0.0

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

    def _build_prompt(self, match: Dict, stats: Dict) -> str:
        """Build the prompt for Gemini AI"""
        return f"""You are an expert tennis coach analyzing a match. Based on the following statistics, provide a detailed analysis.

MATCH:
- Student: {match.get('student_name', 'Student')}
- Opponent: {match.get('opponent_name', 'Opponent')}
- Date: {match.get('match_date', 'Unknown')}
- Result: {match.get('final_result', 'Unknown')}
- Sets: {match.get('sets_score', 'Unknown')}

STATISTICS:
- Total Points: {stats['total_points']}
- Student Won: {stats['student_points_won']} ({stats['win_percentage']}%)
- Opponent Won: {stats['opponent_points_won']}

STUDENT SERVE:
- Total: {stats['student_serve_stats']['total_serves']}
- 1st Serve %: {stats['student_serve_stats'].get('first_serve_percentage', 0)}%
- Aces: {stats['student_serve_stats']['aces']}
- Double Faults: {stats['student_serve_stats']['double_faults']}
- Serve Points Won: {stats['student_serve_stats'].get('serve_win_percentage', 0)}%

OPPONENT SERVE:
- Total: {stats['opponent_serve_stats']['total_serves']}
- 1st Serve %: {stats['opponent_serve_stats'].get('first_serve_percentage', 0)}%
- Aces: {stats['opponent_serve_stats']['aces']}
- Double Faults: {stats['opponent_serve_stats']['double_faults']}
- Serve Points Won: {stats['opponent_serve_stats'].get('serve_win_percentage', 0)}%

RETURNS:
- Student: {stats['return_stats']['student_returns_in']}/{stats['return_stats']['student_returns_total']} ({stats['return_stats'].get('student_return_percentage', 0)}%)
- Opponent: {stats['return_stats']['opponent_returns_in']}/{stats['return_stats']['opponent_returns_total']} ({stats['return_stats'].get('opponent_return_percentage', 0)}%)

FINAL STROKES (Student):
- Winners: {stats['final_strokes']['student_winners']}
- Forced Errors: {stats['final_strokes']['student_forced_errors']}
- Unforced Errors: {stats['final_strokes']['student_unforced_errors']}
- Net Errors: {stats['final_strokes']['student_net_errors']}

FINAL STROKES (Opponent):
- Winners: {stats['final_strokes']['opponent_winners']}
- Forced Errors: {stats['final_strokes']['opponent_forced_errors']}
- Unforced Errors: {stats['final_strokes']['opponent_unforced_errors']}
- Net Errors: {stats['final_strokes']['opponent_net_errors']}

STROKE TYPES: {json.dumps(stats['stroke_types'])}
DIRECTIONS: {json.dumps(stats['directions'])}

IMPORTANT: Respond with ONLY valid JSON (no markdown, no code blocks, no extra text). Keep responses concise.

{{
  "summary": "2-3 sentence summary",
  "overall_rating": "excellent|good|average|below_average|poor",
  "strengths": ["strength 1 with data", "strength 2 with data", "strength 3 with data"],
  "weaknesses": ["weakness 1 with data", "weakness 2 with data", "weakness 3 with data"],
  "key_insights": ["insight 1", "insight 2", "insight 3"],
  "training_recommendations": [
    {{"area": "area", "priority": "high|medium|low", "drill": "drill name", "description": "description", "duration": "duration"}},
    {{"area": "area", "priority": "high|medium|low", "drill": "drill name", "description": "description", "duration": "duration"}},
    {{"area": "area", "priority": "high|medium|low", "drill": "drill name", "description": "description", "duration": "duration"}}
  ],
  "serve_analysis": {{"rating": "excellent|good|average|below_average|poor", "notes": "notes"}},
  "return_analysis": {{"rating": "excellent|good|average|below_average|poor", "notes": "notes"}},
  "rally_analysis": {{"rating": "excellent|good|average|below_average|poor", "notes": "notes"}},
  "mental_game": {{"rating": "excellent|good|average|below_average|poor", "notes": "notes"}},
  "next_match_strategy": "brief strategy"
}}
"""

    def _extract_json(self, text: str) -> str:
        """Extract JSON from text, handling markdown code blocks"""
        # Remove markdown code blocks
        text = text.strip()

        # Pattern 1: ```json ... ```
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
        if json_match:
            return json_match.group(1).strip()

        # Pattern 2: Find JSON object directly
        # Find first { and last }
        first_brace = text.find('{')
        last_brace = text.rfind('}')

        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            return text[first_brace:last_brace + 1]

        return text

    def _parse_json_safely(self, text: str) -> Dict:
        """Parse JSON with multiple fallback strategies"""
        # Strategy 1: Direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Strategy 2: Extract JSON from markdown
        extracted = self._extract_json(text)
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            pass

        # Strategy 3: Try to fix common issues
        # Replace single quotes with double quotes
        fixed = text.replace("'", '"')
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

        # Strategy 4: Try to find and parse the largest valid JSON
        # Find all potential JSON objects
        brace_count = 0
        start = -1
        candidates = []

        for i, char in enumerate(text):
            if char == '{':
                if brace_count == 0:
                    start = i
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0 and start != -1:
                    candidate = text[start:i+1]
                    try:
                        parsed = json.loads(candidate)
                        candidates.append((len(candidate), parsed))
                    except json.JSONDecodeError:
                        pass

        if candidates:
            # Return the largest valid JSON
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]

        raise json.JSONDecodeError("Could not parse JSON", text, 0)

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
                        max_output_tokens=4096,  # ← افزایش از 2048 به 4096
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
        """Analyze a match with robust JSON parsing"""
        if not self.enabled:
            return {
                "success": False,
                "error": "AI service not configured. Please set GEMINI_API_KEY.",
                "analysis": None,
            }

        try:
            print("📊 Calculating statistics...")
            stats = self._calculate_statistics(points)

            print("📝 Building prompt...")
            prompt = self._build_prompt(match_data, stats)

            print("🤖 Calling Gemini API...")
            response = self._call_gemini_with_retry(prompt)

            print("📄 Parsing response...")
            response_text = response.text.strip()

            print(f"📏 Response length: {len(response_text)} chars")

            # Parse JSON with multiple strategies
            try:
                analysis = self._parse_json_safely(response_text)
            except json.JSONDecodeError as e:
                print(f"❌ JSON parse error: {e}")
                print(f"📄 Raw response (first 500 chars): {response_text[:500]}")
                print(f"📄 Raw response (last 500 chars): {response_text[-500:]}")

                # Retry with simpler prompt
                print("🔄 Retrying with simpler prompt...")
                return self._retry_with_simpler_prompt(match_data, stats)

            print("✅ Analysis completed successfully")

            return {
                "success": True,
                "analysis": analysis,
                "statistics": stats,
            }

        except json.JSONDecodeError as e:
            return {
                "success": False,
                "error": f"Failed to parse AI response: {str(e)}",
                "analysis": None,
            }
        except Exception as e:
            print(f"❌ Analysis error: {e}")
            return {
                "success": False,
                "error": f"Analysis failed: {str(e)}",
                "analysis": None,
            }

    def _retry_with_simpler_prompt(self, match_data: Dict, stats: Dict) -> Dict[str, Any]:
        """Retry with a simpler, shorter prompt"""
        try:
            print("🔄 Using simpler prompt...")

            simple_prompt = f"""Analyze this tennis match. Student: {match_data.get('student_name')}, Opponent: {match_data.get('opponent_name')}. 
Result: {match_data.get('final_result')}, Score: {match_data.get('sets_score')}.
Stats: {stats['student_points_won']}/{stats['total_points']} points won ({stats['win_percentage']}%).
Aces: {stats['student_serve_stats']['aces']}, Double Faults: {stats['student_serve_stats']['double_faults']}.
1st Serve %: {stats['student_serve_stats'].get('first_serve_percentage', 0)}%.

Respond ONLY with valid JSON, no markdown:
{{"summary":"brief summary","overall_rating":"good","strengths":["s1","s2","s3"],"weaknesses":["w1","w2","w3"],"key_insights":["i1","i2","i3"],"training_recommendations":[{{"area":"a","priority":"medium","drill":"d","description":"desc","duration":"30min"}}],"serve_analysis":{{"rating":"good","notes":"notes"}},"return_analysis":{{"rating":"good","notes":"notes"}},"rally_analysis":{{"rating":"good","notes":"notes"}},"mental_game":{{"rating":"good","notes":"notes"}},"next_match_strategy":"strategy"}}
"""

            response = self.client.models.generate_content(
                model=self.model_name,
                contents=simple_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=2048,
                )
            )

            response_text = response.text.strip()
            analysis = self._parse_json_safely(response_text)

            print("✅ Simpler prompt successful")

            return {
                "success": True,
                "analysis": analysis,
                "statistics": stats,
            }

        except Exception as e:
            print(f"❌ Simpler prompt also failed: {e}")
            return {
                "success": False,
                "error": f"Analysis failed after retries: {str(e)}",
                "analysis": None,
            }


ai_analyzer = TennisAIAnalyzer()