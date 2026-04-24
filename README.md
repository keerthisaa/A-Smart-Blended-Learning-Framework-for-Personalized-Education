# 🏫 A Smart Blended Learning Framework for Personalized Education

> A complete, production-quality AI-enabled School Management System designed to enhance personalized learning in CBSE schools.
> Built using Flask, Next.js 14, and Machine Learning.

---

## 🎯 Overview

**A Smart Blended Learning Framework for Personalized Education** is an AI-powered School Management System designed to combine traditional classroom learning with intelligent digital support.

The system enables personalized education by analyzing student behavior, performance, and engagement using machine learning techniques.

### 📊 System Scope

* **12 Grades** (1–12) with **2 Sections each** (A & B)
* **300+ Students** with realistic academic data
* **30 Teachers** across CBSE subjects
* **3 Admins** with full control
* **300+ Parents** linked to students
* **7 Subjects**: English, Mathematics, Science, Social Science, Tamil, Computer Science, General Knowledge

---

## ✨ Features

### 👨‍💼 Admin Dashboard

* Complete user management (CRUD)
* Class & section configuration
* Subject allocation
* School-wide analytics & insights
* ML-based student learning analysis
* Announcement broadcasting

---

### 👩‍🏫 Teacher Dashboard

* Section-wise student management
* Attendance tracking (Present / Absent / Late)
* Grade entry for multiple assessments
* Assignment creation & tracking
* Performance analytics dashboards
* ML-based student grouping (Grades 6–12)
* AI Teaching Assistant

---

### 🎓 Student Dashboard

* Academic performance visualization
* Subject-wise grade tracking
* Attendance monitoring (CBSE compliance)
* Assignment tracking
* Personalized study recommendations
* AI Homework Assistant

---

### 👨‍👩‍👦 Parent Dashboard

* Child performance overview
* Attendance tracking
* Teacher remarks access
* School announcements

---

## 🛠 Tech Stack

| Layer            | Technology                           |
| ---------------- | ------------------------------------ |
| Frontend         | Next.js 14, TypeScript, Tailwind CSS |
| Visualization    | Recharts                             |
| Icons            | Lucide React                         |
| Backend          | Python Flask, SQLAlchemy             |
| Authentication   | JWT (flask-jwt-extended)             |
| Database         | SQLite                               |
| Machine Learning | Scikit-learn (Random Forest)         |
| AI Integration   | OpenAI-ready (optional)              |

---

## 🚀 Quick Start

### 🔧 Prerequisites

* Python 3.9+
* Node.js 18+
* npm or yarn

---

### ⚙️ Backend Setup

```bash
cd school-management-system/backend

python -m venv venv

# Activate environment
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

python app.py
```

Backend runs at:
👉 http://localhost:5000

---

### 💻 Frontend Setup

```bash
cd school-management-system/frontend

npm install
npm run dev
```

Frontend runs at:
👉 http://localhost:3000

---

## 🔑 Login Credentials

| Role    | Username           | Password   |
| ------- | ------------------ | ---------- |
| Admin   | vijayalakshmi.iyer | admin123   |
| Admin   | raghavan.sub       | admin123   |
| Teacher | lakshmi_narayanan  | teacher123 |
| Teacher | geetha_krishnan    | teacher123 |
| Student | student0001        | student123 |
| Student | student0002        | student123 |
| Parent  | parent0001         | parent123  |
| Parent  | parent0002         | parent123  |

---

## 📁 Project Structure

```
school-management-system/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── seed_data.py
│   ├── requirements.txt
│   ├── ml/
│   │   └── model.py
│   └── routes/
│       ├── auth.py
│       ├── admin.py
│       ├── teacher_student_parent.py
│       └── ai_assistant.py
│
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── app/
│       │   ├── login/
│       │   └── dashboard/
│       ├── components/
│       └── lib/
│
└── README.md
```

---

## 🔌 API Reference

### Authentication

```
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/refresh
```

---

### Admin APIs

```
GET  /api/admin/dashboard
GET  /api/admin/users
POST /api/admin/users
PUT  /api/admin/users/:id
DELETE /api/admin/users/:id
GET  /api/admin/ml-insights
```

---

### Teacher APIs

```
GET  /api/teacher/dashboard
POST /api/teacher/attendance
POST /api/teacher/grades
GET  /api/teacher/ml-grouping/:section_id
```

---

### Student APIs

```
GET /api/student/dashboard
GET /api/student/grades
GET /api/student/attendance
```

---

### Parent APIs

```
GET /api/parent/dashboard
GET /api/parent/child/grades
```

---

## 🤖 ML System

The system uses a **Random Forest Classifier** to predict student learning behavior.

### 📊 Features Used

* Login frequency
* Study time
* Resource usage
* Attendance percentage
* Academic performance

---

### 🎯 Output Labels

* **Fast Learner**
* **Average Learner**
* **Needs Support**

> ⚠️ Students never see negative labels. Only teachers/admins access insights.

---

### 📈 Model Details

* Algorithm: Random Forest (100 trees)
* Accuracy: ~92%
* Dataset: Synthetic (1500 samples)

---

## 🎨 Design System

| Color  | Hex     |
| ------ | ------- |
| Blue   | #3B82F6 |
| Purple | #8B5CF6 |
| Green  | #10B981 |
| Amber  | #F59E0B |
| Red    | #EF4444 |

---

## 🔧 Configuration

### OpenAI Integration

```python
import os
api_key = os.getenv("OPENAI_API_KEY")
```

---

### Production Deployment

```bash
npm run build
npm start

pip install gunicorn
gunicorn -w 4 app:create_app()
```

---


## ❤️ Acknowledgement

Developed as part of an academic project focusing on AI-driven personalized education systems.

---
