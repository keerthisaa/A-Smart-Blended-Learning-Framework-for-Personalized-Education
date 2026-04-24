"""
Database Seeder — realistic South Indian (Tamil Nadu CBSE) data
Uses raw sqlite3, no ORM
"""

import sqlite3
import random
import json
from datetime import datetime, date, timedelta
from database import get_db, DB_PATH, create_schema
from auth_utils import hash_password
import os

TAMIL_FIRST_MALE = [
    "Arun","Karthik","Vijay","Suresh","Ramesh","Ganesh","Dinesh","Mahesh","Rajesh","Mukesh",
    "Sathish","Harish","Manish","Vignesh","Lokesh","Prakash","Deepak","Naveen","Praveen",
    "Selvam","Murugan","Balamurugan","Senthil","Venkatesh","Aravind","Bharath","Dhinesh",
    "Elango","Gautam","Hari","Ilango","Jayakumar","Kannan","Madhan","Nandha","Pandian",
    "Rajan","Saravanan","Udhaya","Vasanth","Anand","Bala","Charan","Durai","Elan",
    "Girish","Hemant","Jagadeesh","Krishnaraj","Lingam","Muthu","Naresh",
]

TAMIL_FIRST_FEMALE = [
    "Divya","Ananya","Priya","Kavitha","Meena","Geetha","Rekha","Nisha","Swetha","Lakshmi",
    "Saranya","Lavanya","Aishwarya","Brindha","Chitra","Deepa","Ezhilarasi","Fathima","Gowri",
    "Hema","Indira","Janani","Kalpana","Lalitha","Malar","Nandhini","Oviya","Padmini",
    "Radhika","Sangeetha","Thenmozhi","Uma","Vani","Yamini","Abinaya","Bhavani","Dhivya",
    "Gomathi","Hamsaveni","Jayalakshmi","Kamala","Leelavathi","Malarvizhi","Nithyashree",
    "Pooja","Revathi","Selvi","Tamilarasi","Usha","Vijayalakshmi","Waheedha",
]

SURNAMES = [
    "Kumar","Raj","Krishnan","Murugan","Rajan","Subramani","Narayanan","Swaminathan",
    "Ramasamy","Pandian","Selvaraj","Annamalai","Palanisamy","Venkatesan","Arumugam",
    "Natarajan","Sundarajan","Shanmugam","Pillai","Iyer","Iyengar","Nair","Babu","Rao",
    "Gopal","Balaji","Sekaran","Durai","Mani","Samy","Kannan","Ravi","Murthy","Reddy",
]

QUALIFICATIONS = ["B.Ed","M.Ed","M.Sc B.Ed","M.A B.Ed","B.Sc B.Ed","M.Phil","Ph.D","MBA B.Ed"]
BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"]
OCCUPATIONS = ["Engineer","Doctor","Teacher","Businessman","Farmer","Government Employee",
               "Bank Employee","Police Officer","Nurse","Accountant","Lawyer","IT Professional","Homemaker"]

SPECIFIC_TEACHERS = [
    ("Lakshmi Narayanan","F"),("Geetha Krishnan","F"),("Ramesh Kumar","M"),("Suresh Babu","M"),
    ("Meenakshi Sundaram","F"),("Balakrishnan Pillai","M"),("Saranya Venkatesan","F"),
    ("Murugan Arumugam","M"),("Kavitha Rajan","F"),("Annamalai Selvam","M"),
    ("Padmavathi Iyer","F"),("Venkataraman Swami","M"),("Rajeswari Natarajan","F"),
    ("Shanmugam Pandian","M"),("Vijaya Krishnamurthy","F"),("Durai Raj","M"),
    ("Nirmala Subramaniam","F"),("Kannan Mani","M"),("Thenmozhi Arasan","F"),
    ("Saravanan Ravi","M"),("Indira Gopalakrishnan","F"),("Balamurugan Samy","M"),
    ("Rekha Annamalai","F"),("Sathyanarayanan K","M"),("Kamala Devi Pillai","F"),
    ("Elango Murugesan","M"),("Amutha Raj","F"),("Krishnamoorthy Iyer","M"),
    ("Vasantha Kumari","F"),("Pandian Selvaraj","M"),
]

RECOMMENDATIONS = {
    'slow': "Focus on building strong foundational skills. Break study sessions into smaller, manageable chunks of 30-45 minutes. Review previous chapters before moving forward. Use visual aids and diagrams to understand complex topics. Don't hesitate to ask your teachers for extra help — that's exactly what they're there for!",
    'average': "You're on the right track! To push further, try practicing additional problems beyond what's assigned. Set specific weekly study goals and track your progress. Explore supplementary resources like videos and reference books to deepen your understanding. With consistent effort, excellence is within reach!",
    'fast': "Outstanding progress! You're excelling in your studies. Challenge yourself with advanced-level problems and olympiad-style questions. Consider exploring topics beyond the textbook to fuel your curiosity. You also have an opportunity to help classmates, which will reinforce your own understanding!",
}

