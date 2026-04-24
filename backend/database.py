"""
Database layer using raw sqlite3 — no ORM required.
Manages connection, schema creation, and helper utilities.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'school.db')


def get_db():
    """Return a thread-safe sqlite3 connection with row_factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def dict_from_row(row):
    """Convert a sqlite3.Row to a plain dict."""
    return dict(row) if row else None


def rows_to_list(rows):
    """Convert a list of sqlite3.Row to list of dicts."""
    return [dict(r) for r in rows] if rows else []


def create_schema():
    """Create all database tables if they don't exist."""
    conn = get_db()
    c = conn.cursor()

    c.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        last_login TEXT,
        profile_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade_number INTEGER NOT NULL,
        name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade_id INTEGER NOT NULL,
        section_name TEXT NOT NULL,
        capacity INTEGER DEFAULT 15,
        class_teacher_id INTEGER,
        FOREIGN KEY (grade_id) REFERENCES grades(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT
    );

    CREATE TABLE IF NOT EXISTS subject_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        grade_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        FOREIGN KEY (grade_id) REFERENCES grades(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS teachers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        employee_id TEXT UNIQUE NOT NULL,
        qualification TEXT,
        specialization TEXT,
        experience_years INTEGER DEFAULT 0,
        join_date TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS teacher_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        academic_year TEXT DEFAULT '2024-25',
        FOREIGN KEY (teacher_id) REFERENCES teachers(id),
        FOREIGN KEY (section_id) REFERENCES sections(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS parents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        occupation TEXT,
        relation TEXT DEFAULT 'Father',
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        admission_number TEXT UNIQUE NOT NULL,
        date_of_birth TEXT,
        gender TEXT,
        blood_group TEXT,
        address TEXT,
        parent_id INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (parent_id) REFERENCES parents(id)
    );

    CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        academic_year TEXT DEFAULT '2024-25',
        enrollment_date TEXT DEFAULT (date('now')),
        is_current INTEGER DEFAULT 1,
        roll_number INTEGER,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (section_id) REFERENCES sections(id)
    );

    CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL,
        marked_by INTEGER,
        remarks TEXT,
        FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS grade_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        subject_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        exam_type TEXT,
        marks_obtained REAL NOT NULL,
        max_marks REAL NOT NULL,
        exam_date TEXT,
        remarks TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (subject_id) REFERENCES subjects(id)
    );

    CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        subject_id INTEGER NOT NULL,
        section_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        due_date TEXT,
        max_marks REAL DEFAULT 10,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (subject_id) REFERENCES subjects(id),
        FOREIGN KEY (section_id) REFERENCES sections(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );

    CREATE TABLE IF NOT EXISTS engagement_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL UNIQUE,
        login_count INTEGER DEFAULT 0,
        study_time_hours REAL DEFAULT 0,
        resource_access_count INTEGER DEFAULT 0,
        assignment_completion_rate REAL DEFAULT 0,
        recorded_week TEXT,
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS ml_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        prediction_label TEXT,
        confidence_score REAL,
        feature_importance TEXT,
        recommendation TEXT,
        predicted_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        target_roles TEXT DEFAULT 'all',
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        expires_at TEXT,
        FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS teacher_remarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        remark TEXT NOT NULL,
        category TEXT DEFAULT 'general',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    );
    """)

    conn.commit()
    conn.close()
    print("✅ Database schema created")
