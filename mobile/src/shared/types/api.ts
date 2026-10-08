/** API contract types (mirror backend Pydantic schemas). */
export type UUID = string;
export type Role = 'coach' | 'student';
export type ClassType = 'private' | 'semi_private' | 'group' | 'academy';
export type BillingMode = 'per_student' | 'split' | 'lump';
export type TermType = 'fixed_sessions' | 'monthly' | 'custom';
export type PaymentPlan = 'upfront' | 'per_session' | 'installments' | 'manual';
export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'unexcused' | 'cancelled' | 'makeup';
export type AbsenceReason = 'illness' | 'travel' | 'personal' | 'exam' | 'miscommunication' | 'other';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';
export type FinancialStatus = 'settled' | 'partial' | 'debt' | 'overdue' | 'credit';
export type ChargeStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';
export type TrainingCategory = 'technical' | 'tactical' | 'mental' | 'fitness';
export type Intensity = 'low' | 'medium' | 'high' | 'max';
export type ExerciseStatus = 'todo' | 'in_progress' | 'done';
export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface User {
  id: UUID; first_name: string; last_name: string; email: string; phone: string; role: Role; locale: string;
}
export interface TokenPair { access_token: string; refresh_token: string; expires_in: number; user: User }

export interface Account { total_charged: number; total_paid: number; balance: number; overdue_amount: number; status: FinancialStatus }

export interface Student {
  id: UUID; first_name: string; last_name: string; age?: number | null; birth_date?: string | null;
  phone?: string | null; email?: string | null; level: PlayerLevel; start_date?: string | null;
  strengths?: string | null; weaknesses?: string | null; goals?: string | null; coach_notes?: string | null;
  status: 'active' | 'inactive'; has_account: boolean; account?: Account | null; created_at: string;
}
export interface TermUsage {
  term_id: UUID; term_title: string; class_id: UUID; class_name: string; class_type: ClassType;
  total_sessions: number | null; used_sessions: number; remaining_sessions: number | null; upcoming_sessions: number; status: string;
}
export interface StudentDetail extends Student {
  terms: TermUsage[];
  classes: { id: UUID; name: string; class_type: ClassType; color?: string }[];
  recent_attendance: { id: UUID; session_id: UUID; status: AttendanceStatus; absence_reason?: AbsenceReason | null; note?: string; is_chargeable: boolean; start_at: string; class_name: string }[];
  recent_payments: Payment[];
  training_plans: { id: UUID; title: string; status: PlanStatus; start_date?: string; end_date?: string }[];
  attendance_stats: Partial<Record<AttendanceStatus, number>>;
}

export interface ClassMember { student_id: UUID; full_name: string; level: PlayerLevel; is_active: boolean }
export interface TennisClass {
  id: UUID; name: string; class_type: ClassType; capacity_min: number; capacity_max: number; duration_minutes: number;
  session_price: number; court_cost: number; coach_income: number; monthly_fee: number; billing_mode: BillingMode;
  color?: string | null; location?: string | null; description?: string | null; is_active: boolean;
  member_count: number; members: ClassMember[]; created_at: string;
}

export interface TermMember {
  student_id: UUID; full_name: string; share_per_session: number; share_overridden: boolean; used_sessions: number;
  remaining_sessions: number | null; total_due: number; paid: number; financial_status: FinancialStatus;
}
export interface Term {
  id: UUID; class_id: UUID; class_name: string; class_type: ClassType; title: string; term_type: TermType;
  total_sessions: number | null; start_date: string; end_date: string | null; session_price: number; court_cost: number;
  coach_income: number; monthly_fee: number; total_price: number; billing_mode: BillingMode; payer_student_id: UUID | null;
  payment_plan: PaymentPlan; installments_count: number; status: string; notes?: string | null; members: TermMember[];
  sessions_scheduled: number; sessions_completed: number; sessions_cancelled: number; makeup_needed: number; makeup_suggestion?: string | null;
}
export interface SlotInput { weekday?: number | null; on_date?: string | null; start_time: string; end_time: string }

export interface Session {
  id: UUID; class_id: UUID; term_id: UUID | null; class_name: string; class_type: ClassType; color?: string | null;
  sequence_number: number | null; start_at: string; end_at: string; duration_minutes: number; status: SessionStatus;
  is_makeup: boolean; makeup_for_id: UUID | null; session_price: number; court_cost: number; coach_income: number;
  location?: string | null; notes?: string | null; cancel_reason?: string | null; version: number;
  student_count: number; attendance_done: boolean; student_names: string[];
}
export interface SessionStudent {
  student_id: UUID; full_name: string; attendance_status: AttendanceStatus | null; absence_reason: AbsenceReason | null;
  is_chargeable: boolean | null; share: number; financial_status: FinancialStatus; balance: number; remaining_sessions: number | null;
}
export interface SessionDetail extends Session {
  students: SessionStudent[]; term_title?: string | null; total_sessions?: number | null;
  history: { change_type: string; old_start_at?: string; new_start_at?: string; reason?: string; created_at: string }[];
}
export interface Makeup {
  id: UUID; original_session_id: UUID; makeup_session_id: UUID | null; student_id: UUID | null; term_id: UUID | null;
  reason?: string | null; status: string; created_at: string; original_start_at?: string; class_name?: string; student_name?: string | null; suggestion?: string;
}

