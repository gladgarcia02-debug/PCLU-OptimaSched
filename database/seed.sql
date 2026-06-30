-- ============================================================
--  PCLU OptimaSched — Seed data (sample reference records)
--  NOTE: the default admin user is created by database/init.js
--        because the password must be bcrypt-hashed in Node.
-- ============================================================

INSERT INTO departments (code, name) VALUES
    ('CCS',  'College of Computer Studies'),
    ('CBA',  'College of Business Administration'),
    ('CTE',  'College of Teacher Education'),
    ('CAS',  'College of Arts and Sciences')
ON CONFLICT (code) DO NOTHING;

INSERT INTO instructors (full_name, email, department_id, max_hours_per_week) VALUES
    ('Dr. Elena Marasigan', 'e.marasigan@pclu.edu.ph', 1, 21),
    ('Prof. Ramon Castillo', 'r.castillo@pclu.edu.ph',  1, 24),
    ('Ms. Aileen Bautista',  'a.bautista@pclu.edu.ph',  3, 18),
    ('Mr. Jericho Lim',      'j.lim@pclu.edu.ph',       2, 24)
ON CONFLICT (email) DO NOTHING;

INSERT INTO rooms (name, building, capacity, room_type) VALUES
    ('LH-201', 'Main Building',       45, 'lecture'),
    ('LH-202', 'Main Building',       45, 'lecture'),
    ('LAB-1',  'Technology Building',  35, 'laboratory'),
    ('LAB-2',  'Technology Building',  35, 'laboratory'),
    ('AUD-A',  'Performing Arts Hall', 180, 'auditorium')
ON CONFLICT (name) DO NOTHING;

INSERT INTO courses (code, title, units, department_id, hours_per_week, expected_students) VALUES
    ('CS101', 'Introduction to Computing',      3, 1, 3, 40),
    ('CS214', 'Data Structures and Algorithms', 3, 1, 5, 35),
    ('IT330', 'Web Systems and Technologies',   3, 1, 5, 30),
    ('GE105', 'Purposive Communication',        3, 4, 3, 45),
    ('ED201', 'Facilitating Learner-Centered Teaching', 3, 3, 3, 40)
ON CONFLICT (code) DO NOTHING;

INSERT INTO sections (course_id, instructor_id, section_name, semester, school_year) VALUES
    (1, 1, 'BSCS-1A', '1st', '2025-2026'),
    (2, 2, 'BSCS-2A', '1st', '2025-2026'),
    (3, 2, 'BSIT-3A', '1st', '2025-2026'),
    (4, 4, 'BSBA-1A', '1st', '2025-2026')
ON CONFLICT (course_id, section_name, semester, school_year) DO NOTHING;
