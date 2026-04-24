"""
Teacher Routes - Attendance, Grades, Assignments, ML insights
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from models import (
    db, User, Teacher, Student, Section, Subject, TeacherAssignment,
    Enrollment, Attendance, GradeRecord, Assignment, MLPrediction,
    TeacherRemark, Announcement
)
from datetime import datetime, date, timedelta
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

teacher_bp = Blueprint('teacher', __name__)
student_bp = Blueprint('student', __name__)
parent_bp = Blueprint('parent', __name__)


def get_teacher(user_id):
    user = User.query.get(int(user_id))
    return user.teacher_profile if user else None


def get_student_obj(user_id):
    user = User.query.get(int(user_id))
    return user.student_profile if user else None


# ═══════════════════════════════════════════════════════════
# TEACHER ROUTES
# ═══════════════════════════════════════════════════════════

@teacher_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def teacher_dashboard():
    """Teacher dashboard overview"""
    user_id = get_jwt_identity()
    teacher = get_teacher(user_id)
    if not teacher:
        return jsonify({'error': 'Teacher not found'}), 404
    
    # Get teacher's sections
    assignments = TeacherAssignment.query.filter_by(teacher_id=teacher.id).all()
    section_ids = list(set(a.section_id for a in assignments))
    
    # Count students in teacher's sections
    total_students = Enrollment.query.filter(
        Enrollment.section_id.in_(section_ids), Enrollment.is_current == True
    ).count()
    
    # Today's attendance percentage
    today = date.today()
    today_present = Attendance.query.filter(
        Attendance.section_id.in_(section_ids),
        Attendance.date == today,
        Attendance.status == 'present'
    ).count()
    today_total = Attendance.query.filter(
        Attendance.section_id.in_(section_ids),
        Attendance.date == today
    ).count()
    att_pct = round(today_present / today_total * 100, 1) if today_total > 0 else 0
    
    # Pending assignments
    pending_assignments = Assignment.query.filter(
        Assignment.teacher_id == teacher.id,
        Assignment.due_date > datetime.utcnow()
    ).count()
    
    # Sections info
    sections = Section.query.filter(Section.id.in_(section_ids)).all()
    sections_data = []
    for s in sections:
        student_count = Enrollment.query.filter_by(section_id=s.id, is_current=True).count()
        sections_data.append({
            'id': s.id,
            'grade': s.grade.grade_number,
            'section': s.section_name,
            'name': f"Grade {s.grade.grade_number} - {s.section_name}",
            'student_count': student_count
        })
    
    # Recent grades entered
    recent_grades = GradeRecord.query.filter_by(teacher_id=teacher.id)\
        .order_by(GradeRecord.created_at.desc()).limit(5).all()
    
    return jsonify({
        'stats': {
            'total_students': total_students,
            'total_sections': len(section_ids),
            'today_attendance_pct': att_pct,
            'pending_assignments': pending_assignments,
            'subjects_teaching': len(set(a.subject_id for a in assignments))
        },
        'sections': sections_data,
        'recent_grades': [gr.to_dict() for gr in recent_grades]
    }), 200


@teacher_bp.route('/sections/<int:section_id>/students', methods=['GET'])
@jwt_required()
def get_section_students(section_id):
    """Get students in a specific section"""
    user_id = get_jwt_identity()
    teacher = get_teacher(user_id)
    
    enrollments = Enrollment.query.filter_by(section_id=section_id, is_current=True)\
        .order_by(Enrollment.roll_number).all()
    
    students = []
    for en in enrollments:
        s = en.student
        if not s:
            continue
        
        # Attendance stats
        total_att = Attendance.query.filter_by(student_id=s.id).count()
        present = Attendance.query.filter_by(student_id=s.id, status='present').count()
        att_pct = round(present / total_att * 100, 1) if total_att > 0 else 0
        
        # Average marks
        grades = GradeRecord.query.filter_by(student_id=s.id, section_id=section_id).all()
        avg = round(sum(g.marks_obtained / g.max_marks * 100 for g in grades if g.max_marks > 0) / len(grades), 1) if grades else 0
        
        students.append({
            'id': s.id,
            'full_name': s.user.full_name,
            'admission_number': s.admission_number,
            'gender': s.gender,
            'roll_number': en.roll_number,
            'attendance_pct': att_pct,
            'average_marks': avg
        })
    
    section = Section.query.get(section_id)
    return jsonify({
        'section': section.to_dict() if section else None,
        'students': students
    }), 200


@teacher_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    """Get attendance for a section on a specific date"""
    section_id = request.args.get('section_id', type=int)
    att_date = request.args.get('date', date.today().isoformat())
    
    try:
        att_date = date.fromisoformat(att_date)
    except:
        att_date = date.today()
    
    enrollments = Enrollment.query.filter_by(section_id=section_id, is_current=True).all()
    result = []
    
    for en in enrollments:
        s = en.student
        att = Attendance.query.filter_by(student_id=s.id, section_id=section_id, date=att_date).first()
        result.append({
            'student_id': s.id,
            'student_name': s.user.full_name,
            'roll_number': en.roll_number,
            'status': att.status if att else 'not_marked',
            'attendance_id': att.id if att else None
        })
    
    return jsonify(result), 200


@teacher_bp.route('/attendance', methods=['POST'])
@jwt_required()
def mark_attendance():
    """Mark attendance for multiple students"""
    user_id = get_jwt_identity()
    data = request.get_json()
    section_id = data.get('section_id')
    att_date = date.fromisoformat(data.get('date', date.today().isoformat()))
    attendance_data = data.get('attendance', [])
    
    for item in attendance_data:
        existing = Attendance.query.filter_by(
            student_id=item['student_id'], section_id=section_id, date=att_date
        ).first()
        
        if existing:
            existing.status = item['status']
        else:
            att = Attendance(
                student_id=item['student_id'],
                section_id=section_id,
                date=att_date,
                status=item['status'],
                marked_by=int(user_id)
            )
            db.session.add(att)
    
    db.session.commit()
    return jsonify({'message': f'Attendance marked for {len(attendance_data)} students'}), 200


@teacher_bp.route('/grades', methods=['POST'])
@jwt_required()
def add_grade():
    """Add a grade record"""
    user_id = get_jwt_identity()
    teacher = get_teacher(user_id)
    data = request.get_json()
    
    gr = GradeRecord(
        student_id=data['student_id'],
        subject_id=data['subject_id'],
        section_id=data['section_id'],
        teacher_id=teacher.id,
        exam_type=data['exam_type'],
        marks_obtained=data['marks_obtained'],
        max_marks=data['max_marks'],
        exam_date=date.fromisoformat(data['exam_date']) if data.get('exam_date') else date.today(),
        remarks=data.get('remarks', '')
    )
    db.session.add(gr)
    db.session.commit()
    
    return jsonify({'message': 'Grade recorded', 'grade': gr.to_dict()}), 201


@teacher_bp.route('/grades/<int:section_id>', methods=['GET'])
@jwt_required()
def get_section_grades(section_id):
    """Get grades for all students in a section"""
    subject_id = request.args.get('subject_id', type=int)
    exam_type = request.args.get('exam_type')
    
    query = GradeRecord.query.filter_by(section_id=section_id)
    if subject_id:
        query = query.filter_by(subject_id=subject_id)
    if exam_type:
        query = query.filter_by(exam_type=exam_type)
    
    grades = query.all()
    return jsonify([g.to_dict() for g in grades]), 200


@teacher_bp.route('/assignments', methods=['GET', 'POST'])
@jwt_required()
def assignments():
    """Get or create assignments"""
    user_id = get_jwt_identity()
    teacher = get_teacher(user_id)
    
    if request.method == 'GET':
        asgns = Assignment.query.filter_by(teacher_id=teacher.id)\
            .order_by(Assignment.created_at.desc()).all()
        return jsonify([a.to_dict() for a in asgns]), 200
    
    else:  # POST
        data = request.get_json()
        asgn = Assignment(
            title=data['title'],
            description=data.get('description', ''),
            subject_id=data['subject_id'],
            section_id=data['section_id'],
            teacher_id=teacher.id,
            due_date=datetime.fromisoformat(data['due_date']) if data.get('due_date') else None,
            max_marks=data.get('max_marks', 10)
        )
        db.session.add(asgn)
        db.session.commit()
        return jsonify({'message': 'Assignment created', 'assignment': asgn.to_dict()}), 201


@teacher_bp.route('/performance/<int:section_id>', methods=['GET'])
@jwt_required()
def section_performance(section_id):
    """Performance analytics for a section"""
    enrollments = Enrollment.query.filter_by(section_id=section_id, is_current=True).all()
    student_ids = [e.student_id for e in enrollments]
    
    # Subject-wise averages
    subject_avgs = []
    for subj in Subject.query.all():
        grades = GradeRecord.query.filter(
            GradeRecord.student_id.in_(student_ids),
            GradeRecord.subject_id == subj.id,
            GradeRecord.section_id == section_id
        ).all()
        if grades:
            avg = sum(g.marks_obtained / g.max_marks * 100 for g in grades if g.max_marks > 0) / len(grades)
            subject_avgs.append({'subject': subj.name, 'average': round(avg, 2)})
    
    # Student performance ranking
    student_ranks = []
    for en in enrollments:
        s = en.student
        grades = GradeRecord.query.filter_by(student_id=s.id, section_id=section_id).all()
        avg = sum(g.marks_obtained / g.max_marks * 100 for g in grades if g.max_marks > 0) / len(grades) if grades else 0
        student_ranks.append({
            'name': s.user.full_name,
            'average': round(avg, 2)
        })
    student_ranks.sort(key=lambda x: x['average'], reverse=True)
    
    return jsonify({
        'subject_averages': subject_avgs,
        'student_ranking': student_ranks[:10]
    }), 200


@teacher_bp.route('/ml-grouping/<int:section_id>', methods=['GET'])
@jwt_required()
def ml_grouping(section_id):
    """ML-based student grouping for teacher view"""
    section = Section.query.get_or_404(section_id)
    
    if section.grade.grade_number < 6:
        return jsonify({'error': 'ML insights available only for Grades 6-12', 'available': False}), 200
    
    enrollments = Enrollment.query.filter_by(section_id=section_id, is_current=True).all()
    student_ids = [e.student_id for e in enrollments]
    
    groups = {'slow': [], 'average': [], 'fast': []}
    
    for sid in student_ids:
        pred = MLPrediction.query.filter_by(student_id=sid).order_by(MLPrediction.predicted_at.desc()).first()
        student = Student.query.get(sid)
        if not student or not pred:
            continue
        
        entry = {
            'student_id': sid,
            'student_name': student.user.full_name,
            'confidence': pred.confidence_score,
            'recommendation': pred.recommendation
        }
        
        if pred.prediction_label in groups:
            groups[pred.prediction_label].append(entry)
    
    return jsonify({
        'available': True,
        'section': f"Grade {section.grade.grade_number} - {section.section_name}",
        'groups': groups,
        'distribution': {k: len(v) for k, v in groups.items()}
    }), 200


@teacher_bp.route('/remarks', methods=['POST'])
@jwt_required()
def add_remark():
    """Add teacher remark for a student"""
    user_id = get_jwt_identity()
    teacher = get_teacher(user_id)
    data = request.get_json()
    
    remark = TeacherRemark(
        student_id=data['student_id'],
        teacher_id=teacher.id,
        remark=data['remark'],
        category=data.get('category', 'general')
    )
    db.session.add(remark)
    db.session.commit()
    return jsonify({'message': 'Remark added'}), 201


@teacher_bp.route('/subjects', methods=['GET'])
@jwt_required()
def get_teacher_subjects():
    """Get subjects taught by teacher"""
    user_id = get_jwt_identity()
    teacher = get_teacher(user_id)
    if not teacher:
        return jsonify([]), 200
    
    assignments = TeacherAssignment.query.filter_by(teacher_id=teacher.id).all()
    subjects = {}
    for a in assignments:
        if a.subject_id not in subjects:
            subjects[a.subject_id] = a.subject.to_dict()
    
    return jsonify(list(subjects.values())), 200


# ═══════════════════════════════════════════════════════════
# STUDENT ROUTES
# ═══════════════════════════════════════════════════════════

@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def student_dashboard():
    """Student dashboard overview"""
    user_id = get_jwt_identity()
    student = get_student_obj(user_id)
    if not student:
        return jsonify({'error': 'Student profile not found'}), 404
    
    enrollment = Enrollment.query.filter_by(student_id=student.id, is_current=True).first()
    
    # Attendance
    total_att = Attendance.query.filter_by(student_id=student.id).count()
    present = Attendance.query.filter_by(student_id=student.id, status='present').count()
    att_pct = round(present / total_att * 100, 1) if total_att > 0 else 0
    
    # Subject-wise marks
    subject_marks = []
    for subj in Subject.query.all():
        grades = GradeRecord.query.filter_by(student_id=student.id, subject_id=subj.id).all()
        if grades:
            avg = sum(g.marks_obtained / g.max_marks * 100 for g in grades if g.max_marks > 0) / len(grades)
            subject_marks.append({'subject': subj.name, 'average': round(avg, 2)})
    
    overall_avg = round(sum(s['average'] for s in subject_marks) / len(subject_marks), 2) if subject_marks else 0
    
    # ML recommendation (NO labels shown to student)
    pred = MLPrediction.query.filter_by(student_id=student.id)\
        .order_by(MLPrediction.predicted_at.desc()).first()
    recommendation = pred.recommendation if pred else None
    
    # Upcoming assignments
    if enrollment:
        upcoming = Assignment.query.filter(
            Assignment.section_id == enrollment.section_id,
            Assignment.due_date > datetime.utcnow()
        ).order_by(Assignment.due_date).limit(5).all()
    else:
        upcoming = []
    
    return jsonify({
        'student': student.to_dict(),
        'stats': {
            'attendance_pct': att_pct,
            'overall_average': overall_avg,
            'total_days_present': present,
            'total_days_tracked': total_att
        },
        'subject_performance': subject_marks,
        'recommendation': recommendation,
        'upcoming_assignments': [a.to_dict() for a in upcoming]
    }), 200


@student_bp.route('/grades', methods=['GET'])
@jwt_required()
def get_my_grades():
    """Get all grades for current student"""
    user_id = get_jwt_identity()
    student = get_student_obj(user_id)
    if not student:
        return jsonify({'error': 'Not found'}), 404
    
    grades = GradeRecord.query.filter_by(student_id=student.id)\
        .order_by(GradeRecord.exam_date.desc()).all()
    
    return jsonify([g.to_dict() for g in grades]), 200


@student_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_my_attendance():
    """Get attendance history for current student"""
    user_id = get_jwt_identity()
    student = get_student_obj(user_id)
    if not student:
        return jsonify({'error': 'Not found'}), 404
    
    records = Attendance.query.filter_by(student_id=student.id)\
        .order_by(Attendance.date.desc()).limit(60).all()
    
    total = len(records)
    present = sum(1 for r in records if r.status == 'present')
    att_pct = round(present / total * 100, 1) if total > 0 else 0
    
    return jsonify({
        'attendance_pct': att_pct,
        'total_days': total,
        'present_days': present,
        'records': [r.to_dict() for r in records]
    }), 200


@student_bp.route('/assignments', methods=['GET'])
@jwt_required()
def get_my_assignments():
    """Get assignments for student's section"""
    user_id = get_jwt_identity()
    student = get_student_obj(user_id)
    if not student:
        return jsonify({'error': 'Not found'}), 404
    
    enrollment = Enrollment.query.filter_by(student_id=student.id, is_current=True).first()
    if not enrollment:
        return jsonify([]), 200
    
    assignments = Assignment.query.filter_by(section_id=enrollment.section_id)\
        .order_by(Assignment.due_date).all()
    
    return jsonify([a.to_dict() for a in assignments]), 200


