import sqlite3

c1 = sqlite3.connect('products/coach-assistant/backend/tennis_coach.db')
cursor = c1.cursor()
for table in ['pilot_matches', 'pilot_points', 'pilot_analyses']:
    cursor.execute(f"PRAGMA table_info({table});")
    cols = [r[1] for r in cursor.fetchall()]
    print(f"{table} columns:", cols)
