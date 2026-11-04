import sqlite3

c = sqlite3.connect('platform-core/database/tennis_platform.db')
cursor = c.cursor()

# Ensure matches, points, analyses tables exist
cursor.execute("""
CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    opponent_name VARCHAR(100) NOT NULL,
    match_date VARCHAR(20) NOT NULL,
    location VARCHAR(100),
    match_type VARCHAR(50) DEFAULT 'singles',
    status VARCHAR(20) DEFAULT 'ongoing',
    sets_score VARCHAR(50),
    final_result VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    student_games_won INTEGER DEFAULT 0,
    opponent_games_won INTEGER DEFAULT 0
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    point_number INTEGER NOT NULL,
    set_number INTEGER,
    game_number INTEGER,
    game_score VARCHAR(20),
    server VARCHAR(20),
    serve_type VARCHAR(20),
    serve_result VARCHAR(20),
    return_result VARCHAR(20),
    final_stroke_player VARCHAR(20),
    final_stroke_type VARCHAR(50),
    final_stroke_direction VARCHAR(50),
    final_stroke_result VARCHAR(50),
    point_winner VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    markdown_report TEXT NOT NULL,
    statistics JSON,
    match_info JSON,
    model_used VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(match_id) REFERENCES matches(id) ON DELETE CASCADE
);
""")

c.commit()
c.close()
print("Matches, points, analyses verified in tennis_platform.db")
