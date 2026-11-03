// Student Types
export interface Student {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    total_matches?: number;
    wins?: number;
    losses?: number;
    win_rate?: number;
}

export interface StudentCreate {
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
}

export interface StudentUpdate {
    name?: string;
    phone?: string;
    email?: string;
    notes?: string;
}

// Match Types
export interface Match {
    id: number;
    student_id: number;
    opponent_name: string;
    match_date: string;
    location?: string;
    match_type: string;
    status: string;
    student_games_won: number;
    opponent_games_won: number;
    sets_score?: string;
    final_result?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface MatchCreate {
    student_id: number;
    opponent_name: string;
    match_date: string;
    location?: string;
    match_type?: string;
    notes?: string;
}

export interface MatchComplete {
    sets_score: string;
    final_result: 'win' | 'loss';
}

// Point Types
export interface Point {
    id: number;
    match_id: number;
    point_number: number;
    set_number: number;
    game_number: number;
    game_score: string;
    server: 'student' | 'opponent';
    serve_type?: 'first' | 'second';
    serve_result?: 'ace' | 'fault' | 'let' | 'in' | 'double_fault';
    return_result?: 'error' | 'in';
    final_stroke_player?: 'student' | 'opponent';
    final_stroke_type?: string;
    final_stroke_direction?: string;
    final_stroke_result?: 'winner' | 'forced_error' | 'unforced_error' | 'net';
    point_winner: 'student' | 'opponent';
    created_at: string;
}

export interface PointCreate {
    match_id: number;
    point_number: number;
    set_number: number;
    game_number: number;
    game_score: string;
    server: 'student' | 'opponent';
    serve_type?: 'first' | 'second';
    serve_result?: 'ace' | 'fault' | 'let' | 'in' | 'double_fault';
    return_result?: 'error' | 'in';
    final_stroke_player?: 'student' | 'opponent';
    final_stroke_type?: string;
    final_stroke_direction?: string;
    final_stroke_result?: 'winner' | 'forced_error' | 'unforced_error' | 'net';
    point_winner: 'student' | 'opponent';
}

// Valid Values
export interface ValidValues {
    players: string[];
    serve_types: string[];
    serve_results: string[];
    return_results: string[];
    stroke_types: string[];
    directions: string[];
    final_stroke_results: string[];
    match_status: string[];
    match_results: string[];
}

// AI Analysis Types
export interface TrainingRecommendation {
    area: string;
    priority: 'high' | 'medium' | 'low';
    drill: string;
    description: string;
    duration: string;
}

export interface PerformanceAnalysis {
    rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    notes: string;
}

export interface MatchAnalysis {
    summary: string;
    overall_rating: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
    strengths: string[];
    weaknesses: string[];
    key_insights: string[];
    training_recommendations: TrainingRecommendation[];
    serve_analysis: PerformanceAnalysis;
    return_analysis: PerformanceAnalysis;
    rally_analysis: PerformanceAnalysis;
    mental_game: PerformanceAnalysis;
    next_match_strategy: string;
}

// AI Analysis Types (Markdown-based)
export interface AnalysisResponse {
    success: boolean;
    markdown_report?: string;
    statistics?: any;
    match_info?: any;
    error?: string;
    message?: string;
}