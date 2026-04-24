"""
Machine Learning Module for Student Learning Pace Prediction
Uses Random Forest Classifier (scikit-learn)
Applies only to students in Grades 6-12
"""

import numpy as np
import pandas as pd
import json
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml_model.joblib')
SCALER_PATH = os.path.join(os.path.dirname(__file__), 'ml_scaler.joblib')


def extract_features(student_id, db):
    """
    Extract ML features for a given student from the database
    Features: login_frequency, study_time, resource_access, attendance_pct, avg_marks
    """
    from models import (
        Student, EngagementMetric, Attendance, GradeRecord, Enrollment
    )
    
    student = Student.query.get(student_id)
    if not student:
        return None
    
    # Engagement metrics
    em = EngagementMetric.query.filter_by(student_id=student_id).first()
    login_count = em.login_count if em else 10
    study_time = em.study_time_hours if em else 2.0
    resource_access = em.resource_access_count if em else 10
    
    # Attendance percentage
    total_att = Attendance.query.filter_by(student_id=student_id).count()
    present_att = Attendance.query.filter_by(student_id=student_id, status='present').count()
    late_att = Attendance.query.filter_by(student_id=student_id, status='late').count()
    attendance_pct = ((present_att + late_att * 0.5) / total_att * 100) if total_att > 0 else 75.0
    
    # Average marks
    grade_records = GradeRecord.query.filter_by(student_id=student_id).all()
    if grade_records:
        avg_marks = np.mean([
            (gr.marks_obtained / gr.max_marks * 100) for gr in grade_records if gr.max_marks > 0
        ])
    else:
        avg_marks = 60.0
    
    return {
        'login_count': login_count,
        'study_time_hours': study_time,
        'resource_access_count': resource_access,
        'attendance_percentage': round(attendance_pct, 2),
        'average_marks': round(avg_marks, 2)
    }


def generate_training_data(n_samples=1000):
    """
    Generate synthetic training data for model training
    Reflects realistic student performance patterns
    """
    np.random.seed(42)
    
    data = []
    for _ in range(n_samples):
        # Random base performance level
        level = np.random.choice(['slow', 'average', 'fast'], p=[0.25, 0.50, 0.25])
        
        if level == 'slow':
            login_count = np.random.randint(5, 20)
            study_time = np.random.uniform(0.5, 2.0)
            resource_access = np.random.randint(2, 15)
            attendance_pct = np.random.uniform(60, 80)
            avg_marks = np.random.uniform(30, 55)
        elif level == 'average':
            login_count = np.random.randint(15, 35)
            study_time = np.random.uniform(1.5, 4.0)
            resource_access = np.random.randint(10, 35)
            attendance_pct = np.random.uniform(75, 90)
            avg_marks = np.random.uniform(55, 78)
        else:  # fast
            login_count = np.random.randint(30, 50)
            study_time = np.random.uniform(3.5, 7.0)
            resource_access = np.random.randint(30, 65)
            attendance_pct = np.random.uniform(88, 100)
            avg_marks = np.random.uniform(78, 100)
        
        # Add noise
        noise = np.random.normal(0, 0.05)
        data.append({
            'login_count': max(0, login_count + np.random.randint(-3, 3)),
            'study_time_hours': max(0, study_time + noise),
            'resource_access_count': max(0, resource_access + np.random.randint(-2, 2)),
            'attendance_percentage': min(100, max(0, attendance_pct + np.random.uniform(-3, 3))),
            'average_marks': min(100, max(0, avg_marks + np.random.uniform(-5, 5))),
            'label': level
        })
    
    return pd.DataFrame(data)


def train_model():
    """Train the Random Forest classifier and save it"""
    print("🤖 Training ML model...")
    
    df = generate_training_data(1500)
    
    feature_cols = ['login_count', 'study_time_hours', 'resource_access_count',
                    'attendance_percentage', 'average_marks']
    
    X = df[feature_cols].values
    y = df['label'].values
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        class_weight='balanced'
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"   Model Accuracy: {accuracy:.3f}")
    
    # Save model and scaler
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    
    # Feature importances
    importances = dict(zip(feature_cols, model.feature_importances_))
    print(f"   Feature Importances: {importances}")
    
    return model, scaler, importances


