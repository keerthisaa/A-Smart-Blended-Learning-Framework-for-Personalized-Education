"""
Admin Routes - Full system management
User management, class management, analytics, announcements
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import (
    db, User, Grade, Section, Subject, Teacher, Student, Parent,
    Enrollment, Attendance, GradeRecord, TeacherAssignment,
    Announcement, MLPrediction
)
from datetime import datetime, date, timedelta
import random

admin_bp = Blueprint('admin', __name__)


def require_admin():
    """Check if current user is admin"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    return None


# ── Dashboard Overview ────────────────────────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    """Admin dashboard overview stats"""
    err = require_admin()
    if err: return err
    
    total_students = Student.query.count()
    total_teachers = Teacher.query.count()
    total_sections = Section.query.count()
    
    # Today's attendance
    today = date.today()
    today_present = Attendance.query.filter_by(date=today, status='present').count()
    today_total = Attendance.query.filter_by(date=today).count()
    attendance_pct = round(today_present / today_total * 100, 1) if today_total > 0 else 0
    
    # Grade distribution
    grade_data = []
    for g in Grade.query.order_by(Grade.grade_number).all():
        count = db.session.execute(
            db.select(db.func.count(Student.id))
            .join(Enrollment, Enrollment.student_id == Student.id)
            .join(Section, Section.id == Enrollment.section_id)
            .where(Section.grade_id == g.id)
            .where(Enrollment.is_current == True)
        ).scalar()
        grade_data.append({'grade': g.name, 'count': count or 0})
    
    # Attendance trend (last 7 days)
    att_trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        if d.weekday() >= 5:
            continue
        present = Attendance.query.filter_by(date=d, status='present').count()
        total = Attendance.query.filter_by(date=d).count()
        pct = round(present / total * 100, 1) if total > 0 else 0
        att_trend.append({'date': d.strftime('%d %b'), 'percentage': pct})
    
    # ML prediction distribution
    slow = MLPrediction.query.filter_by(prediction_label='slow').count()
    avg = MLPrediction.query.filter_by(prediction_label='average').count()
    fast = MLPrediction.query.filter_by(prediction_label='fast').count()
    
    return jsonify({
        'stats': {
            'total_students': total_students,
            'total_teachers': total_teachers,
            'total_sections': total_sections,
            'total_grades': 12,
            'today_attendance_pct': attendance_pct,
            'today_present': today_present,
            'today_total': today_total
        },
        'grade_distribution': grade_data,
        'attendance_trend': att_trend,
        'ml_distribution': {'slow': slow, 'average': avg, 'fast': fast}
    }), 200


# ── User Management ───────────────────────────────────────────────────────────

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    """List all users with filtering"""
    err = require_admin()
    if err: return err
    
    role = request.args.get('role')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    search = request.args.get('search', '')
    
    query = User.query
    if role:
        query = query.filter_by(role=role)
    if search:
        query = query.filter(User.full_name.ilike(f'%{search}%'))
    
    paginated = query.order_by(User.created_at.desc()).paginate(page=page, per_page=per_page)
    
    return jsonify({
        'users': [u.to_dict() for u in paginated.items],
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """Create a new user"""
    err = require_admin()
    if err: return err
    
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        role=data['role'],
        full_name=data['full_name'],
        phone=data.get('phone', '')
    )
    user.set_password(data.get('password', 'password123'))
    db.session.add(user)
    db.session.flush()
    
    # Create role-specific profile
    if data['role'] == 'teacher':
        import random
        emp_id = f"EMP{random.randint(2000, 9999)}"
        t = Teacher(user_id=user.id, employee_id=emp_id)
        db.session.add(t)
    elif data['role'] == 'student':
        s = Student(user_id=user.id, admission_number=f"VJ2024{user.id:04d}")
        db.session.add(s)
    elif data['role'] == 'parent':
        p = Parent(user_id=user.id)
        db.session.add(p)
    
    db.session.commit()
    return jsonify({'message': 'User created successfully', 'user': user.to_dict()}), 201


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update a user"""
    err = require_admin()
    if err: return err
    
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    user.full_name = data.get('full_name', user.full_name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)
    user.is_active = data.get('is_active', user.is_active)
    
    if data.get('password'):
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify({'message': 'User updated', 'user': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user"""
    err = require_admin()
    if err: return err
    
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'}), 200


# ── Class Management ──────────────────────────────────────────────────────────

@admin_bp.route('/grades', methods=['GET'])
@jwt_required()
def get_grades():
    """List all grades with sections"""
    err = require_admin()
    if err: return err
    
    grades = Grade.query.order_by(Grade.grade_number).all()
    result = []
    
    for g in grades:
        sections_data = []
        for s in g.sections:
            student_count = Enrollment.query.filter_by(section_id=s.id, is_current=True).count()
            sections_data.append({
                **s.to_dict(),
                'student_count': student_count
            })
        result.append({
            **g.to_dict(),
            'sections': sections_data
        })
    
    return jsonify(result), 200


@admin_bp.route('/subjects', methods=['GET'])
@jwt_required()
def get_subjects():
    """List all subjects"""
    err = require_admin()
    if err: return err
    subjects = Subject.query.all()
    return jsonify([s.to_dict() for s in subjects]), 200


@admin_bp.route('/teachers', methods=['GET'])
@jwt_required()
def get_teachers():
    """List all teachers"""
    err = require_admin()
    if err: return err
    
    teachers = Teacher.query.join(User).all()
    result = []
    for t in teachers:
        # Count sections assigned
        section_count = TeacherAssignment.query.filter_by(teacher_id=t.id).with_entities(
            TeacherAssignment.section_id
        ).distinct().count()
        
        result.append({
            **t.to_dict(),
            'section_count': section_count
        })
    
    return jsonify(result), 200


@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def get_students():
    """List all students with optional grade/section filter"""
    err = require_admin()
    if err: return err
    
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    grade_id = request.args.get('grade_id')
    search = request.args.get('search', '')
    
    query = Student.query.join(User)
    if search:
        query = query.filter(User.full_name.ilike(f'%{search}%'))
    
    students = query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'students': [s.to_dict() for s in students.items],
        'total': students.total,
        'pages': students.pages
    }), 200


