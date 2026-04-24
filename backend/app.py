"""
Vidya Jyothi AI-Enabled Smart School Management System
Flask Backend — uses sqlite3 + PyJWT (no SQLAlchemy required)
Run: python app.py
"""

import os, sys, sqlite3, json, random
from datetime import datetime, date, timedelta
from functools import wraps

import jwt as pyjwt
from flask import Flask, request, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash

SECRET_KEY = "vidya-jyothi-2024-secret"
DB_PATH = os.path.join(os.path.dirname(__file__), "school.db")

app = Flask(__name__)
app.config["SECRET_KEY"] = SECRET_KEY


# ── CORS ──────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
    return response

@app.route("/api/<path:p>", methods=["OPTIONS"])
def options_handler(p):
    return jsonify({}), 200


# ── DB helpers ────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db:
        db.close()

def qry(sql, params=(), one=False):
    db = get_db()
    cur = db.execute(sql, params)
    rows = cur.fetchall()
    if one:
        return dict(rows[0]) if rows else None
    return [dict(r) for r in rows]

def exe(sql, params=()):
    db = get_db()
    cur = db.execute(sql, params)
    db.commit()
    return cur.lastrowid


# ── JWT helpers ───────────────────────────────────────────────────────────────
def make_token(user_id, role, full_name, expires_hours=24):
    payload = {
        "sub": str(user_id), "role": role, "full_name": full_name,
        "exp": datetime.utcnow() + timedelta(hours=expires_hours),
    }
    return pyjwt.encode(payload, SECRET_KEY, algorithm="HS256")

