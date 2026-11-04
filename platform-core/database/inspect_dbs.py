import sqlite3

c1 = sqlite3.connect('products/coach-assistant/backend/tennis_coach.db')
tables1 = [r[0] for r in c1.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
print('coach_assistant tables:', tables1)

c2 = sqlite3.connect('products/ai-coach/backend/tennis.db')
tables2 = [r[0] for r in c2.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]
print('ai_coach tables:', tables2)
