-- ============================================================
--  PCLU OptimaSched — Database Schema
--  PostgreSQL 13+
-- ============================================================

-- Clean slate (safe to re-run during development).
DROP TABLE IF EXISTS schedules     CASCADE;
DROP TABLE IF EXISTS sections      CASCADE;
DROP TABLE IF EXISTS courses       CASCADE;
DROP TABLE IF EXISTS rooms         CASCADE;
DROP TABLE IF EXISTS instructors   CASCADE;
DROP TABLE IF EXISTS departments   CASCADE;
DROP TABLE IF EXISTS users         CASCADE;
DROP TABLE IF EXISTS session       CASCADE;

-- ── Users / authentication ─────────────────────────────────
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(120)  NOT NULL,
    email         VARCHAR(160)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL DEFAULT 'scheduler'
                  CHECK (role IN ('admin', 'scheduler', 'viewer')),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Reference data ─────────────────────────────────────────
CREATE TABLE departments (
    id    SERIAL PRIMARY KEY,
    code  VARCHAR(12)  NOT NULL UNIQUE,
    name  VARCHAR(120) NOT NULL
);

CREATE TABLE instructors (
    id                 SERIAL PRIMARY KEY,
    full_name          VARCHAR(120) NOT NULL,
    email              VARCHAR(160) UNIQUE,
    department_id      INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    max_hours_per_week INTEGER NOT NULL DEFAULT 24 CHECK (max_hours_per_week > 0),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rooms (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(60)  NOT NULL UNIQUE,
    building  VARCHAR(80),
    capacity  INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0),
    room_type VARCHAR(30) NOT NULL DEFAULT 'lecture'
              CHECK (room_type IN ('lecture', 'laboratory', 'auditorium', 'online')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE courses (
    id                SERIAL PRIMARY KEY,
    code              VARCHAR(20)  NOT NULL UNIQUE,
    title             VARCHAR(160) NOT NULL,
    units             NUMERIC(3,1) NOT NULL DEFAULT 3 CHECK (units > 0),
    department_id     INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    hours_per_week    INTEGER NOT NULL DEFAULT 3 CHECK (hours_per_week > 0),
    expected_students INTEGER NOT NULL DEFAULT 40 CHECK (expected_students > 0),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A concrete offering of a course for a given term.
CREATE TABLE sections (
    id            SERIAL PRIMARY KEY,
    course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    instructor_id INTEGER REFERENCES instructors(id) ON DELETE SET NULL,
    section_name  VARCHAR(20) NOT NULL,
    semester      VARCHAR(20) NOT NULL DEFAULT '1st',
    school_year   VARCHAR(12) NOT NULL DEFAULT '2025-2026',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (course_id, section_name, semester, school_year)
);

-- ── Timetable slots ────────────────────────────────────────
-- One row = one meeting block (e.g. Mon 08:00–09:30 in Room 204).
CREATE TABLE schedules (
    id           SERIAL PRIMARY KEY,
    section_id   INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    room_id      INTEGER NOT NULL REFERENCES rooms(id)    ON DELETE RESTRICT,
    day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Mon
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_time > start_time)
);

-- Indexes that back the clash-detection queries.
CREATE INDEX idx_schedules_room ON schedules (room_id, day_of_week);
CREATE INDEX idx_schedules_section ON schedules (section_id, day_of_week);

-- ── Session store (connect-pg-simple) ──────────────────────
CREATE TABLE session (
    sid    VARCHAR NOT NULL COLLATE "default",
    sess   JSON    NOT NULL,
    expire TIMESTAMP(6) NOT NULL
) WITH (OIDS = FALSE);
ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX idx_session_expire ON session (expire);