def require_jwt(roles=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify({"error": "Unauthorized"}), 401
            try:
                payload = pyjwt.decode(auth.split(" ", 1)[1], SECRET_KEY, algorithms=["HS256"])
            except pyjwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired"}), 401
            except Exception:
                return jsonify({"error": "Invalid token"}), 401
            if roles and payload.get("role") not in roles:
                return jsonify({"error": "Access denied"}), 403
            g.user_id = int(payload["sub"])
            g.role = payload["role"]
            g.full_name = payload.get("full_name", "")
            return fn(*args, **kwargs)
        return wrapper
    return decorator


# ════════════════════════════════════════════════════════════════════
# SCHEMA
# ════════════════════════════════════════════════════════════════════
SCHEMA = [
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL, full_name TEXT NOT NULL, phone TEXT, is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')), last_login TEXT)",
    "CREATE TABLE IF NOT EXISTS grades (id INTEGER PRIMARY KEY AUTOINCREMENT, grade_number INTEGER NOT NULL, name TEXT NOT NULL)",
    "CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY AUTOINCREMENT, grade_id INTEGER, section_name TEXT NOT NULL, capacity INTEGER DEFAULT 15, class_teacher_id INTEGER)",
    "CREATE TABLE IF NOT EXISTS subjects (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, code TEXT UNIQUE NOT NULL, description TEXT)",
    "CREATE TABLE IF NOT EXISTS teachers (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, employee_id TEXT UNIQUE NOT NULL, qualification TEXT, specialization TEXT, experience_years INTEGER DEFAULT 0)",
    "CREATE TABLE IF NOT EXISTS teacher_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id INTEGER, section_id INTEGER, subject_id INTEGER, academic_year TEXT DEFAULT '2024-25')",
    "CREATE TABLE IF NOT EXISTS parents (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, occupation TEXT, relation TEXT DEFAULT 'Parent')",
    "CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER UNIQUE, admission_number TEXT UNIQUE NOT NULL, date_of_birth TEXT, gender TEXT, blood_group TEXT, address TEXT, parent_id INTEGER)",
    "CREATE TABLE IF NOT EXISTS enrollments (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, section_id INTEGER, academic_year TEXT DEFAULT '2024-25', enrollment_date TEXT, is_current INTEGER DEFAULT 1, roll_number INTEGER)",
    "CREATE TABLE IF NOT EXISTS attendance (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, section_id INTEGER, date TEXT NOT NULL, status TEXT NOT NULL, marked_by INTEGER, remarks TEXT)",
    "CREATE TABLE IF NOT EXISTS grade_records (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, subject_id INTEGER, section_id INTEGER, teacher_id INTEGER, exam_type TEXT, marks_obtained REAL NOT NULL, max_marks REAL NOT NULL, exam_date TEXT, remarks TEXT, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT, subject_id INTEGER, section_id INTEGER, teacher_id INTEGER, due_date TEXT, max_marks REAL DEFAULT 10, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS engagement_metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, login_count INTEGER DEFAULT 0, study_time_hours REAL DEFAULT 0, resource_access_count INTEGER DEFAULT 0, assignment_completion_rate REAL DEFAULT 0, recorded_week TEXT)",
    "CREATE TABLE IF NOT EXISTS ml_predictions (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, prediction_label TEXT, confidence_score REAL, feature_importance TEXT, recommendation TEXT, predicted_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS announcements (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, content TEXT NOT NULL, created_by INTEGER, target_roles TEXT DEFAULT 'all', is_active INTEGER DEFAULT 1, created_at TEXT DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS teacher_remarks (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER, teacher_id INTEGER, remark TEXT NOT NULL, category TEXT DEFAULT 'general', created_at TEXT DEFAULT (datetime('now')))",
]


# ════════════════════════════════════════════════════════════════════
# SEED
# ════════════════════════════════════════════════════════════════════
def seed():
    print("🌱 Seeding database...")
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row

    admin_ids = []
    for uname, name, email in [("vijayalakshmi.iyer","Vijayalakshmi Iyer","principal@vidyajyothi.edu.in"),("raghavan.sub","Raghavan Subramanian","vp@vidyajyothi.edu.in"),("senthil.kumar","Senthil Kumar","admin@vidyajyothi.edu.in")]:
        aid = db.execute("INSERT INTO users(username,email,password_hash,role,full_name,phone) VALUES(?,?,?,?,?,?)", (uname,email,generate_password_hash("admin123"),"admin",name,"9444100001")).lastrowid
        admin_ids.append(aid)

    section_ids = []
    for g_num in range(1, 13):
        gid = db.execute("INSERT INTO grades(grade_number,name) VALUES(?,?)", (g_num,f"Grade {g_num}")).lastrowid
        for sn in ["A","B"]:
            sid = db.execute("INSERT INTO sections(grade_id,section_name,capacity) VALUES(?,?,?)", (gid,sn,15)).lastrowid
            section_ids.append((sid,gid,g_num,sn))

    subjects_raw = [("English","ENG","English Language"),("Mathematics","MAT","Mathematics"),("Science","SCI","General Science"),("Social Science","SOC","History & Geography"),("Tamil","TAM","Tamil Language"),("Computer Science","CS","Computer Science"),("General Knowledge","GK","General Knowledge")]
    subject_ids = []
    for name,code,desc in subjects_raw:
        sid = db.execute("INSERT INTO subjects(name,code,description) VALUES(?,?,?)", (name,code,desc)).lastrowid
        subject_ids.append((sid,name))

    teacher_names = [
        ("Lakshmi Narayanan","F"),("Geetha Krishnan","F"),("Ramesh Kumar","M"),("Suresh Babu","M"),
        ("Meenakshi Sundaram","F"),("Balakrishnan Pillai","M"),("Saranya Venkatesan","F"),("Murugan Arumugam","M"),
        ("Kavitha Rajan","F"),("Annamalai Selvam","M"),("Padmavathi Iyer","F"),("Venkataraman Swami","M"),
        ("Rajeswari Natarajan","F"),("Shanmugam Pandian","M"),("Vijaya Krishnamurthy","F"),("Durai Raj","M"),
        ("Nirmala Subramaniam","F"),("Kannan Mani","M"),("Thenmozhi Arasan","F"),("Saravanan Ravi","M"),
        ("Indira Gopalakrishnan","F"),("Balamurugan Samy","M"),("Rekha Annamalai","F"),("Sathyanarayanan K","M"),
        ("Kamala Devi Pillai","F"),("Elango Murugesan","M"),("Amutha Raj","F"),("Krishnamoorthy Iyer","M"),
        ("Vasantha Kumari","F"),("Pandian Selvaraj","M"),
    ]
    quals = ["B.Ed","M.Ed","M.Sc B.Ed","M.A B.Ed","Ph.D"]
    specs = ["Mathematics","Physics","English","Tamil","Social Science","Computer Science"]
    teacher_ids = []
    for i,(tname,_) in enumerate(teacher_names, 1001):
        uname = tname.lower().replace(" ","_")[:18]
        uid = db.execute("INSERT INTO users(username,email,password_hash,role,full_name,phone) VALUES(?,?,?,?,?,?)", (uname,f"teacher{i}@vidyajyothi.edu.in",generate_password_hash("teacher123"),"teacher",tname,f"9{random.randint(400000000,499999999)}")).lastrowid
        tid = db.execute("INSERT INTO teachers(user_id,employee_id,qualification,specialization,experience_years) VALUES(?,?,?,?,?)", (uid,f"EMP{i}",random.choice(quals),random.choice(specs),random.randint(2,20))).lastrowid
        teacher_ids.append(tid)

    for idx,(sid,gid,gnum,sn) in enumerate(section_ids):
        db.execute("UPDATE sections SET class_teacher_id=? WHERE id=?", (teacher_ids[idx%30],sid))
        for subj_id,_ in subject_ids:
            db.execute("INSERT INTO teacher_assignments(teacher_id,section_id,subject_id) VALUES(?,?,?)", (random.choice(teacher_ids),sid,subj_id))

    male_n = ["Arun","Karthik","Vijay","Suresh","Ramesh","Ganesh","Dinesh","Naveen","Praveen","Bharath","Dhinesh","Elango","Gautam","Hari","Kannan","Madhan","Yuvaraj","Anand","Bala","Charan","Durai","Girish","Jagadeesh","Lokesh","Prakash","Sathish","Harish","Manish","Vignesh","Selvam"]
    female_n = ["Divya","Ananya","Priya","Kavitha","Meena","Geetha","Rekha","Nisha","Swetha","Lakshmi","Saranya","Lavanya","Aishwarya","Brindha","Chitra","Deepa","Janani","Kalpana","Lalitha","Malar","Nandhini","Oviya","Padmini","Radhika","Sangeetha","Thenmozhi","Uma","Vani","Yamini","Abinaya"]
    surnames = ["Kumar","Raj","Krishnan","Murugan","Rajan","Subramani","Narayanan","Swaminathan","Ramasamy","Pandian","Selvaraj","Annamalai","Palanisamy","Venkatesan","Arumugam","Natarajan","Shanmugam","Pillai","Iyer","Babu"]
    bgroups = ["A+","A-","B+","B-","O+","O-","AB+","AB-"]
    occs = ["Engineer","Doctor","Teacher","Businessman","Farmer","Government Employee","IT Professional","Homemaker","Accountant","Bank Employee"]

    all_students = []
    sc = pc = 1
    today = date.today()
    for sec_id,gid,gnum,sn in section_ids:
        for roll in range(1, random.randint(13,16)):
            pg = random.choice(["M","F"])
            pname = f"{random.choice(male_n if pg=='M' else female_n)} {random.choice(surnames)}"
            puid = db.execute("INSERT INTO users(username,email,password_hash,role,full_name,phone) VALUES(?,?,?,?,?,?)", (f"parent{pc:04d}",f"parent{pc:04d}@gmail.com",generate_password_hash("parent123"),"parent",pname,f"9{random.randint(300000000,399999999)}")).lastrowid
            ppid = db.execute("INSERT INTO parents(user_id,occupation,relation) VALUES(?,?,?)", (puid,random.choice(occs),"Father" if pg=="M" else "Mother")).lastrowid
            sg = random.choice(["Male","Female"])
            sname_full = f"{random.choice(male_n if sg=='Male' else female_n)} {random.choice(surnames)}"
            suid = db.execute("INSERT INTO users(username,email,password_hash,role,full_name,phone) VALUES(?,?,?,?,?,?)", (f"student{sc:04d}",f"student{sc:04d}@vidyajyothi.edu.in",generate_password_hash("student123"),"student",sname_full,f"9{random.randint(200000000,299999999)}")).lastrowid
            dob = date(today.year-(5+gnum), random.randint(1,12), random.randint(1,28))
            stid = db.execute("INSERT INTO students(user_id,admission_number,date_of_birth,gender,blood_group,address,parent_id) VALUES(?,?,?,?,?,?,?)", (suid,f"VJ{2024-gnum}{sc:04d}",str(dob),sg,random.choice(bgroups),f"{random.randint(1,100)}, Street {random.randint(1,50)}, Chennai - {random.randint(600001,600100)}",ppid)).lastrowid
            db.execute("INSERT INTO enrollments(student_id,section_id,academic_year,enrollment_date,is_current,roll_number) VALUES(?,?,?,?,?,?)", (stid,sec_id,"2024-25","2024-06-01",1,roll))
            all_students.append((stid,sec_id,gnum))
            sc += 1; pc += 1

    print(f"  Created {sc-1} students, {pc-1} parents")

    for stid,sec_id,gnum in all_students:
        att_rate = random.uniform(0.72,0.98)
        for days_back in range(60,0,-1):
            d = today - timedelta(days=days_back)
            if d.weekday() >= 5: continue
            r = random.random()
            status = "present" if r < att_rate else ("late" if r < att_rate+0.05 else "absent")
            db.execute("INSERT INTO attendance(student_id,section_id,date,status,marked_by) VALUES(?,?,?,?,?)", (stid,sec_id,str(d),status,admin_ids[0]))

    exam_types = ["Unit Test 1","Unit Test 2","Mid Term"]
    for stid,sec_id,gnum in all_students:
        base = random.uniform(45,95)
        for subj_id,_ in subject_ids:
            ta = db.execute("SELECT teacher_id FROM teacher_assignments WHERE section_id=? AND subject_id=?", (sec_id,subj_id)).fetchone()
            tid = ta[0] if ta else teacher_ids[0]
            for et in exam_types:
                max_m = 100 if "Mid" in et else 50
                raw = max(0, min(max_m, (base+random.uniform(-10,10))/100*max_m*random.uniform(0.85,1.0)))
                exam_d = today - timedelta(days=random.randint(10,55))
                db.execute("INSERT INTO grade_records(student_id,subject_id,section_id,teacher_id,exam_type,marks_obtained,max_marks,exam_date) VALUES(?,?,?,?,?,?,?,?)", (stid,subj_id,sec_id,tid,et,round(raw,1),max_m,str(exam_d)))

    for stid,sec_id,gnum in all_students:
        db.execute("INSERT INTO engagement_metrics(student_id,login_count,study_time_hours,resource_access_count,assignment_completion_rate,recorded_week) VALUES(?,?,?,?,?,?)", (stid,random.randint(5,45),round(random.uniform(0.5,6.0),2),random.randint(2,60),round(random.uniform(0.3,1.0),2),"2024-W48"))

    recs = {
        "slow": "Focus on building strong foundational skills. Break study sessions into smaller chunks. Review previous chapters before moving forward. Use visual aids and don't hesitate to ask your teachers for help!",
        "average": "You're on the right track! Try practicing additional problems beyond what's assigned. Set weekly study goals and explore supplementary resources. With consistent effort, excellence is within reach!",
        "fast": "Outstanding progress! Challenge yourself with advanced-level problems. Consider exploring topics beyond the textbook. Helping classmates will reinforce your own understanding!"
    }
    for stid,sec_id,gnum in all_students:
        if gnum < 6: continue
        rows = db.execute("SELECT marks_obtained, max_marks FROM grade_records WHERE student_id=?", (stid,)).fetchall()
        avg = sum(r[0]/r[1]*100 for r in rows)/len(rows) if rows else 60.0
        label = "slow" if avg < 55 else ("average" if avg < 75 else "fast")
        importance = json.dumps({"attendance_percentage":round(random.uniform(0.1,0.35),3),"average_marks":round(random.uniform(0.2,0.40),3),"study_time_hours":round(random.uniform(0.1,0.25),3),"login_count":round(random.uniform(0.05,0.15),3),"resource_access_count":round(random.uniform(0.05,0.15),3)})
        db.execute("INSERT INTO ml_predictions(student_id,prediction_label,confidence_score,feature_importance,recommendation) VALUES(?,?,?,?,?)", (stid,label,round(random.uniform(0.65,0.97),3),importance,recs[label]))

    asgn_titles = ["Chapter Summary","Problem Set","Research Project","Creative Writing","Map Activity","Programming Exercise","Current Events Analysis"]
    for sec_id,gid,gnum,sn in section_ids[:12]:
        for subj_id,subj_name in subject_ids:
            ta = db.execute("SELECT teacher_id FROM teacher_assignments WHERE section_id=? AND subject_id=?", (sec_id,subj_id)).fetchone()
            if not ta: continue
            due = datetime.now() + timedelta(days=random.randint(3,14))
            db.execute("INSERT INTO assignments(title,description,subject_id,section_id,teacher_id,due_date,max_marks) VALUES(?,?,?,?,?,?,?)", (f"{subj_name}: {random.choice(asgn_titles)}",f"Complete the assigned task based on Chapter {random.randint(1,8)}.",subj_id,sec_id,ta[0],str(due),random.choice([10,15,20,25])))

    for title,content,target in [
        ("Annual Sports Day 2024","Vidya Jyothi School Annual Sports Day on 20th December 2024. All students are encouraged to participate in Athletics, Team Sports, and Cultural activities.","all"),
        ("Parent-Teacher Meeting","Parent-Teacher Meeting on 15th December 2024 from 10:00 AM to 1:00 PM. Parents please attend and collect progress reports.","parent"),
        ("Holiday - Pongal Festival","School closed from 14th–17th January 2025 for Pongal. Classes resume 18th January 2025.","all"),
        ("Staff Development Program","Professional Development Workshop for all teachers on 22nd December 2024. Topic: AI Integration in CBSE Classrooms.","teacher"),
        ("Examination Schedule Released","Mid-Term examinations begin 8th December 2024. Check your dashboard for subject-wise schedule.","student"),
        ("Term 2 Fee Reminder","Term 2 fees due by 31st December 2024. Online payment available on the school website.","parent"),
        ("Science Exhibition 2025","Annual Science Exhibition on 10th January 2025. Students Grades 6–12 may submit project proposals by 20th December.","all"),
    ]:
        db.execute("INSERT INTO announcements(title,content,created_by,target_roles,is_active,created_at) VALUES(?,?,?,?,1,?)", (title,content,admin_ids[0],target,str(datetime.now()-timedelta(days=random.randint(0,14)))))

    remark_templates = [("Excellent performance in recent tests. Keep up the great work!","academic"),("Needs to improve class participation.","academic"),("Very attentive and helpful to classmates.","behavior"),("Homework submission has been inconsistent.","academic"),("Showing significant improvement this term!","academic")]
    for stid,sec_id,gnum in random.sample(all_students, min(50,len(all_students))):
        ta = db.execute("SELECT teacher_id FROM teacher_assignments WHERE section_id=?", (sec_id,)).fetchone()
        if not ta: continue
        rtext,cat = random.choice(remark_templates)
        db.execute("INSERT INTO teacher_remarks(student_id,teacher_id,remark,category,created_at) VALUES(?,?,?,?,?)", (stid,ta[0],rtext,cat,str(datetime.now()-timedelta(days=random.randint(1,30)))))

    db.commit()
    db.close()
    print(f"  ✅ Seeding complete! {sc-1} students, 30 teachers, 3 admins")


# ════════════════════════════════════════════════════════════════════
# AUTH
# ════════════════════════════════════════════════════════════════════
@app.route("/api/health")
def health():
    return jsonify({"status":"healthy","school":"Vidya Jyothi CBSE School","version":"1.0.0"})

@app.route("/")
def index():
    return jsonify({"message":"Vidya Jyothi School API","frontend":"http://localhost:3000"})

@app.route("/api/auth/login", methods=["POST"])
def login():
    d = request.get_json()
    uname = d.get("username","")
    user = qry("SELECT * FROM users WHERE username=? OR email=?", (uname,uname), one=True)
    if not user or not check_password_hash(user["password_hash"], d.get("password","")):
        return jsonify({"error":"Invalid credentials"}), 401
    if not user["is_active"]:
        return jsonify({"error":"Account deactivated"}), 403
    exe("UPDATE users SET last_login=? WHERE id=?", (str(datetime.utcnow()), user["id"]))
    token = make_token(user["id"], user["role"], user["full_name"])
    profile_id = None
    if user["role"]=="teacher":
        t=qry("SELECT id FROM teachers WHERE user_id=?",(user["id"],),one=True); profile_id=t["id"] if t else None
    elif user["role"]=="student":
        s=qry("SELECT id FROM students WHERE user_id=?",(user["id"],),one=True); profile_id=s["id"] if s else None
    elif user["role"]=="parent":
        p=qry("SELECT id FROM parents WHERE user_id=?",(user["id"],),one=True); profile_id=p["id"] if p else None
    return jsonify({"access_token":token,"user":{"id":user["id"],"username":user["username"],"email":user["email"],"role":user["role"],"full_name":user["full_name"],"phone":user["phone"],"is_active":bool(user["is_active"]),"profile_id":profile_id}})

@app.route("/api/auth/me")
@require_jwt()
def me():
    user=qry("SELECT * FROM users WHERE id=?",(g.user_id,),one=True)
    if not user: return jsonify({"error":"Not found"}),404
    return jsonify({"id":user["id"],"username":user["username"],"email":user["email"],"role":user["role"],"full_name":user["full_name"]})


# ════════════════════════════════════════════════════════════════════
# ADMIN
# ════════════════════════════════════════════════════════════════════
@app.route("/api/admin/dashboard")
@require_jwt(["admin"])
def admin_dashboard():
    ts=qry("SELECT COUNT(*) as c FROM students",one=True)["c"]
    tt=qry("SELECT COUNT(*) as c FROM teachers",one=True)["c"]
    tsec=qry("SELECT COUNT(*) as c FROM sections",one=True)["c"]
    td=str(date.today())
    tp=qry("SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='present'",(td,),one=True)["c"]
    tt2=qry("SELECT COUNT(*) as c FROM attendance WHERE date=?",(td,),one=True)["c"]
    att_pct=round(tp/tt2*100,1) if tt2>0 else 0
    grade_dist=qry("SELECT g.name as grade, COUNT(e.id) as count FROM grades g LEFT JOIN sections s ON s.grade_id=g.id LEFT JOIN enrollments e ON e.section_id=s.id AND e.is_current=1 GROUP BY g.id ORDER BY g.grade_number")
    trend=[]
    for i in range(13,0,-1):
        d=date.today()-timedelta(days=i)
        if d.weekday()>=5: continue
        p=qry("SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='present'",(str(d),),one=True)["c"]
        t=qry("SELECT COUNT(*) as c FROM attendance WHERE date=?",(str(d),),one=True)["c"]
        trend.append({"date":d.strftime("%d %b"),"percentage":round(p/t*100,1) if t>0 else 0})
    slow=qry("SELECT COUNT(*) as c FROM ml_predictions WHERE prediction_label='slow'",one=True)["c"]
    avg_=qry("SELECT COUNT(*) as c FROM ml_predictions WHERE prediction_label='average'",one=True)["c"]
    fast=qry("SELECT COUNT(*) as c FROM ml_predictions WHERE prediction_label='fast'",one=True)["c"]
    return jsonify({"stats":{"total_students":ts,"total_teachers":tt,"total_sections":tsec,"total_grades":12,"today_attendance_pct":att_pct,"today_present":tp,"today_total":tt2},"grade_distribution":grade_dist,"attendance_trend":trend,"ml_distribution":{"slow":slow,"average":avg_,"fast":fast}})

@app.route("/api/admin/users")
@require_jwt(["admin"])
def admin_users():
    role=request.args.get("role",""); search=request.args.get("search","")
    page=int(request.args.get("page",1)); pp=int(request.args.get("per_page",20)); offset=(page-1)*pp
    sql="SELECT * FROM users WHERE 1=1"; params=[]
    if role: sql+=" AND role=?"; params.append(role)
    if search: sql+=" AND full_name LIKE ?"; params.append(f"%{search}%")
    total=qry(sql.replace("SELECT *","SELECT COUNT(*) as c"),params,one=True)["c"]
    users=qry(sql+f" ORDER BY created_at DESC LIMIT {pp} OFFSET {offset}",params)
    clean=[{k:v for k,v in u.items() if k!="password_hash"} for u in users]
    return jsonify({"users":clean,"total":total,"pages":(total+pp-1)//pp,"current_page":page})

@app.route("/api/admin/users", methods=["POST"])
@require_jwt(["admin"])
def admin_create_user():
    d=request.get_json()
    if qry("SELECT id FROM users WHERE username=?",(d["username"],),one=True): return jsonify({"error":"Username exists"}),400
    uid=exe("INSERT INTO users(username,email,password_hash,role,full_name,phone) VALUES(?,?,?,?,?,?)",(d["username"],d["email"],generate_password_hash(d.get("password","password123")),d["role"],d["full_name"],d.get("phone","")))
    if d["role"]=="teacher": exe("INSERT INTO teachers(user_id,employee_id) VALUES(?,?)",(uid,f"EMP{uid}"))
    elif d["role"]=="student": exe("INSERT INTO students(user_id,admission_number) VALUES(?,?)",(uid,f"VJ2024{uid:04d}"))
    elif d["role"]=="parent": exe("INSERT INTO parents(user_id) VALUES(?)",(uid,))
    return jsonify({"message":"Created","id":uid}),201

@app.route("/api/admin/users/<int:uid>", methods=["PUT"])
@require_jwt(["admin"])
def admin_update_user(uid):
    d=request.get_json()
    exe("UPDATE users SET full_name=?,email=?,phone=?,is_active=? WHERE id=?",(d.get("full_name"),d.get("email"),d.get("phone"),int(d.get("is_active",1)),uid))
    if d.get("password"): exe("UPDATE users SET password_hash=? WHERE id=?",(generate_password_hash(d["password"]),uid))
    return jsonify({"message":"Updated"})

@app.route("/api/admin/users/<int:uid>", methods=["DELETE"])
@require_jwt(["admin"])
def admin_delete_user(uid):
    exe("DELETE FROM users WHERE id=?",(uid,)); return jsonify({"message":"Deleted"})

@app.route("/api/admin/grades")
@require_jwt(["admin"])
def admin_grades():
    grades=qry("SELECT * FROM grades ORDER BY grade_number")
    for gr in grades:
        sects=qry("SELECT s.*, COUNT(e.id) as student_count FROM sections s LEFT JOIN enrollments e ON e.section_id=s.id AND e.is_current=1 WHERE s.grade_id=? GROUP BY s.id",(gr["id"],))
        gr["sections"]=sects
    return jsonify(grades)

@app.route("/api/admin/subjects")
@require_jwt(["admin"])
def admin_subjects():
    return jsonify(qry("SELECT * FROM subjects"))

@app.route("/api/admin/teachers")
@require_jwt(["admin"])
def admin_teachers():
    return jsonify(qry("SELECT t.*, u.full_name, u.email FROM teachers t JOIN users u ON u.id=t.user_id"))

@app.route("/api/admin/students")
@require_jwt(["admin"])
def admin_students():
    page=int(request.args.get("page",1)); pp=int(request.args.get("per_page",20)); search=request.args.get("search",""); offset=(page-1)*pp
    where="WHERE 1=1"; params=[]
    if search: where+=" AND u.full_name LIKE ?"; params.append(f"%{search}%")
    total=qry(f"SELECT COUNT(*) as c FROM students s JOIN users u ON u.id=s.user_id {where}",params,one=True)["c"]
    rows=qry(f"SELECT s.*, u.full_name, u.email FROM students s JOIN users u ON u.id=s.user_id {where} LIMIT {pp} OFFSET {offset}",params)
    return jsonify({"students":rows,"total":total,"pages":(total+pp-1)//pp})

@app.route("/api/admin/announcements")
@require_jwt(["admin"])
def admin_get_announcements():
    return jsonify(qry("SELECT a.*, u.full_name as creator_name FROM announcements a JOIN users u ON u.id=a.created_by ORDER BY a.created_at DESC"))

@app.route("/api/admin/announcements", methods=["POST"])
@require_jwt(["admin"])
def admin_create_announcement():
    d=request.get_json()
    aid=exe("INSERT INTO announcements(title,content,created_by,target_roles,is_active) VALUES(?,?,?,?,1)",(d["title"],d["content"],g.user_id,d.get("target_roles","all")))
    return jsonify({"message":"Created","id":aid}),201

@app.route("/api/admin/announcements/<int:aid>", methods=["DELETE"])
@require_jwt(["admin"])
def admin_delete_announcement(aid):
    exe("DELETE FROM announcements WHERE id=?",(aid,)); return jsonify({"message":"Deleted"})

@app.route("/api/admin/ml-insights")
@require_jwt(["admin"])
def admin_ml_insights():
    slow=qry("SELECT COUNT(*) as c FROM ml_predictions WHERE prediction_label='slow'",one=True)["c"]
    avg_=qry("SELECT COUNT(*) as c FROM ml_predictions WHERE prediction_label='average'",one=True)["c"]
    fast=qry("SELECT COUNT(*) as c FROM ml_predictions WHERE prediction_label='fast'",one=True)["c"]
    total=slow+avg_+fast
    grade_breakdown=[]
    for gnum in range(6,13):
        students=qry("SELECT s.id FROM students s JOIN enrollments e ON e.student_id=s.id JOIN sections sec ON sec.id=e.section_id JOIN grades gr ON gr.id=sec.grade_id WHERE gr.grade_number=? AND e.is_current=1",(gnum,))
        sids=[r["id"] for r in students]
        if not sids: continue
        ph=",".join("?"*len(sids))
        gs=qry(f"SELECT COUNT(*) as c FROM ml_predictions WHERE student_id IN ({ph}) AND prediction_label='slow'",sids,one=True)["c"]
        ga=qry(f"SELECT COUNT(*) as c FROM ml_predictions WHERE student_id IN ({ph}) AND prediction_label='average'",sids,one=True)["c"]
        gf=qry(f"SELECT COUNT(*) as c FROM ml_predictions WHERE student_id IN ({ph}) AND prediction_label='fast'",sids,one=True)["c"]
        grade_breakdown.append({"grade":f"Grade {gnum}","slow":gs,"average":ga,"fast":gf,"total":gs+ga+gf})
    recent=qry("SELECT p.*, u.full_name as student_name FROM ml_predictions p JOIN students s ON s.id=p.student_id JOIN users u ON u.id=s.user_id ORDER BY p.predicted_at DESC LIMIT 10")
    return jsonify({"overall_distribution":{"slow":slow,"average":avg_,"fast":fast},"grade_breakdown":grade_breakdown,"recent_predictions":recent,"total_predictions":total})

@app.route("/api/admin/analytics/performance")
@require_jwt(["admin"])
def admin_performance():
    sp=qry("SELECT s.name as subject, ROUND(AVG(gr.marks_obtained*100.0/gr.max_marks),2) as average FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id GROUP BY gr.subject_id")
    gp=qry("SELECT g.name as grade, ROUND(AVG(gr.marks_obtained*100.0/gr.max_marks),2) as average FROM grade_records gr JOIN sections sec ON sec.id=gr.section_id JOIN grades g ON g.id=sec.grade_id GROUP BY g.id ORDER BY g.grade_number")
    return jsonify({"subject_performance":sp,"grade_performance":gp})


# ════════════════════════════════════════════════════════════════════
# TEACHER
# ════════════════════════════════════════════════════════════════════
def get_tid():
    t=qry("SELECT id FROM teachers WHERE user_id=?",(g.user_id,),one=True); return t["id"] if t else None

@app.route("/api/teacher/dashboard")
@require_jwt(["teacher"])
def teacher_dashboard():
    tid=get_tid()
    if not tid: return jsonify({"error":"Not found"}),404
    assignments=qry("SELECT DISTINCT section_id,subject_id FROM teacher_assignments WHERE teacher_id=?",(tid,))
    section_ids=list({a["section_id"] for a in assignments})
    total_students=0; sections_data=[]
    for sid in section_ids:
        cnt=qry("SELECT COUNT(*) as c FROM enrollments WHERE section_id=? AND is_current=1",(sid,),one=True)["c"]
        total_students+=cnt
        sec=qry("SELECT s.*,g.grade_number FROM sections s JOIN grades g ON g.id=s.grade_id WHERE s.id=?",(sid,),one=True)
        if sec: sections_data.append({"id":sid,"grade":sec["grade_number"],"section":sec["section_name"],"name":f"Grade {sec['grade_number']} - {sec['section_name']}","student_count":cnt})
    td=str(date.today())
    if section_ids:
        ph=",".join("?"*len(section_ids))
        tp=qry(f"SELECT COUNT(*) as c FROM attendance WHERE section_id IN ({ph}) AND date=? AND status='present'",section_ids+[td],one=True)["c"]
        tt=qry(f"SELECT COUNT(*) as c FROM attendance WHERE section_id IN ({ph}) AND date=?",section_ids+[td],one=True)["c"]
    else: tp=tt=0
    att_pct=round(tp/tt*100,1) if tt>0 else 0
    pending=qry("SELECT COUNT(*) as c FROM assignments WHERE teacher_id=? AND due_date>?",(tid,str(datetime.now())),one=True)["c"]
    recent_grades=qry("SELECT gr.*,s.name as subject_name FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.teacher_id=? ORDER BY gr.created_at DESC LIMIT 5",(tid,))
    for r in recent_grades: r["percentage"]=round(r["marks_obtained"]/r["max_marks"]*100,1) if r["max_marks"]>0 else 0
    return jsonify({"stats":{"total_students":total_students,"total_sections":len(section_ids),"today_attendance_pct":att_pct,"pending_assignments":pending,"subjects_teaching":len({a["subject_id"] for a in assignments})},"sections":sections_data,"recent_grades":recent_grades})

@app.route("/api/teacher/sections/<int:sid>/students")
@require_jwt(["teacher"])
def teacher_section_students(sid):
    rows=qry("SELECT s.id,u.full_name,s.admission_number,s.gender,e.roll_number FROM enrollments e JOIN students s ON s.id=e.student_id JOIN users u ON u.id=s.user_id WHERE e.section_id=? AND e.is_current=1 ORDER BY e.roll_number",(sid,))
    result=[]
    for r in rows:
        total=qry("SELECT COUNT(*) as c FROM attendance WHERE student_id=?",(r["id"],),one=True)["c"]
        present=qry("SELECT COUNT(*) as c FROM attendance WHERE student_id=? AND status='present'",(r["id"],),one=True)["c"]
        att_pct=round(present/total*100,1) if total>0 else 0
        grades=qry("SELECT marks_obtained,max_marks FROM grade_records WHERE student_id=? AND section_id=?",(r["id"],sid))
        avg=round(sum(x["marks_obtained"]/x["max_marks"]*100 for x in grades if x["max_marks"]>0)/len(grades),1) if grades else 0
        result.append({**r,"attendance_pct":att_pct,"average_marks":avg})
    sec=qry("SELECT s.*,g.grade_number FROM sections s JOIN grades g ON g.id=s.grade_id WHERE s.id=?",(sid,),one=True)
    return jsonify({"section":sec,"students":result})

@app.route("/api/teacher/attendance")
@require_jwt(["teacher"])
def teacher_get_attendance():
    sid=request.args.get("section_id",type=int); att_date=request.args.get("date",str(date.today()))
    rows=qry("SELECT s.id as student_id,u.full_name as student_name,e.roll_number FROM enrollments e JOIN students s ON s.id=e.student_id JOIN users u ON u.id=s.user_id WHERE e.section_id=? AND e.is_current=1 ORDER BY e.roll_number",(sid,))
    result=[]
    for r in rows:
        att=qry("SELECT id,status FROM attendance WHERE student_id=? AND section_id=? AND date=?",(r["student_id"],sid,att_date),one=True)
        result.append({**r,"status":att["status"] if att else "present","attendance_id":att["id"] if att else None})
    return jsonify(result)

@app.route("/api/teacher/attendance", methods=["POST"])
@require_jwt(["teacher"])
def teacher_mark_attendance():
    d=request.get_json(); sid=d.get("section_id"); att_date=d.get("date",str(date.today()))
    for item in d.get("attendance",[]):
        ex=qry("SELECT id FROM attendance WHERE student_id=? AND section_id=? AND date=?",(item["student_id"],sid,att_date),one=True)
        if ex: exe("UPDATE attendance SET status=? WHERE id=?",(item["status"],ex["id"]))
        else: exe("INSERT INTO attendance(student_id,section_id,date,status,marked_by) VALUES(?,?,?,?,?)",(item["student_id"],sid,att_date,item["status"],g.user_id))
    return jsonify({"message":"Saved"})

@app.route("/api/teacher/grades", methods=["POST"])
@require_jwt(["teacher"])
def teacher_add_grade():
    tid=get_tid(); d=request.get_json()
    rid=exe("INSERT INTO grade_records(student_id,subject_id,section_id,teacher_id,exam_type,marks_obtained,max_marks,exam_date,remarks) VALUES(?,?,?,?,?,?,?,?,?)",(d["student_id"],d["subject_id"],d.get("section_id"),tid,d["exam_type"],d["marks_obtained"],d["max_marks"],d.get("exam_date",str(date.today())),d.get("remarks","")))
    return jsonify({"message":"Recorded","id":rid}),201

@app.route("/api/teacher/grades/<int:sid>")
@require_jwt(["teacher"])
def teacher_section_grades(sid):
    rows=qry("SELECT gr.*,s.name as subject_name FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.section_id=? ORDER BY gr.created_at DESC",(sid,))
    for r in rows: r["percentage"]=round(r["marks_obtained"]/r["max_marks"]*100,1) if r["max_marks"]>0 else 0
    return jsonify(rows)

@app.route("/api/teacher/assignments")
@require_jwt(["teacher"])
def teacher_get_assignments():
    tid=get_tid()
    rows=qry("SELECT a.*,s.name as subject_name,u.full_name as teacher_name FROM assignments a JOIN subjects s ON s.id=a.subject_id JOIN teachers t ON t.id=a.teacher_id JOIN users u ON u.id=t.user_id WHERE a.teacher_id=? ORDER BY a.created_at DESC",(tid,))
    return jsonify(rows)

@app.route("/api/teacher/assignments", methods=["POST"])
@require_jwt(["teacher"])
def teacher_create_assignment():
    tid=get_tid(); d=request.get_json()
    aid=exe("INSERT INTO assignments(title,description,subject_id,section_id,teacher_id,due_date,max_marks) VALUES(?,?,?,?,?,?,?)",(d["title"],d.get("description",""),d["subject_id"],d["section_id"],tid,d.get("due_date"),d.get("max_marks",10)))
    return jsonify({"message":"Created","id":aid}),201

@app.route("/api/teacher/performance/<int:sid>")
@require_jwt(["teacher"])
def teacher_performance(sid):
    sa=qry("SELECT s.name as subject,ROUND(AVG(gr.marks_obtained*100.0/gr.max_marks),2) as average FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.section_id=? GROUP BY gr.subject_id",(sid,))
    students=qry("SELECT s.id,u.full_name as name FROM enrollments e JOIN students s ON s.id=e.student_id JOIN users u ON u.id=s.user_id WHERE e.section_id=? AND e.is_current=1",(sid,))
    ranking=[]
    for s in students:
        grades=qry("SELECT marks_obtained,max_marks FROM grade_records WHERE student_id=? AND section_id=?",(s["id"],sid))
        avg=round(sum(x["marks_obtained"]/x["max_marks"]*100 for x in grades if x["max_marks"]>0)/len(grades),2) if grades else 0
        ranking.append({"name":s["name"],"average":avg})
    ranking.sort(key=lambda x:x["average"],reverse=True)
    return jsonify({"subject_averages":sa,"student_ranking":ranking[:10]})

@app.route("/api/teacher/ml-grouping/<int:sid>")
@require_jwt(["teacher"])
def teacher_ml_grouping(sid):
    sec=qry("SELECT s.*,g.grade_number FROM sections s JOIN grades g ON g.id=s.grade_id WHERE s.id=?",(sid,),one=True)
    if not sec: return jsonify({"error":"Not found"}),404
    if sec["grade_number"]<6: return jsonify({"available":False,"error":"ML available for Grades 6-12 only"})
    enrollments=qry("SELECT student_id FROM enrollments WHERE section_id=? AND is_current=1",(sid,))
    groups={"slow":[],"average":[],"fast":[]}
    for en in enrollments:
        stid=en["student_id"]
        pred=qry("SELECT * FROM ml_predictions WHERE student_id=? ORDER BY predicted_at DESC LIMIT 1",(stid,),one=True)
        s=qry("SELECT u.full_name FROM students s JOIN users u ON u.id=s.user_id WHERE s.id=?",(stid,),one=True)
        if not pred or not s: continue
        label=pred["prediction_label"]
        if label in groups: groups[label].append({"student_id":stid,"student_name":s["full_name"],"confidence":pred["confidence_score"],"recommendation":pred["recommendation"]})
    return jsonify({"available":True,"section":f"Grade {sec['grade_number']} - {sec['section_name']}","groups":groups,"distribution":{k:len(v) for k,v in groups.items()},"total":sum(len(v) for v in groups.values())})

@app.route("/api/teacher/subjects")
@require_jwt(["teacher"])
def teacher_subjects():
    tid=get_tid()
    if not tid: return jsonify([])
    return jsonify(qry("SELECT DISTINCT s.* FROM subjects s JOIN teacher_assignments ta ON ta.subject_id=s.id WHERE ta.teacher_id=?",(tid,)))

@app.route("/api/teacher/remarks", methods=["POST"])
@require_jwt(["teacher"])
def teacher_add_remark():
    tid=get_tid(); d=request.get_json()
    exe("INSERT INTO teacher_remarks(student_id,teacher_id,remark,category) VALUES(?,?,?,?)",(d["student_id"],tid,d["remark"],d.get("category","general")))
    return jsonify({"message":"Added"}),201


# ════════════════════════════════════════════════════════════════════
# STUDENT
# ════════════════════════════════════════════════════════════════════
def get_stid():
    s=qry("SELECT id FROM students WHERE user_id=?",(g.user_id,),one=True); return s["id"] if s else None

@app.route("/api/student/dashboard")
@require_jwt(["student"])
def student_dashboard():
    stid=get_stid()
    if not stid: return jsonify({"error":"Not found"}),404
    student=qry("SELECT s.*,u.full_name,u.email FROM students s JOIN users u ON u.id=s.user_id WHERE s.id=?",(stid,),one=True)
    en=qry("SELECT e.*,sec.section_name,g.grade_number FROM enrollments e JOIN sections sec ON sec.id=e.section_id JOIN grades g ON g.id=sec.grade_id WHERE e.student_id=? AND e.is_current=1",(stid,),one=True)
    total=qry("SELECT COUNT(*) as c FROM attendance WHERE student_id=?",(stid,),one=True)["c"]
    present=qry("SELECT COUNT(*) as c FROM attendance WHERE student_id=? AND status='present'",(stid,),one=True)["c"]
    att_pct=round(present/total*100,1) if total>0 else 0
    sp=qry("SELECT s.name as subject,ROUND(AVG(gr.marks_obtained*100.0/gr.max_marks),2) as average FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.student_id=? GROUP BY gr.subject_id",(stid,))
    overall=round(sum(x["average"] for x in sp)/len(sp),2) if sp else 0
    pred=qry("SELECT recommendation FROM ml_predictions WHERE student_id=? ORDER BY predicted_at DESC LIMIT 1",(stid,),one=True)
    upcoming=[]
    if en: upcoming=qry("SELECT a.*,s.name as subject_name,u.full_name as teacher_name FROM assignments a JOIN subjects s ON s.id=a.subject_id JOIN teachers t ON t.id=a.teacher_id JOIN users u ON u.id=t.user_id WHERE a.section_id=? AND a.due_date>? ORDER BY a.due_date LIMIT 5",(en["section_id"],str(datetime.now())))
    child_dict={"id":student["id"],"full_name":student["full_name"],"admission_number":student["admission_number"],"grade":en["grade_number"] if en else None,"section_name":en["section_name"] if en else None}
    return jsonify({"student":child_dict,"stats":{"attendance_pct":att_pct,"overall_average":overall,"total_days_present":present,"total_days_tracked":total},"subject_performance":sp,"recommendation":pred["recommendation"] if pred else None,"upcoming_assignments":upcoming})

@app.route("/api/student/grades")
@require_jwt(["student"])
def student_grades():
    stid=get_stid()
    rows=qry("SELECT gr.*,s.name as subject_name FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.student_id=? ORDER BY gr.exam_date DESC",(stid,))
    for r in rows: r["percentage"]=round(r["marks_obtained"]/r["max_marks"]*100,2) if r["max_marks"]>0 else 0
    return jsonify(rows)

@app.route("/api/student/attendance")
@require_jwt(["student"])
def student_attendance():
    stid=get_stid()
    records=qry("SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC LIMIT 60",(stid,))
    total=len(records); present=sum(1 for r in records if r["status"]=="present")
    return jsonify({"attendance_pct":round(present/total*100,1) if total>0 else 0,"total_days":total,"present_days":present,"records":records})

@app.route("/api/student/assignments")
@require_jwt(["student"])
def student_assignments():
    stid=get_stid()
    en=qry("SELECT section_id FROM enrollments WHERE student_id=? AND is_current=1",(stid,),one=True)
    if not en: return jsonify([])
    rows=qry("SELECT a.*,s.name as subject_name,u.full_name as teacher_name FROM assignments a JOIN subjects s ON s.id=a.subject_id JOIN teachers t ON t.id=a.teacher_id JOIN users u ON u.id=t.user_id WHERE a.section_id=? ORDER BY a.due_date",(en["section_id"],))
    return jsonify(rows)

@app.route("/api/student/announcements")
@require_jwt(["student"])
def student_announcements():
    return jsonify(qry("SELECT a.*,u.full_name as creator_name FROM announcements a JOIN users u ON u.id=a.created_by WHERE a.is_active=1 AND (a.target_roles='all' OR a.target_roles='student') ORDER BY a.created_at DESC LIMIT 10"))


# ════════════════════════════════════════════════════════════════════
# PARENT
# ════════════════════════════════════════════════════════════════════
def get_parent_child():
    p=qry("SELECT id FROM parents WHERE user_id=?",(g.user_id,),one=True)
    if not p: return None,None
    child=qry("SELECT s.*,u.full_name FROM students s JOIN users u ON u.id=s.user_id WHERE s.parent_id=?",(p["id"],),one=True)
    return p["id"],child

@app.route("/api/parent/dashboard")
@require_jwt(["parent"])
def parent_dashboard():
    pid,child=get_parent_child()
    if not child: return jsonify({"error":"No child found"}),404
    en=qry("SELECT e.*,sec.section_name,g.grade_number FROM enrollments e JOIN sections sec ON sec.id=e.section_id JOIN grades g ON g.id=sec.grade_id WHERE e.student_id=? AND e.is_current=1",(child["id"],),one=True)
    total=qry("SELECT COUNT(*) as c FROM attendance WHERE student_id=?",(child["id"],),one=True)["c"]
    present=qry("SELECT COUNT(*) as c FROM attendance WHERE student_id=? AND status='present'",(child["id"],),one=True)["c"]
    att_pct=round(present/total*100,1) if total>0 else 0
    sp=qry("SELECT s.name as subject,ROUND(AVG(gr.marks_obtained*100.0/gr.max_marks),2) as average FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.student_id=? GROUP BY gr.subject_id",(child["id"],))
    overall=round(sum(x["average"] for x in sp)/len(sp),2) if sp else 0
    remarks=qry("SELECT tr.*,u.full_name as teacher_name FROM teacher_remarks tr JOIN teachers t ON t.id=tr.teacher_id JOIN users u ON u.id=t.user_id WHERE tr.student_id=? ORDER BY tr.created_at DESC LIMIT 5",(child["id"],))
    anns=qry("SELECT a.*,u.full_name as creator_name FROM announcements a JOIN users u ON u.id=a.created_by WHERE a.is_active=1 AND (a.target_roles='all' OR a.target_roles='parent') ORDER BY a.created_at DESC LIMIT 5")
    child_dict={"id":child["id"],"full_name":child["full_name"],"admission_number":child["admission_number"],"grade":en["grade_number"] if en else None,"section_name":en["section_name"] if en else None}
    return jsonify({"child":child_dict,"stats":{"attendance_pct":att_pct,"overall_average":overall,"present_days":present,"total_days":total},"subject_performance":sp,"teacher_remarks":remarks,"announcements":anns})

@app.route("/api/parent/child/attendance")
@require_jwt(["parent"])
def parent_child_attendance():
    _,child=get_parent_child()
    if not child: return jsonify({"error":"Not found"}),404
    records=qry("SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC LIMIT 60",(child["id"],))
    total=len(records); present=sum(1 for r in records if r["status"]=="present")
    return jsonify({"attendance_pct":round(present/total*100,1) if total else 0,"records":records})

@app.route("/api/parent/child/grades")
@require_jwt(["parent"])
def parent_child_grades():
    _,child=get_parent_child()
    if not child: return jsonify([])
    rows=qry("SELECT gr.*,s.name as subject_name FROM grade_records gr JOIN subjects s ON s.id=gr.subject_id WHERE gr.student_id=? ORDER BY gr.exam_date DESC",(child["id"],))
    for r in rows: r["percentage"]=round(r["marks_obtained"]/r["max_marks"]*100,2) if r["max_marks"]>0 else 0
    return jsonify(rows)

@app.route("/api/parent/announcements")
@require_jwt(["parent"])
def parent_announcements():
    return jsonify(qry("SELECT a.*,u.full_name as creator_name FROM announcements a JOIN users u ON u.id=a.created_by WHERE a.is_active=1 AND (a.target_roles='all' OR a.target_roles='parent') ORDER BY a.created_at DESC"))


# ════════════════════════════════════════════════════════════════════
# AI ASSISTANT
# ════════════════════════════════════════════════════════════════════
AI_RESPONSES = {
    "student": {
        "explain": "Here's a structured approach to understanding this concept:\n\n**Step 1: Understand the Basics**\nRead your NCERT textbook chapter carefully. Note down key terms and definitions.\n\n**Step 2: Make Your Own Notes**\nRewrite concepts in your own words. Draw diagrams — visual memory is powerful!\n\n**Step 3: Practice with Examples**\nWork through 2-3 solved examples before attempting exercises.\n\n**Step 4: Review After 24 Hours**\nRevising the next day reinforces long-term memory.\n\nWhat specific concept would you like me to help explain? 📚",
        "help": "Don't worry — every student faces challenges! Here are strategies that genuinely work:\n\n🎯 **Break it down**: Divide the topic into 3-4 smaller parts. Master one before moving on.\n\n🔄 **Review prerequisites**: If a concept feels unclear, revisit the previous chapter.\n\n📝 **Work through examples**: Don't just read — write out each step yourself.\n\n🤝 **Ask your teacher**: A 5-minute conversation with your teacher can save hours of confusion.\n\n💡 **Use diagrams**: For Science and Social Science, visual maps make concepts click!\n\nWhich subject or topic is giving you trouble? Tell me and I'll guide you specifically! 🌟",
        "exam": "Here's a proven CBSE exam preparation timeline:\n\n📅 **4 Weeks Before:**\n- Complete full syllabus revision\n- Focus on high-weightage chapters (check CBSE marking scheme)\n\n📅 **2 Weeks Before:**\n- Solve 3-5 previous year question papers\n- Practice time management (3 hrs for 80-mark paper)\n\n📅 **1 Week Before:**\n- Quick-revision of formulas, dates, diagrams\n- Review your own notes, not textbook\n\n📅 **Day Before:**\n- Light revision only — NO new topics!\n- Sleep by 10 PM. Well-rested brain = better recall 🧠\n\nRemember: Consistent 2-hour daily study beats 10-hour last-minute cramming every time! 💪",
        "default": "Great question! Let me help you approach this systematically.\n\nThe best way to master any CBSE topic is:\n1. **Understand** — don't just memorize\n2. **Connect** — link it to real-world examples\n3. **Practice** — do at least 5 problems of each type\n4. **Teach** — explain it to someone else to confirm your understanding\n\nWhat specific topic are you working on? Share more details and I'll give you targeted guidance! 📖"
    },
    "teacher": {
        "struggling": "**Intervention Strategies for Struggling Students:**\n\n🎯 **Immediate (This Week):**\n- Schedule 10-minute one-on-one check-ins after class\n- Identify the specific concept gap — don't assume\n- Assign a peer buddy from average-performing students\n\n📊 **Assessment Approach:**\n- Use quick 5-minute formative checks at lesson start\n- Celebrate small wins publicly to build confidence\n- Track improvement rate, not just absolute score\n\n🏠 **Parent Partnership:**\n- Send a brief SMS/note home about specific support needed\n- Suggest 15-minute daily practice at home\n- Weekly progress updates via the parent portal\n\n💡 **Instructional Adjustments:**\n- Use concrete manipulatives before abstract concepts\n- Break explanations into micro-steps\n- Provide worked examples with each assignment\n\nWould you like strategies specific to a subject or grade level?",
        "lesson": "**Effective CBSE Lesson Structure (50 minutes):**\n\n⏱ **0-5 min** — Warm-up\nQuick recall question from previous lesson. Activate prior knowledge.\n\n⏱ **5-15 min** — Introduction  \nReal-world hook that connects to students' lives. State learning objectives clearly.\n\n⏱ **15-35 min** — Core Instruction\nExplain concept with multiple representations (verbal, visual, numeric). Check for understanding every 10 minutes.\n\n⏱ **35-45 min** — Guided Practice\nWork through problems together. Think aloud your reasoning.\n\n⏱ **45-50 min** — Exit Ticket\nOne question that checks core understanding. Informs next lesson.\n\n**For Differentiation:**\n- Fast learners: Extension problems, teach-back activity\n- Average: Standard practice with hints available  \n- Slow learners: Simplified examples, peer support\n\nWhat grade and subject are you planning for? I can give more targeted suggestions!",
        "default": "**Evidence-Based Teaching Strategies for CBSE:**\n\nFor effective classroom management and learning outcomes:\n\n📋 **Planning**: Always state the learning objective at the start — students perform better when they know what success looks like.\n\n🔄 **Retrieval Practice**: Start each class with 3 questions from previous lessons. This improves retention by 40%.\n\n👥 **Collaborative Learning**: Pair-share activities increase engagement. Even 2 minutes of peer discussion improves comprehension.\n\n📊 **Formative Assessment**: Weekly 10-mark quizzes help identify gaps before they become problems.\n\nWhat aspect of teaching would you like more guidance on?"
    },
    "admin": [
        "**School Performance Insights:**\n\nBased on typical CBSE school patterns, here are high-impact improvement strategies:\n\n📊 **Attendance** — Implement an automated early-warning SMS to parents when a student misses 3+ consecutive days. Schools that do this see attendance improve by 8-12%.\n\n🎯 **Academic Performance** — Cross-reference ML predictions with actual grades monthly. Students flagged as 'slow' who are showing improvement need encouragement, not just intervention.\n\n👥 **Teacher Effectiveness** — Regular peer observation (teachers observing each other's classes) improves teaching quality more than external training.\n\n📱 **Parent Engagement** — Schools with active parent portals see 15-20% better student performance. Encourage parents to log in weekly.",
        "**Strategic Recommendations for School Management:**\n\n🏆 **Quick Wins (This Month):**\n- Announce top-performing students in each class publicly\n- Share attendance rankings with teachers — friendly competition works\n- Host one parent information session about the digital portal\n\n📈 **Medium-Term (This Term):**\n- Identify the 3 subjects with lowest school-wide average and dedicate extra resources\n- Create subject-wise study materials for Grades 10-12\n- Implement monthly teacher-student feedback sessions\n\n🎯 **Long-Term (This Year):**\n- Build a mentorship program pairing Grade 11-12 students with Grade 8-9\n- Develop a parent volunteer program for skill-based workshops\n- Track year-on-year performance trends to measure school improvement"
    ],
    "parent": "**Supporting Your Child's Education at Home:**\n\n📚 **Creating the Right Study Environment:**\n- Dedicate a quiet, well-lit space for studying\n- Keep phones/tablets away during study time\n- Set consistent study hours (same time each day)\n\n🗣️ **Daily Engagement:**\n- Ask 'What did you learn today?' — this one question improves retention\n- Review homework together (guide, don't do it for them)\n- Celebrate effort and progress, not just marks\n\n🤝 **Working with the School:**\n- Attend all Parent-Teacher Meetings\n- Read announcements in this portal regularly\n- Contact the class teacher if you notice persistent difficulty\n\n💪 **Motivating Your Child:**\n- Set small weekly goals together\n- Connect studies to their interests and career dreams\n- Remind them that struggle is part of learning — it means the brain is growing!\n\nIs there a specific concern about your child's progress I can help with?"
}

@app.route("/api/ai/chat", methods=["POST"])
@require_jwt()
def ai_chat():
    d=request.get_json(); message=d.get("message","").lower(); role=g.role
    if role=="student":
        if any(w in message for w in ["explain","what is","how does","define","meaning","tell me about"]): response=AI_RESPONSES["student"]["explain"]
        elif any(w in message for w in ["help","stuck","difficult","hard","don't understand","not getting"]): response=AI_RESPONSES["student"]["help"]
        elif any(w in message for w in ["exam","test","prepare","revision","study tips","marks"]): response=AI_RESPONSES["student"]["exam"]
        else: response=AI_RESPONSES["student"]["default"]
    elif role=="teacher":
        if any(w in message for w in ["struggling","slow","weak","support","failing","behind"]): response=AI_RESPONSES["teacher"]["struggling"]
        elif any(w in message for w in ["lesson","plan","teach","activity","strategy","structure"]): response=AI_RESPONSES["teacher"]["lesson"]
        else: response=AI_RESPONSES["teacher"]["default"]
    elif role=="admin":
        response=random.choice(AI_RESPONSES["admin"])
    else:
        response=AI_RESPONSES["parent"]
    return jsonify({"response":response,"role":role,"model":"contextual-ai"})


# ════════════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════════════
def init_db():
    db=sqlite3.connect(DB_PATH)
    for stmt in SCHEMA:
        db.execute(stmt)
    db.commit(); db.close()

if __name__=="__main__":
    needs_seed=not os.path.exists(DB_PATH)
    init_db()
    if needs_seed:
        print("🏫 Vidya Jyothi School Management System"); print("="*50)
        seed()
        try:
            sys.path.insert(0, os.path.dirname(__file__))
            from ml.model import train_model; train_model()
        except Exception as e:
            print(f"  ℹ ML model: {e} (will use seeded predictions)")
    else:
        print("🏫 Vidya Jyothi — database ready")
    print("\n"+"="*50)
    print("🚀 Backend: http://localhost:5000")
    print("   Admin:   vijayalakshmi.iyer / admin123")
    print("   Teacher: lakshmi_narayanan  / teacher123")
    print("   Student: student0001        / student123")
    print("   Parent:  parent0001         / parent123")
    print("="*50+"\n")
    app.run(debug=False, port=5000, host="0.0.0.0")