def load_model():
    """Load trained model and scaler from disk"""
    if not os.path.exists(MODEL_PATH):
        return train_model()[:2]
    
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    return model, scaler


def predict_student(student_id, db):
    """
    Make a prediction for a specific student
    Returns: label, confidence, feature_importance, recommendation
    """
    from models import Student, Enrollment, Grade
    
    # Verify student is in Grade 6-12
    student = Student.query.get(student_id)
    if not student:
        return None
    
    enrollment = Enrollment.query.filter_by(student_id=student_id, is_current=True).first()
    if not enrollment:
        return None
    
    grade_num = enrollment.section.grade.grade_number
    if grade_num < 6:
        return {'error': 'ML predictions only available for Grades 6-12'}
    
    # Extract features
    features = extract_features(student_id, db)
    if not features:
        return None
    
    # Load model
    model, scaler = load_model()
    
    feature_cols = ['login_count', 'study_time_hours', 'resource_access_count',
                    'attendance_percentage', 'average_marks']
    
    X = np.array([[features[c] for c in feature_cols]])
    X_scaled = scaler.transform(X)
    
    # Predict
    label = model.predict(X_scaled)[0]
    probas = model.predict_proba(X_scaled)[0]
    confidence = float(max(probas))
    
    # Feature importance for this prediction
    importances = dict(zip(feature_cols, model.feature_importances_))
    
    # Role-specific recommendations
    recommendations = {
        'slow': (
            "Focus on building strong foundational skills. Break study sessions into smaller, "
            "manageable chunks of 30-45 minutes. Review previous chapters before moving forward. "
            "Use visual aids and diagrams to understand complex topics. Don't hesitate to ask "
            "your teachers for extra help — that's exactly what they're there for!"
        ),
        'average': (
            "You're on the right track! To push further, try practicing additional problems "
            "beyond what's assigned. Set specific weekly study goals and track your progress. "
            "Explore supplementary resources like videos and reference books to deepen your "
            "understanding. With consistent effort, excellence is within reach!"
        ),
        'fast': (
            "Outstanding progress! You're excelling in your studies. Challenge yourself with "
            "advanced-level problems and olympiad-style questions. Consider exploring topics "
            "beyond the textbook to fuel your curiosity. You also have an opportunity to help "
            "classmates, which will reinforce your own understanding!"
        )
    }
    
    return {
        'label': label,
        'confidence': confidence,
        'features': features,
        'feature_importance': importances,
        'recommendation': recommendations[label],
        'grade': grade_num
    }


def predict_batch(student_ids, db):
    """Predict for multiple students (for teacher/admin view)"""
    results = {}
    for sid in student_ids:
        result = predict_student(sid, db)
        if result and 'error' not in result:
            results[sid] = result
    return results


def get_class_insights(section_id, db):
    """
    Get ML insights for all students in a section (for teacher dashboard)
    Returns: distribution of learner types, top features affecting performance
    """
    from models import Enrollment, Student
    
    enrollments = Enrollment.query.filter_by(section_id=section_id, is_current=True).all()
    student_ids = [e.student_id for e in enrollments]
    
    predictions = predict_batch(student_ids, db)
    
    distribution = {'slow': 0, 'average': 0, 'fast': 0}
    classified_students = []
    
    for sid, pred in predictions.items():
        label = pred['label']
        distribution[label] += 1
        
        student = Student.query.get(sid)
        classified_students.append({
            'student_id': sid,
            'student_name': student.user.full_name if student and student.user else 'Unknown',
            'label': label,
            'confidence': pred['confidence'],
            'avg_marks': pred['features']['average_marks'],
            'attendance': pred['features']['attendance_percentage'],
            'recommendation': pred['recommendation']
        })
    
    return {
        'distribution': distribution,
        'students': classified_students,
        'total': len(predictions)
    }