@student_bp.route('/announcements', methods=['GET'])
@jwt_required()
def get_student_announcements():
    """Get announcements for students"""
    anns = Announcement.query.filter(
        Announcement.is_active == True,
        (Announcement.target_roles == 'all') | (Announcement.target_roles == 'student')
    ).order_by(Announcement.created_at.desc()).limit(10).all()
    
    return jsonify([a.to_dict() for a in anns]), 200


# ═══════════════════════════════════════════════════════════
# PARENT ROUTES
# ═══════════════════════════════════════════════════════════

@parent_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def parent_dashboard():
    """Parent dashboard - child's overview"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user or not user.parent_profile:
        return jsonify({'error': 'Parent not found'}), 404
    
    parent = user.parent_profile
    children = Student.query.filter_by(parent_id=parent.id).all()
    
    if not children:
        return jsonify({'error': 'No children found'}), 404
    
    child = children[0]  # Primary child
    
    # Attendance
    total_att = Attendance.query.filter_by(student_id=child.id).count()
    present = Attendance.query.filter_by(student_id=child.id, status='present').count()
    att_pct = round(present / total_att * 100, 1) if total_att > 0 else 0
    
    # Subject marks
    subject_marks = []
    for subj in Subject.query.all():
        grades = GradeRecord.query.filter_by(student_id=child.id, subject_id=subj.id).all()
        if grades:
            avg = sum(g.marks_obtained / g.max_marks * 100 for g in grades if g.max_marks > 0) / len(grades)
            subject_marks.append({'subject': subj.name, 'average': round(avg, 2)})
    
    overall_avg = round(sum(s['average'] for s in subject_marks) / len(subject_marks), 2) if subject_marks else 0
    
    # Teacher remarks
    from models import TeacherRemark
    remarks = TeacherRemark.query.filter_by(student_id=child.id)\
        .order_by(TeacherRemark.created_at.desc()).limit(5).all()
    
    # Announcements
    anns = Announcement.query.filter(
        Announcement.is_active == True,
        (Announcement.target_roles == 'all') | (Announcement.target_roles == 'parent')
    ).order_by(Announcement.created_at.desc()).limit(5).all()
    
    return jsonify({
        'child': child.to_dict(),
        'stats': {
            'attendance_pct': att_pct,
            'overall_average': overall_avg,
            'present_days': present,
            'total_days': total_att
        },
        'subject_performance': subject_marks,
        'teacher_remarks': [r.to_dict() for r in remarks],
        'announcements': [a.to_dict() for a in anns]
    }), 200


@parent_bp.route('/child/attendance', methods=['GET'])
@jwt_required()
def child_attendance():
    """View child's attendance records"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    parent = user.parent_profile if user else None
    
    if not parent:
        return jsonify({'error': 'Not found'}), 404
    
    children = Student.query.filter_by(parent_id=parent.id).all()
    if not children:
        return jsonify({'error': 'No children found'}), 404
    
    child = children[0]
    records = Attendance.query.filter_by(student_id=child.id)\
        .order_by(Attendance.date.desc()).limit(60).all()
    
    total = len(records)
    present = sum(1 for r in records if r.status == 'present')
    
    return jsonify({
        'attendance_pct': round(present / total * 100, 1) if total else 0,
        'records': [r.to_dict() for r in records]
    }), 200


@parent_bp.route('/child/grades', methods=['GET'])
@jwt_required()
def child_grades():
    """View child's grade records"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    parent = user.parent_profile if user else None
    
    if not parent:
        return jsonify({'error': 'Not found'}), 404
    
    children = Student.query.filter_by(parent_id=parent.id).all()
    if not children:
        return jsonify([]), 200
    
    child = children[0]
    grades = GradeRecord.query.filter_by(student_id=child.id)\
        .order_by(GradeRecord.exam_date.desc()).all()
    
    return jsonify([g.to_dict() for g in grades]), 200


@parent_bp.route('/announcements', methods=['GET'])
@jwt_required()
def parent_announcements():
    """Get announcements for parents"""
    anns = Announcement.query.filter(
        Announcement.is_active == True,
        (Announcement.target_roles == 'all') | (Announcement.target_roles == 'parent')
    ).order_by(Announcement.created_at.desc()).all()
    
    return jsonify([a.to_dict() for a in anns]), 200
