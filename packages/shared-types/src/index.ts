export type UUID = string;

// Core Platform Types
export type UserRole = 'COACH' | 'PLAYER' | 'ADMIN';

export interface CentralUser {
  id: UUID;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  is_active: boolean;
  locale: string;
}

export interface CentralPlayer {
  id: UUID;
  user_id?: UUID | null;
  first_name: string;
  last_name: string;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  play_hand: 'RIGHT' | 'LEFT' | 'AMBIDEXTROUS';
}

export interface CoachProfile {
  id: UUID;
  user_id: UUID;
  academy_name?: string | null;
  bio?: string | null;
  timezone: string;
  currency: string;
}

export interface CoachPlayerRelationship {
  id: UUID;
  coach_id: UUID;
  player_id: UUID;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  is_primary: boolean;
  role_type: string;
}

export interface CoachInvitation {
  id: UUID;
  coach_id: UUID;
  player_id?: UUID | null;
  phone?: string | null;
  code: string;
  token: string;
  status: 'CREATED' | 'SENT' | 'ACCEPTED' | 'EXPIRED';
  expires_at: string;
}

// AI Coach Types
export interface Match {
  id: UUID;
  player_id: UUID;
  coach_id?: UUID | null;
  opponent_name: string;
  match_date: string;
  location?: string | null;
  match_type: 'singles' | 'doubles';
  status: 'ongoing' | 'completed' | 'cancelled';
  student_games_won: number;
  opponent_games_won: number;
  sets_score?: string | null;
  final_result?: 'win' | 'loss' | 'draw' | null;
  notes?: string | null;
}

export interface Point {
  id: UUID;
  match_id: UUID;
  point_number: number;
  set_number?: number | null;
  game_number?: number | null;
  game_score?: string | null;
  server?: string | null;
  serve_type?: string | null;
  serve_result?: string | null;
  return_result?: string | null;
  final_stroke_player?: string | null;
  final_stroke_type?: string | null;
  final_stroke_direction?: string | null;
  final_stroke_result?: string | null;
  point_winner: string;
}

export interface MatchAnalysis {
  id: UUID;
  match_id: UUID;
  markdown_report: string;
  statistics?: Record<string, any> | null;
  match_info?: Record<string, any> | null;
  model_used?: string | null;
}