# ── Announcements ─────────────────────────────────────────────────────────────

@admin_bp.route('/announcements', methods=['GET'])
@jwt_required()
def get_announcements():
    """Get all announcements"""
    err = require_admin()
    if err: return err
    
    anns = Announcement.query.order_by(Announcement.created_at.desc()).all()
    return jsonify([a.to_dict() for a in anns]), 200


@admin_bp.route('/announcements', methods=['POST'])
@jwt_required()
def create_announcement():
    """Create a new announcement"""
    err = require_admin()
    if err: return err
    
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    data = request.get_json()
    
    ann = Announcement(
        title=data['title'],
        content=data['content'],
        created_by=int(user_id),
        target_roles=data.get('target_roles', 'all'),
        is_active=True
    )
    db.session.add(ann)
    db.session.commit()
    
    return jsonify({'message': 'Announcement created', 'announcement': ann.to_dict()}), 201


@admin_bp.route('/announcements/<int:ann_id>', methods=['DELETE'])
@jwt_required()
def delete_announcement(ann_id):
    """Delete announcement"""
    err = require_admin()
    if err: return err
    
    ann = Announcement.query.get_or_404(ann_id)
    db.session.delete(ann)
    db.session.commit()
    return jsonify({'message': 'Deleted'}), 200


# ── ML Insights ───────────────────────────────────────────────────────────────

@admin_bp.route('/ml-insights', methods=['GET'])
@jwt_required()
def get_ml_insights():
    """Admin ML insights dashboard"""
    err = require_admin()
    if err: return err
    
    predictions = MLPrediction.query.all()
    
    # Overall distribution
    dist = {'slow': 0, 'average': 0, 'fast': 0}
    for p in predictions:
        if p.prediction_label in dist:
            dist[p.prediction_label] += 1
    
    # By grade
    grade_breakdown = []
    for g in Grade.query.filter(Grade.grade_number >= 6).order_by(Grade.grade_number).all():
        students_in_grade = db.session.execute(
            db.select(Student.id)
            .join(Enrollment, Enrollment.student_id == Student.id)
            .join(Section, Section.id == Enrollment.section_id)
            .where(Section.grade_id == g.id)
            .where(Enrollment.is_current == True)
        ).scalars().all()
        
        g_preds = MLPrediction.query.filter(MLPrediction.student_id.in_(students_in_grade)).all()
        g_dist = {'slow': 0, 'average': 0, 'fast': 0}
        for p in g_preds:
            if p.prediction_label in g_dist:
                g_dist[p.prediction_label] += 1
        
        grade_breakdown.append({
            'grade': g.name,
            **g_dist,
            'total': len(g_preds)
        })
    
    # Recent predictions
    recent = MLPrediction.query.order_by(MLPrediction.predicted_at.desc()).limit(10).all()
    recent_data = []
    for p in recent:
        s = Student.query.get(p.student_id)
        recent_data.append({
            'student_name': s.user.full_name if s and s.user else 'Unknown',
            'label': p.prediction_label,
            'confidence': p.confidence_score,
            'predicted_at': p.predicted_at.isoformat()
        })
    
    return jsonify({
        'overall_distribution': dist,
        'grade_breakdown': grade_breakdown,
        'recent_predictions': recent_data,
        'total_predictions': len(predictions)
    }), 200


@admin_bp.route('/analytics/performance', methods=['GET'])
@jwt_required()
def get_performance_analytics():
    """School-wide performance analytics"""
    err = require_admin()
    if err: return err
    
    from models import Subject
    
    # Average marks by subject
    subject_performance = []
    for subj in Subject.query.all():
        avg = db.session.execute(
            db.select(db.func.avg(GradeRecord.marks_obtained / GradeRecord.max_marks * 100))
            .where(GradeRecord.subject_id == subj.id)
        ).scalar()
        subject_performance.append({
            'subject': subj.name,
            'average': round(avg or 0, 2)
        })
    
    # Grade-wise average performance
    grade_performance = []
    for g in Grade.query.order_by(Grade.grade_number).all():
        students = db.session.execute(
            db.select(Student.id)
            .join(Enrollment, Enrollment.student_id == Student.id)
            .join(Section, Section.id == Enrollment.section_id)
            .where(Section.grade_id == g.id)
        ).scalars().all()
        
        if students:
            avg = db.session.execute(
                db.select(db.func.avg(GradeRecord.marks_obtained / GradeRecord.max_marks * 100))
                .where(GradeRecord.student_id.in_(students))
            ).scalar()
            grade_performance.append({'grade': g.name, 'average': round(avg or 0, 2)})
    
    return jsonify({
        'subject_performance': subject_performance,
        'grade_performance': grade_performance
    }), 200