REMARK_TEMPLATES = [
    ("Excellent performance in recent tests. Keep up the great work!", "academic"),
    ("Needs to improve participation in class discussions.", "academic"),
    ("Very attentive and helpful to classmates. Great team player.", "behavior"),
    ("Homework submission has been inconsistent. Please ensure timely submission.", "academic"),
    ("Showing significant improvement compared to last term. Well done!", "academic"),
    ("Creative thinker with excellent problem-solving skills.", "academic"),
    ("Attendance has been irregular. Please ensure regular attendance.", "general"),
]


def rname(gender=None):
    g = gender or random.choice(["M","F"])
    first = random.choice(TAMIL_FIRST_MALE if g == "M" else TAMIL_FIRST_FEMALE)
    return f"{first} {random.choice(SURNAMES)}", g


def seed_all():
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    create_schema()

    conn = get_db()
    c = conn.cursor()
    print("🌱 Seeding database...")

    # Admins
    admin_data = [
        ("vijayalakshmi.iyer","Vijayalakshmi Iyer","principal@vidyajyothi.edu.in"),
        ("raghavan.sub","Raghavan Subramanian","vp@vidyajyothi.edu.in"),
        ("senthil.kumar","Senthil Kumar","admin@vidyajyothi.edu.in"),
    ]
    admin_ids = []
    for uname, fname, email in admin_data:
        c.execute("INSERT INTO users (username,email,password_hash,role,full_name,phone) VALUES (?,?,?,?,?,?)",
                  (uname, email, hash_password("admin123"), "admin", fname, f"9{random.randint(100000000,999999999)}"))
        admin_ids.append(c.lastrowid)

    # Grades + Sections
    grade_ids, section_ids = [], []
    for g_num in range(1, 13):
        c.execute("INSERT INTO grades (grade_number, name) VALUES (?,?)", (g_num, f"Grade {g_num}"))
        gid = c.lastrowid
        grade_ids.append(gid)
        for s_name in ["A","B"]:
            c.execute("INSERT INTO sections (grade_id, section_name, capacity) VALUES (?,?,?)", (gid, s_name, 15))
            section_ids.append(c.lastrowid)

    # Subjects
    subject_data = [
        ("English","ENG","English Language and Literature"),
        ("Mathematics","MAT","Mathematics and Numeracy"),
        ("Science","SCI","General Science and Environmental Studies"),
        ("Social Science","SOC","History, Geography, Civics, Economics"),
        ("Tamil","TAM","Tamil Language - Second Language"),
        ("Computer Science","CS","Computer Science and Digital Literacy"),
        ("General Knowledge","GK","General Knowledge and Current Affairs"),
    ]
    subject_ids = []
    for name, code, desc in subject_data:
        c.execute("INSERT INTO subjects (name,code,description) VALUES (?,?,?)", (name, code, desc))
        sid = c.lastrowid
        subject_ids.append(sid)
        for gid in grade_ids:
            c.execute("INSERT INTO subject_assignments (grade_id,subject_id) VALUES (?,?)", (gid, sid))

    # Teachers
    teacher_ids = []
    emp = 1001
    for t_name, t_g in SPECIFIC_TEACHERS:
        uname = t_name.lower().replace(" ",".")[:18]
        email = f"teacher{emp}@vidyajyothi.edu.in"
        c.execute("INSERT INTO users (username,email,password_hash,role,full_name,phone) VALUES (?,?,?,?,?,?)",
                  (uname, email, hash_password("teacher123"), "teacher", t_name, f"9{random.randint(100000000,999999999)}"))
        uid = c.lastrowid
        c.execute("INSERT INTO teachers (user_id,employee_id,qualification,specialization,experience_years,join_date) VALUES (?,?,?,?,?,?)",
                  (uid, f"EMP{emp}", random.choice(QUALIFICATIONS), random.choice(["Mathematics","Science","English","Social Science","Tamil","Computer Science"]),
                   random.randint(2,20), f"{random.randint(2005,2023)}-06-01"))
        teacher_ids.append(c.lastrowid)
        emp += 1

    for i, sec_id in enumerate(section_ids):
        ct = teacher_ids[i % len(teacher_ids)]
        c.execute("UPDATE sections SET class_teacher_id=? WHERE id=?", (ct, sec_id))
        for subj_id in subject_ids:
            t = random.choice(teacher_ids)
            c.execute("INSERT INTO teacher_assignments (teacher_id,section_id,subject_id,academic_year) VALUES (?,?,?,?)",
                      (t, sec_id, subj_id, "2024-25"))

    # Parents + Students + Enrollments
    all_students = []  # (student_id, section_id, grade_num)
    stu_n, par_n = 1, 1
    today = date.today()

    for sec_id in section_ids:
        c.execute("SELECT g.grade_number FROM sections s JOIN grades g ON s.grade_id=g.id WHERE s.id=?", (sec_id,))
        grade_num = c.fetchone()[0]
        n_students = random.randint(12, 15)

        for roll in range(1, n_students + 1):
            # Parent
            p_name, p_g = rname()
            c.execute("INSERT INTO users (username,email,password_hash,role,full_name,phone) VALUES (?,?,?,?,?,?)",
                      (f"parent{par_n:04d}", f"parent{par_n:04d}@gmail.com", hash_password("parent123"),
                       "parent", p_name, f"9{random.randint(100000000,999999999)}"))
            p_uid = c.lastrowid
            c.execute("INSERT INTO parents (user_id,occupation,relation) VALUES (?,?,?)",
                      (p_uid, random.choice(OCCUPATIONS), "Father" if p_g=="M" else "Mother"))
            parent_id = c.lastrowid

            # Student
            s_name, s_g = rname()
            age = 5 + grade_num + random.randint(-1, 1)
            dob = f"{datetime.now().year - age}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
            c.execute("INSERT INTO users (username,email,password_hash,role,full_name,phone) VALUES (?,?,?,?,?,?)",
                      (f"student{stu_n:04d}", f"student{stu_n:04d}@vidyajyothi.edu.in",
                       hash_password("student123"), "student", s_name, f"9{random.randint(100000000,999999999)}"))
            s_uid = c.lastrowid
            c.execute("INSERT INTO students (user_id,admission_number,date_of_birth,gender,blood_group,address,parent_id) VALUES (?,?,?,?,?,?,?)",
                      (s_uid, f"VJ{2024-grade_num}{stu_n:04d}", dob, "Male" if s_g=="M" else "Female",
                       random.choice(BLOOD_GROUPS), f"{random.randint(1,100)}, Chennai - 6000{random.randint(10,99)}", parent_id))
            s_id = c.lastrowid
            all_students.append((s_id, sec_id, grade_num))
            c.execute("INSERT INTO enrollments (student_id,section_id,academic_year,enrollment_date,is_current,roll_number) VALUES (?,?,?,?,?,?)",
                      (s_id, sec_id, "2024-25", "2024-06-01", 1, roll))
            stu_n += 1
            par_n += 1

    # Attendance
    att_rows = []
    for s_id, sec_id, _ in all_students:
        rate = random.uniform(0.72, 0.99)
        for days_back in range(60, 0, -1):
            d = today - timedelta(days=days_back)
            if d.weekday() >= 5: continue
            r = random.random()
            status = "present" if r < rate else ("late" if r < rate + 0.04 else "absent")
            att_rows.append((s_id, sec_id, d.isoformat(), status, random.choice(admin_ids)))
    c.executemany("INSERT INTO attendance (student_id,section_id,date,status,marked_by) VALUES (?,?,?,?,?)", att_rows)
    print(f"   ✅ {len(att_rows)} attendance records")

    # Grade records
    gr_rows = []
    for s_id, sec_id, _ in all_students:
        base = random.uniform(45, 95)
        for subj_id in subject_ids:
            for exam in ["Unit Test 1","Unit Test 2","Mid Term"]:
                max_m = 100 if "Mid" in exam else 50
                obtained = min(max_m, max(0, (base + random.uniform(-10,10)) / 100 * max_m * random.uniform(0.85, 1.0)))
                c.execute("SELECT teacher_id FROM teacher_assignments WHERE section_id=? AND subject_id=? LIMIT 1", (sec_id, subj_id))
                ta = c.fetchone()
                t_id = ta[0] if ta else teacher_ids[0]
                exam_d = (today - timedelta(days=random.randint(10, 55))).isoformat()
                gr_rows.append((s_id, subj_id, sec_id, t_id, exam, round(obtained, 1), max_m, exam_d))
    c.executemany("INSERT INTO grade_records (student_id,subject_id,section_id,teacher_id,exam_type,marks_obtained,max_marks,exam_date) VALUES (?,?,?,?,?,?,?,?)", gr_rows)
    print(f"   ✅ {len(gr_rows)} grade records")

    # Engagement metrics
    for s_id, _, _ in all_students:
        c.execute("INSERT INTO engagement_metrics (student_id,login_count,study_time_hours,resource_access_count,assignment_completion_rate,recorded_week) VALUES (?,?,?,?,?,?)",
                  (s_id, random.randint(5,45), round(random.uniform(0.5,6.0),2), random.randint(2,60), round(random.uniform(0.3,1.0),2), "2024-W48"))

    # ML Predictions (Grades 6-12 only)
    pred_count = 0
    for s_id, sec_id, grade_num in all_students:
        if grade_num < 6: continue
        c.execute("SELECT AVG(CAST(marks_obtained AS REAL)/CAST(max_marks AS REAL)*100) FROM grade_records WHERE student_id=?", (s_id,))
        avg = (c.fetchone()[0] or 60.0)
        label = "slow" if avg < 55 else ("fast" if avg >= 75 else "average")
        importance = json.dumps({"attendance_percentage": round(random.uniform(0.1,0.35),3), "average_marks": round(random.uniform(0.2,0.40),3), "study_time_hours": round(random.uniform(0.1,0.25),3), "login_count": round(random.uniform(0.05,0.15),3), "resource_access_count": round(random.uniform(0.05,0.15),3)})
        c.execute("INSERT INTO ml_predictions (student_id,prediction_label,confidence_score,feature_importance,recommendation,predicted_at) VALUES (?,?,?,?,?,?)",
                  (s_id, label, round(random.uniform(0.65,0.97),3), importance, RECOMMENDATIONS[label], datetime.now().isoformat()))
        pred_count += 1
    print(f"   ✅ {pred_count} ML predictions")

    # Assignments
    titles = ["Chapter Summary","Problem Set","Research Project","Lab Report","Creative Writing","Map Activity","Programming Exercise","Current Events Analysis"]
    for sec_id in section_ids[:16]:
        for subj_id in subject_ids:
            c.execute("SELECT teacher_id FROM teacher_assignments WHERE section_id=? AND subject_id=? LIMIT 1", (sec_id, subj_id))
            ta = c.fetchone()
            if not ta: continue
            c.execute("SELECT name FROM subjects WHERE id=?", (subj_id,))
            sn = c.fetchone()[0]
            due = (today + timedelta(days=random.randint(3, 14))).isoformat() + "T23:59:00"
            c.execute("INSERT INTO assignments (title,description,subject_id,section_id,teacher_id,due_date,max_marks) VALUES (?,?,?,?,?,?,?)",
                      (f"{sn}: {random.choice(titles)}", f"Complete the assigned work based on Chapter {random.randint(1,8)}.",
                       subj_id, sec_id, ta[0], due, random.choice([10,15,20,25])))

    # Announcements
    for title, content, target in [
        ("Annual Sports Day 2024","Vidya Jyothi School announces Annual Sports Day on 20th December 2024. All students are encouraged to participate in Athletics, Team Sports, and Cultural activities.","all"),
        ("Parent-Teacher Meeting","Parent-Teacher Meeting is scheduled for 15th December 2024 from 10:00 AM to 1:00 PM. Parents are requested to attend and collect progress reports.","parent"),
        ("Holiday - Pongal Festival","School will remain closed from 14th–17th January 2025 for Pongal. Classes resume 18th January 2025.","all"),
        ("Staff Development Program","Professional Development Workshop for all teachers on 22nd December 2024. Attendance is mandatory.","teacher"),
        ("Mid-Term Exam Schedule","Mid-Term examinations begin 8th December 2024. Detailed timetables are available at the school office.","student"),
        ("Fee Reminder - Term 2","Term 2 fees are due by 31st December 2024. Please pay via the school portal or at the accounts office.","parent"),
        ("Science Exhibition 2024","Annual Science Exhibition on 10th January 2025. Students from Grades 6–12 can submit project proposals by 20th December.","all"),
    ]:
        c.execute("INSERT INTO announcements (title,content,created_by,target_roles,is_active,created_at) VALUES (?,?,?,?,?,?)",
                  (title, content, admin_ids[0], target, 1, (datetime.now()-timedelta(days=random.randint(0,14))).isoformat()))

    # Teacher Remarks
    for s_id, sec_id, _ in random.sample(all_students, min(60, len(all_students))):
        c.execute("SELECT teacher_id FROM teacher_assignments WHERE section_id=? LIMIT 1", (sec_id,))
        ta = c.fetchone()
        if not ta: continue
        remark_text, category = random.choice(REMARK_TEMPLATES)
        c.execute("INSERT INTO teacher_remarks (student_id,teacher_id,remark,category,created_at) VALUES (?,?,?,?,?)",
                  (s_id, ta[0], remark_text, category, (datetime.now()-timedelta(days=random.randint(1,30))).isoformat()))

    conn.commit()
    conn.close()
    print(f"\n   🎉 Seeding complete! {len(all_students)} students · {len(teacher_ids)} teachers · 3 admins")
    print(f"\n   📋 Login Credentials:")
    print(f"      Admin:   vijayalakshmi.iyer / admin123")
    print(f"      Teacher: lakshmi.narayanan  / teacher123")
    print(f"      Student: student0001        / student123")
    print(f"      Parent:  parent0001         / parent123")

if __name__ == "__main__":
    seed_all()
