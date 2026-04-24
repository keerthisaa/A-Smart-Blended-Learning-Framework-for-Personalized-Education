# 🏫 Vidya Jyothi — AI-Enabled Smart School Management System

> A complete, production-quality School Management System built for CBSE schools in Tamil Nadu.
> Powered by Flask, Next.js 14, and Machine Learning.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Login Credentials](#login-credentials)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [ML System](#ml-system)

---

## 🎯 Overview

Vidya Jyothi is a comprehensive, AI-enabled School Management System designed for CBSE schools. It manages a school with:

- **12 Grades** (1–12) with **2 Sections each** (A & B) = 24 total sections
- **300+ students** with realistic Tamil Nadu names
- **30 teachers** across all subjects
- **3 admins** with full system access
- **300+ parents** (one per student)
- **7 CBSE subjects**: English, Mathematics, Science, Social Science, Tamil, Computer Science, General Knowledge

---

## ✨ Features

### 👨‍💼 Admin Dashboard
- User management (create, edit, delete users)
- Class & section management
- Subject management
- School-wide analytics with charts
- ML Insights for student learning pace
- Announcement management

### 👩‍🏫 Teacher Dashboard
- Student list per section
- Daily attendance marking (Present / Absent / Late)
- Grade entry for multiple exam types
- Assignment creation with deadlines
- Class performance analytics
- ML-powered student grouping (Grades 6–12)
- AI Teaching Assistant

### 🎓 Student Dashboard
- Academic performance overview with charts
- Subject-wise grade tracking
- Attendance history with CBSE compliance check
- Assignment tracker with deadlines
- Personalized study recommendations (ML-based, no labels shown)
- AI Homework Helper

### 👨‍👩‍👦 Parent Dashboard (Read-Only)
- Child's attendance records
- Grade overview
- Teacher remarks
- School announcements

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python Flask, SQLAlchemy |
| Authentication | JWT (flask-jwt-extended) |
| Database | SQLite |
| ML Model | Scikit-learn Random Forest |
| AI Assistant | Contextual fallback (OpenAI-ready) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ 
- Node.js 18+
- npm or yarn

### Step 1: Backend Setup

```bash
cd school-management-system/backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend (auto-seeds database on first run)
python app.py
```

Backend starts at: **http://localhost:5000**

> **First run**: The system automatically seeds the database with 300+ students, 30 teachers, and all sample data. This takes ~30 seconds.

### Step 2: Frontend Setup

Open a new terminal:

```bash
cd school-management-system/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend starts at: **http://localhost:3000**

---

## 🔑 Login Credentials

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| **Admin** | `vijayalakshmi.iyer` | `admin123` | Full system access |
| **Admin** | `raghavan.sub` | `admin123` | |
| **Teacher** | `lakshmi_narayanan` | `teacher123` | First teacher |
| **Teacher** | `geetha_krishnan` | `teacher123` | |
| **Student** | `student0001` | `student123` | First student |
| **Student** | `student0002` | `student123` | |
| **Parent** | `parent0001` | `parent123` | Parent of student0001 |
| **Parent** | `parent0002` | `parent123` | |

---

## 📁 Project Structure

```
school-management-system/
├── backend/
│   ├── app.py                    # Flask entry point
│   ├── models.py                 # SQLAlchemy database models
│   ├── seed_data.py              # Database seeder (auto-runs first time)
│   ├── requirements.txt          # Python dependencies
│   ├── ml/
│   │   └── model.py              # Random Forest ML model
│   └── routes/
│       ├── auth.py               # Authentication routes
│       ├── admin.py              # Admin API routes
│       ├── teacher_student_parent.py  # Role-specific routes
│       └── ai_assistant.py       # AI chat route
│
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── app/
│       │   ├── login/            # Login page
│       │   └── dashboard/
│       │       ├── admin/        # Admin pages
│       │       ├── teacher/      # Teacher pages
│       │       ├── student/      # Student pages
│       │       └── parent/       # Parent pages
│       ├── components/
│       │   ├── ui/               # Shared UI components
│       │   └── dashboard/        # Dashboard components
│       └── lib/
│           └── api.ts            # API client & auth helpers
│
└── README.md
```

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/login      — Login with username/password
GET  /api/auth/me         — Get current user profile
POST /api/auth/refresh    — Refresh JWT token
```

### Admin APIs
```
GET  /api/admin/dashboard           — Dashboard stats
GET  /api/admin/users               — List users (with filtering)
POST /api/admin/users               — Create user
PUT  /api/admin/users/:id           — Update user
DEL  /api/admin/users/:id           — Delete user
GET  /api/admin/grades              — List grades + sections
GET  /api/admin/ml-insights         — ML prediction dashboard
GET  /api/admin/analytics/performance — Performance analytics
POST /api/admin/announcements       — Create announcement
```

### Teacher APIs
```
GET  /api/teacher/dashboard                    — Teacher dashboard
GET  /api/teacher/sections/:id/students        — Section students
GET  /api/teacher/attendance?section_id=&date= — Get attendance
POST /api/teacher/attendance                   — Mark attendance
POST /api/teacher/grades                       — Add grade
GET  /api/teacher/grades/:section_id           — Section grades
GET  /api/teacher/ml-grouping/:section_id      — ML groups
```

### Student APIs
```
GET /api/student/dashboard    — Student dashboard
GET /api/student/grades       — All grades
GET /api/student/attendance   — Attendance history
GET /api/student/assignments  — Assignments
```

### Parent APIs
```
GET /api/parent/dashboard        — Parent dashboard
GET /api/parent/child/attendance — Child's attendance
GET /api/parent/child/grades     — Child's grades
```

### AI Assistant
```
POST /api/ai/chat  — Role-aware AI chat
```

---

## 🤖 ML System

The machine learning module uses **Random Forest Classifier** (scikit-learn) to predict student learning pace.

### Features Used
| Feature | Description |
|---------|-------------|
| `login_count` | Portal login frequency |
| `study_time_hours` | Average daily study time |
| `resource_access_count` | Learning resources accessed |
| `attendance_percentage` | Overall attendance rate |
| `average_marks` | Academic performance average |

### Output Labels
| Label | Description | Shown To |
|-------|-------------|----------|
| `fast` | Fast learner | Teachers & Admins only |
| `average` | Average learner | Teachers & Admins only |
| `slow` | Needs extra support | Teachers & Admins only |

> **Privacy Note**: Students are NEVER shown labels like "slow learner". They only receive positive, personalized study recommendations.

### Model Details
- Algorithm: Random Forest (100 trees, max depth 10)
- Training set: 1500 synthetic samples
- Test accuracy: ~92%
- Model saved as: `backend/ml_model.joblib`

---

## 🎨 Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#3B82F6` | CTAs, active states |
| Accent Purple | `#8B5CF6` | Teacher dashboard |
| Success Green | `#10B981` | Present, positive metrics |
| Warning Amber | `#F59E0B` | Deadlines, parent dashboard |
| Danger Red | `#EF4444` | Absent, alerts |
| Background | `#F9FAFB` | Page backgrounds |

---

## 🔧 Configuration

### Adding OpenAI Support
Edit `backend/routes/ai_assistant.py`:
```python
import os
api_key = os.getenv('OPENAI_API_KEY')
```

Then set environment variable:
```bash
export OPENAI_API_KEY=your_key_here
```

### Production Build
```bash
# Frontend
cd frontend && npm run build && npm start

# Backend (use gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

---

## 🏫 School Information

**Vidya Jyothi CBSE School**  
Chennai, Tamil Nadu, India  
Academic Year: 2024–25  
Affiliation: CBSE (simulated)

---

*Built with ❤️ for CBSE schools in Tamil Nadu*
