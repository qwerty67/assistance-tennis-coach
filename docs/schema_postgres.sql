BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> fa2aa96fda5b

CREATE TABLE users (
    first_name VARCHAR(80) NOT NULL, 
    last_name VARCHAR(80) NOT NULL, 
    email VARCHAR(255) NOT NULL, 
    phone VARCHAR(20) NOT NULL, 
    password_hash VARCHAR(255) NOT NULL, 
    role VARCHAR(32) NOT NULL, 
    is_active BOOLEAN NOT NULL, 
    locale VARCHAR(8) NOT NULL, 
    last_login_at TIMESTAMP WITHOUT TIME ZONE, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_users PRIMARY KEY (id)
);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE UNIQUE INDEX ix_users_phone ON users (phone);

CREATE INDEX ix_users_role ON users (role);

CREATE INDEX ix_users_updated_at ON users (updated_at);

CREATE TABLE academies (
    name VARCHAR(160) NOT NULL, 
    owner_user_id UUID NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_academies PRIMARY KEY (id), 
    CONSTRAINT fk_academies_owner_user_id_users FOREIGN KEY(owner_user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX ix_academies_updated_at ON academies (updated_at);

CREATE TABLE device_tokens (
    user_id UUID NOT NULL, 
    token VARCHAR(255) NOT NULL, 
    platform VARCHAR(16) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_device_tokens PRIMARY KEY (id), 
    CONSTRAINT fk_device_tokens_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_device_tokens_token UNIQUE (token)
);

CREATE INDEX ix_device_tokens_updated_at ON device_tokens (updated_at);

CREATE INDEX ix_device_tokens_user_id ON device_tokens (user_id);

CREATE TABLE notifications (
    user_id UUID NOT NULL, 
    type VARCHAR(32) NOT NULL, 
    title VARCHAR(160) NOT NULL, 
    body TEXT, 
    data JSON NOT NULL, 
    is_read BOOLEAN NOT NULL, 
    read_at TIMESTAMP WITHOUT TIME ZONE, 
    push_sent BOOLEAN NOT NULL, 
    dedupe_key VARCHAR(128), 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_notifications PRIMARY KEY (id), 
    CONSTRAINT fk_notifications_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_notifications_dedupe_key UNIQUE (dedupe_key)
);

CREATE INDEX ix_notifications_updated_at ON notifications (updated_at);

CREATE INDEX ix_notifications_user_id ON notifications (user_id);

CREATE INDEX ix_notifications_user_read ON notifications (user_id, is_read);

CREATE TABLE refresh_tokens (
    user_id UUID NOT NULL, 
    jti VARCHAR(64) NOT NULL, 
    expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    revoked_at TIMESTAMP WITHOUT TIME ZONE, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id), 
    CONSTRAINT fk_refresh_tokens_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX ix_refresh_tokens_jti ON refresh_tokens (jti);

CREATE INDEX ix_refresh_tokens_updated_at ON refresh_tokens (updated_at);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE TABLE coaches (
    user_id UUID NOT NULL, 
    academy_id UUID, 
    bio TEXT, 
    timezone VARCHAR(64) NOT NULL, 
    currency VARCHAR(8) NOT NULL, 
    settings JSON NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_coaches PRIMARY KEY (id), 
    CONSTRAINT fk_coaches_academy_id_academies FOREIGN KEY(academy_id) REFERENCES academies (id) ON DELETE SET NULL, 
    CONSTRAINT fk_coaches_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
    CONSTRAINT uq_coaches_user_id UNIQUE (user_id)
);

CREATE INDEX ix_coaches_academy_id ON coaches (academy_id);

CREATE INDEX ix_coaches_updated_at ON coaches (updated_at);

CREATE TABLE classes (
    coach_id UUID NOT NULL, 
    name VARCHAR(120) NOT NULL, 
    class_type VARCHAR(32) NOT NULL, 
    capacity_min INTEGER NOT NULL, 
    capacity_max INTEGER NOT NULL, 
    duration_minutes INTEGER NOT NULL, 
    session_price BIGINT NOT NULL, 
    court_cost BIGINT NOT NULL, 
    coach_income BIGINT NOT NULL, 
    monthly_fee BIGINT NOT NULL, 
    billing_mode VARCHAR(32) NOT NULL, 
    color VARCHAR(9), 
    location VARCHAR(160), 
    description TEXT, 
    is_active BOOLEAN NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_classes PRIMARY KEY (id), 
    CONSTRAINT ck_classes_capacity_order CHECK (capacity_max >= capacity_min), 
    CONSTRAINT ck_classes_capacity_min_pos CHECK (capacity_min >= 1), 
    CONSTRAINT ck_classes_duration_pos CHECK (duration_minutes > 0), 
    CONSTRAINT ck_classes_monthly_fee_pos CHECK (monthly_fee >= 0), 
    CONSTRAINT ck_classes_price_pos CHECK (session_price >= 0 AND court_cost >= 0 AND coach_income >= 0), 
    CONSTRAINT fk_classes_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE
);

CREATE INDEX ix_classes_class_type ON classes (class_type);

CREATE INDEX ix_classes_coach_id ON classes (coach_id);

CREATE INDEX ix_classes_updated_at ON classes (updated_at);

CREATE TABLE students (
    coach_id UUID NOT NULL, 
    user_id UUID, 
    first_name VARCHAR(80) NOT NULL, 
    last_name VARCHAR(80) NOT NULL, 
    age INTEGER, 
    birth_date DATE, 
    phone VARCHAR(20), 
    email VARCHAR(255), 
    level VARCHAR(32) NOT NULL, 
    start_date DATE, 
    strengths TEXT, 
    weaknesses TEXT, 
    goals TEXT, 
    coach_notes TEXT, 
    status VARCHAR(32) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_students PRIMARY KEY (id), 
    CONSTRAINT ck_students_age_range CHECK (age IS NULL OR (age >= 3 AND age <= 100)), 
    CONSTRAINT fk_students_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_students_user_id_users FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX ix_students_coach_id ON students (coach_id);

CREATE INDEX ix_students_coach_status ON students (coach_id, status);

CREATE INDEX ix_students_email ON students (email);

CREATE INDEX ix_students_phone ON students (phone);

CREATE INDEX ix_students_updated_at ON students (updated_at);

CREATE INDEX ix_students_user_id ON students (user_id);

CREATE TABLE class_members (
    class_id UUID NOT NULL, 
    student_id UUID NOT NULL, 
    joined_at DATE, 
    left_at DATE, 
    is_active BOOLEAN NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_class_members PRIMARY KEY (id), 
    CONSTRAINT fk_class_members_class_id_classes FOREIGN KEY(class_id) REFERENCES classes (id) ON DELETE CASCADE, 
    CONSTRAINT fk_class_members_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT class_student UNIQUE (class_id, student_id)
);

CREATE INDEX ix_class_members_class_id ON class_members (class_id);

CREATE INDEX ix_class_members_student_id ON class_members (student_id);

CREATE INDEX ix_class_members_updated_at ON class_members (updated_at);

CREATE TABLE financial_accounts (
    student_id UUID NOT NULL, 
    coach_id UUID NOT NULL, 
    total_charged BIGINT NOT NULL, 
    total_paid BIGINT NOT NULL, 
    balance BIGINT NOT NULL, 
    overdue_amount BIGINT NOT NULL, 
    status VARCHAR(16) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_financial_accounts PRIMARY KEY (id), 
    CONSTRAINT fk_financial_accounts_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_financial_accounts_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT uq_financial_accounts_student_id UNIQUE (student_id)
);

CREATE INDEX ix_financial_accounts_balance ON financial_accounts (balance);

CREATE INDEX ix_financial_accounts_coach_id ON financial_accounts (coach_id);

CREATE INDEX ix_financial_accounts_status ON financial_accounts (status);

CREATE INDEX ix_financial_accounts_updated_at ON financial_accounts (updated_at);

CREATE TABLE terms (
    coach_id UUID NOT NULL, 
    class_id UUID NOT NULL, 
    title VARCHAR(120) NOT NULL, 
    term_type VARCHAR(32) NOT NULL, 
    total_sessions INTEGER, 
    start_date DATE NOT NULL, 
    end_date DATE, 
    session_price BIGINT NOT NULL, 
    court_cost BIGINT NOT NULL, 
    coach_income BIGINT NOT NULL, 
    monthly_fee BIGINT NOT NULL, 
    total_price BIGINT NOT NULL, 
    billing_mode VARCHAR(32) NOT NULL, 
    payer_student_id UUID, 
    payment_plan VARCHAR(32) NOT NULL, 
    installments_count INTEGER NOT NULL, 
    status VARCHAR(32) NOT NULL, 
    notes TEXT, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_terms PRIMARY KEY (id), 
    CONSTRAINT ck_terms_date_order CHECK (end_date IS NULL OR end_date >= start_date), 
    CONSTRAINT ck_terms_installments_pos CHECK (installments_count >= 1), 
    CONSTRAINT ck_terms_sessions_pos CHECK (total_sessions IS NULL OR total_sessions > 0), 
    CONSTRAINT fk_terms_class_id_classes FOREIGN KEY(class_id) REFERENCES classes (id) ON DELETE CASCADE, 
    CONSTRAINT fk_terms_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_terms_payer_student_id_students FOREIGN KEY(payer_student_id) REFERENCES students (id) ON DELETE SET NULL
);

CREATE INDEX ix_terms_class_id ON terms (class_id);

CREATE INDEX ix_terms_coach_id ON terms (coach_id);

CREATE INDEX ix_terms_status ON terms (status);

CREATE INDEX ix_terms_updated_at ON terms (updated_at);

CREATE TABLE training_plans (
    coach_id UUID NOT NULL, 
    student_id UUID NOT NULL, 
    title VARCHAR(160) NOT NULL, 
    description TEXT, 
    start_date DATE, 
    end_date DATE, 
    status VARCHAR(32) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_training_plans PRIMARY KEY (id), 
    CONSTRAINT fk_training_plans_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_training_plans_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE
);

CREATE INDEX ix_training_plans_coach_id ON training_plans (coach_id);

CREATE INDEX ix_training_plans_student_id ON training_plans (student_id);

CREATE INDEX ix_training_plans_updated_at ON training_plans (updated_at);

CREATE TABLE payments (
    coach_id UUID NOT NULL, 
    student_id UUID NOT NULL, 
    term_id UUID, 
    class_id UUID, 
    amount BIGINT NOT NULL, 
    paid_at DATE NOT NULL, 
    method VARCHAR(32) NOT NULL, 
    reference_no VARCHAR(64), 
    description TEXT, 
    recorded_by_user_id UUID, 
    is_void BOOLEAN NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_payments PRIMARY KEY (id), 
    CONSTRAINT ck_payments_amount_pos CHECK (amount > 0), 
    CONSTRAINT fk_payments_class_id_classes FOREIGN KEY(class_id) REFERENCES classes (id) ON DELETE SET NULL, 
    CONSTRAINT fk_payments_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_payments_recorded_by_user_id_users FOREIGN KEY(recorded_by_user_id) REFERENCES users (id) ON DELETE SET NULL, 
    CONSTRAINT fk_payments_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT fk_payments_term_id_terms FOREIGN KEY(term_id) REFERENCES terms (id) ON DELETE SET NULL
);

CREATE INDEX ix_payments_coach_date ON payments (coach_id, paid_at);

CREATE INDEX ix_payments_coach_id ON payments (coach_id);

CREATE INDEX ix_payments_is_void ON payments (is_void);

CREATE INDEX ix_payments_student_id ON payments (student_id);

CREATE INDEX ix_payments_updated_at ON payments (updated_at);

CREATE TABLE schedules (
    class_id UUID NOT NULL, 
    term_id UUID, 
    schedule_type VARCHAR(32) NOT NULL, 
    start_date DATE NOT NULL, 
    end_date DATE, 
    timezone VARCHAR(64) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_schedules PRIMARY KEY (id), 
    CONSTRAINT fk_schedules_class_id_classes FOREIGN KEY(class_id) REFERENCES classes (id) ON DELETE CASCADE, 
    CONSTRAINT fk_schedules_term_id_terms FOREIGN KEY(term_id) REFERENCES terms (id) ON DELETE CASCADE
);

CREATE INDEX ix_schedules_class_id ON schedules (class_id);

CREATE INDEX ix_schedules_term_id ON schedules (term_id);

CREATE INDEX ix_schedules_updated_at ON schedules (updated_at);

CREATE TABLE term_members (
    term_id UUID NOT NULL, 
    student_id UUID NOT NULL, 
    share_per_session BIGINT NOT NULL, 
    share_overridden BOOLEAN NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_term_members PRIMARY KEY (id), 
    CONSTRAINT fk_term_members_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT fk_term_members_term_id_terms FOREIGN KEY(term_id) REFERENCES terms (id) ON DELETE CASCADE, 
    CONSTRAINT term_student UNIQUE (term_id, student_id)
);

CREATE INDEX ix_term_members_student_id ON term_members (student_id);

CREATE INDEX ix_term_members_term_id ON term_members (term_id);

CREATE INDEX ix_term_members_updated_at ON term_members (updated_at);

CREATE TABLE training_exercises (
    plan_id UUID NOT NULL, 
    category VARCHAR(32) NOT NULL, 
    skill VARCHAR(64), 
    title VARCHAR(160) NOT NULL, 
    description TEXT, 
    sets INTEGER, 
    repetitions INTEGER, 
    duration_minutes INTEGER, 
    intensity VARCHAR(32) NOT NULL, 
    start_date DATE, 
    end_date DATE, 
    status VARCHAR(32) NOT NULL, 
    completed_at TIMESTAMP WITHOUT TIME ZONE, 
    order_index INTEGER NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_training_exercises PRIMARY KEY (id), 
    CONSTRAINT fk_training_exercises_plan_id_training_plans FOREIGN KEY(plan_id) REFERENCES training_plans (id) ON DELETE CASCADE
);

CREATE INDEX ix_training_exercises_category ON training_exercises (category);

CREATE INDEX ix_training_exercises_plan_id ON training_exercises (plan_id);

CREATE INDEX ix_training_exercises_updated_at ON training_exercises (updated_at);

CREATE TABLE schedule_slots (
    schedule_id UUID NOT NULL, 
    weekday INTEGER, 
    on_date DATE, 
    start_time TIME WITHOUT TIME ZONE NOT NULL, 
    end_time TIME WITHOUT TIME ZONE NOT NULL, 
    id UUID NOT NULL, 
    CONSTRAINT pk_schedule_slots PRIMARY KEY (id), 
    CONSTRAINT ck_schedule_slots_time_order CHECK (end_time > start_time), 
    CONSTRAINT ck_schedule_slots_weekday_range CHECK (weekday IS NULL OR (weekday >= 0 AND weekday <= 6)), 
    CONSTRAINT fk_schedule_slots_schedule_id_schedules FOREIGN KEY(schedule_id) REFERENCES schedules (id) ON DELETE CASCADE
);

CREATE INDEX ix_schedule_slots_schedule_id ON schedule_slots (schedule_id);

CREATE TABLE sessions (
    coach_id UUID NOT NULL, 
    class_id UUID NOT NULL, 
    term_id UUID, 
    schedule_id UUID, 
    sequence_number INTEGER, 
    start_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    end_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    status VARCHAR(32) NOT NULL, 
    is_makeup BOOLEAN NOT NULL, 
    makeup_for_id UUID, 
    session_price BIGINT NOT NULL, 
    court_cost BIGINT NOT NULL, 
    coach_income BIGINT NOT NULL, 
    location VARCHAR(160), 
    notes TEXT, 
    cancel_reason VARCHAR(255), 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_sessions PRIMARY KEY (id), 
    CONSTRAINT ck_sessions_time_order CHECK (end_at > start_at), 
    CONSTRAINT fk_sessions_class_id_classes FOREIGN KEY(class_id) REFERENCES classes (id) ON DELETE CASCADE, 
    CONSTRAINT fk_sessions_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_sessions_makeup_for_id_sessions FOREIGN KEY(makeup_for_id) REFERENCES sessions (id) ON DELETE SET NULL, 
    CONSTRAINT fk_sessions_schedule_id_schedules FOREIGN KEY(schedule_id) REFERENCES schedules (id) ON DELETE SET NULL, 
    CONSTRAINT fk_sessions_term_id_terms FOREIGN KEY(term_id) REFERENCES terms (id) ON DELETE SET NULL
);

CREATE INDEX ix_sessions_class_id ON sessions (class_id);

CREATE INDEX ix_sessions_coach_id ON sessions (coach_id);

CREATE INDEX ix_sessions_coach_start ON sessions (coach_id, start_at);

CREATE INDEX ix_sessions_start_at ON sessions (start_at);

CREATE INDEX ix_sessions_status ON sessions (status);

CREATE INDEX ix_sessions_term_id ON sessions (term_id);

CREATE INDEX ix_sessions_updated_at ON sessions (updated_at);

CREATE TABLE attendance (
    session_id UUID NOT NULL, 
    student_id UUID NOT NULL, 
    status VARCHAR(32) NOT NULL, 
    absence_reason VARCHAR(32), 
    note TEXT, 
    is_chargeable BOOLEAN NOT NULL, 
    charge_overridden BOOLEAN NOT NULL, 
    recorded_by_user_id UUID, 
    recorded_at TIMESTAMP WITHOUT TIME ZONE, 
    client_mutation_id VARCHAR(64), 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_attendance PRIMARY KEY (id), 
    CONSTRAINT fk_attendance_recorded_by_user_id_users FOREIGN KEY(recorded_by_user_id) REFERENCES users (id) ON DELETE SET NULL, 
    CONSTRAINT fk_attendance_session_id_sessions FOREIGN KEY(session_id) REFERENCES sessions (id) ON DELETE CASCADE, 
    CONSTRAINT fk_attendance_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT uq_attendance_client_mutation_id UNIQUE (client_mutation_id), 
    CONSTRAINT session_student UNIQUE (session_id, student_id)
);

CREATE INDEX ix_attendance_session_id ON attendance (session_id);

CREATE INDEX ix_attendance_student_id ON attendance (student_id);

CREATE INDEX ix_attendance_updated_at ON attendance (updated_at);

CREATE TABLE charges (
    coach_id UUID NOT NULL, 
    student_id UUID NOT NULL, 
    term_id UUID, 
    class_id UUID, 
    session_id UUID, 
    kind VARCHAR(32) NOT NULL, 
    amount BIGINT NOT NULL, 
    court_cost_amount BIGINT NOT NULL, 
    coach_income_amount BIGINT NOT NULL, 
    period VARCHAR(7), 
    installment_no INTEGER, 
    due_date DATE, 
    description VARCHAR(255), 
    is_void BOOLEAN NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    version INTEGER NOT NULL, 
    deleted_at TIMESTAMP WITHOUT TIME ZONE, 
    CONSTRAINT pk_charges PRIMARY KEY (id), 
    CONSTRAINT ck_charges_amount_pos CHECK (amount >= 0), 
    CONSTRAINT fk_charges_class_id_classes FOREIGN KEY(class_id) REFERENCES classes (id) ON DELETE SET NULL, 
    CONSTRAINT fk_charges_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_charges_session_id_sessions FOREIGN KEY(session_id) REFERENCES sessions (id) ON DELETE SET NULL, 
    CONSTRAINT fk_charges_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT fk_charges_term_id_terms FOREIGN KEY(term_id) REFERENCES terms (id) ON DELETE SET NULL, 
    CONSTRAINT student_session UNIQUE (student_id, session_id), 
    CONSTRAINT term_period UNIQUE (term_id, student_id, period, kind)
);

CREATE INDEX ix_charges_class_id ON charges (class_id);

CREATE INDEX ix_charges_coach_due ON charges (coach_id, due_date);

CREATE INDEX ix_charges_coach_id ON charges (coach_id);

CREATE INDEX ix_charges_is_void ON charges (is_void);

CREATE INDEX ix_charges_student_id ON charges (student_id);

CREATE INDEX ix_charges_term_id ON charges (term_id);

CREATE INDEX ix_charges_updated_at ON charges (updated_at);

CREATE TABLE makeup_sessions (
    coach_id UUID NOT NULL, 
    original_session_id UUID NOT NULL, 
    makeup_session_id UUID, 
    student_id UUID, 
    term_id UUID, 
    reason VARCHAR(255), 
    status VARCHAR(32) NOT NULL, 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_makeup_sessions PRIMARY KEY (id), 
    CONSTRAINT fk_makeup_sessions_coach_id_coaches FOREIGN KEY(coach_id) REFERENCES coaches (id) ON DELETE CASCADE, 
    CONSTRAINT fk_makeup_sessions_makeup_session_id_sessions FOREIGN KEY(makeup_session_id) REFERENCES sessions (id) ON DELETE SET NULL, 
    CONSTRAINT fk_makeup_sessions_original_session_id_sessions FOREIGN KEY(original_session_id) REFERENCES sessions (id) ON DELETE CASCADE, 
    CONSTRAINT fk_makeup_sessions_student_id_students FOREIGN KEY(student_id) REFERENCES students (id) ON DELETE CASCADE, 
    CONSTRAINT fk_makeup_sessions_term_id_terms FOREIGN KEY(term_id) REFERENCES terms (id) ON DELETE CASCADE
);

CREATE INDEX ix_makeup_sessions_coach_id ON makeup_sessions (coach_id);

CREATE INDEX ix_makeup_sessions_original_session_id ON makeup_sessions (original_session_id);

CREATE INDEX ix_makeup_sessions_status ON makeup_sessions (status);

CREATE INDEX ix_makeup_sessions_updated_at ON makeup_sessions (updated_at);

CREATE TABLE session_change_logs (
    session_id UUID NOT NULL, 
    changed_by_user_id UUID, 
    change_type VARCHAR(32) NOT NULL, 
    old_start_at TIMESTAMP WITHOUT TIME ZONE, 
    old_end_at TIMESTAMP WITHOUT TIME ZONE, 
    new_start_at TIMESTAMP WITHOUT TIME ZONE, 
    new_end_at TIMESTAMP WITHOUT TIME ZONE, 
    reason VARCHAR(255), 
    id UUID NOT NULL, 
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
    CONSTRAINT pk_session_change_logs PRIMARY KEY (id), 
    CONSTRAINT fk_session_change_logs_changed_by_user_id_users FOREIGN KEY(changed_by_user_id) REFERENCES users (id) ON DELETE SET NULL, 
    CONSTRAINT fk_session_change_logs_session_id_sessions FOREIGN KEY(session_id) REFERENCES sessions (id) ON DELETE CASCADE
);

CREATE INDEX ix_session_change_logs_session_id ON session_change_logs (session_id);

CREATE INDEX ix_session_change_logs_updated_at ON session_change_logs (updated_at);

INSERT INTO alembic_version (version_num) VALUES ('fa2aa96fda5b') RETURNING alembic_version.version_num;

COMMIT;