export interface Payment {
  id: UUID; student_id: UUID; student_name?: string; amount: number; paid_at: string; method: PaymentMethod;
  description?: string | null; term_id?: UUID | null; class_id?: UUID | null; reference_no?: string | null; created_at: string;
}
export interface Charge {
  id: UUID; student_id: UUID; student_name?: string; term_id?: UUID | null; class_id?: UUID | null; session_id?: UUID | null;
  kind: string; amount: number; court_cost_amount: number; coach_income_amount: number; period?: string | null;
  installment_no?: number | null; due_date?: string | null; description?: string | null; paid: number; remaining: number; status: ChargeStatus;
}
export interface AccountDetail {
  student_id: UUID; student_name: string; total_tuition: number; paid_amount: number; remaining_amount: number; debt: number;
  credit: number; overdue_amount: number; status: FinancialStatus; number_of_sessions: number | null; used_sessions: number;
  remaining_sessions: number | null; charges: Charge[]; payments: Payment[];
}
export interface SeriesPoint { key: string; label_year: number; label_month: number; received: number; charged: number; coach_income: number; court_cost: number }
export interface Debtor { student_id: UUID; name: string; debt: number; overdue: number; status: FinancialStatus }
export interface FinancialSummary {
  period_start: string; period_end: string; received: number; charged: number; coach_income: number; court_cost: number;
  outstanding: number; total_credit: number; debtors_count: number; month_income: number; year_income: number;
  monthly: SeriesPoint[]; by_class_type: { class_type: string; charged: number; received: number }[];
  by_class: { class_id: UUID; name: string; class_type: ClassType; charged: number; received: number }[];
  by_student: { student_id: UUID; name: string; received: number }[]; by_method: { method: PaymentMethod; amount: number }[];
  debtors: Debtor[];
}

export interface Exercise {
  id: UUID; category: TrainingCategory; skill?: string | null; title: string; description?: string | null; sets?: number | null;
  repetitions?: number | null; duration_minutes?: number | null; intensity: Intensity; start_date?: string | null; end_date?: string | null;
  status: ExerciseStatus; order_index: number; completed_at?: string | null;
}
export interface TrainingPlan {
  id: UUID; student_id: UUID; student_name?: string; title: string; description?: string | null; start_date?: string | null;
  end_date?: string | null; status: PlanStatus; exercises: Exercise[]; progress: number; created_at: string;
}

export interface AppNotification { id: UUID; type: string; title: string; body?: string | null; data: Record<string, unknown>; is_read: boolean; created_at: string }

export interface Reminder { type: 'attendance_missing' | 'makeup_pending' | 'overdue_payments' | 'terms_ending'; count: number; amount?: number; session_ids?: UUID[] }
export interface CoachDashboard {
  today: string; jalali_today: [number, number, number]; students: { total: number; active: number; inactive: number };
  classes_count: number; today_classes: number; today_sessions: Session[]; next_session: Session | null; upcoming_sessions: Session[];
  cancelled_sessions: Session[]; cancelled_count: number;
  low_remaining: { student_id: UUID; name: string; term_id: UUID; term_title: string; remaining: number; total: number }[];
  debtors: Debtor[]; debtors_count: number; outstanding: number; recent_payments: Payment[]; month_income: number;
  monthly: SeriesPoint[]; reminders: Reminder[]; pending_makeups: number;
}
export interface StudentDashboard {
  profiles: { id: UUID; full_name: string; level: PlayerLevel; coach_id: UUID }[];
  my_classes: { id: UUID; name: string; class_type: ClassType; color?: string; duration_minutes: number }[];
  next_session: Session | null; upcoming_sessions: Session[]; terms: TermUsage[]; remaining_sessions: number;
  financial: { balance: number; debt: number; credit: number; status: FinancialStatus; total_charged: number; total_paid: number };
  recent_payments: Payment[]; training_plans: TrainingPlan[]; session_history: Session[]; unread_notifications: number;
}
export interface CoachSettings { charge_rules: Record<AttendanceStatus, boolean>; reminder_hours: number; timezone: string; currency: string; bio?: string | null }
