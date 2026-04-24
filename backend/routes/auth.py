"""
Authentication Routes - Login, Logout, Token Refresh
JWT-based authentication for all user roles
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, jwt_required,
    get_jwt_identity, get_jwt
)
from datetime import datetime
from models import db, User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return JWT tokens"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400
    
    # Find user by username or email
    user = User.query.filter(
        (User.username == data['username']) | (User.email == data['username'])
    ).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated. Contact admin.'}), 403
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Create tokens with role in additional claims
    additional_claims = {'role': user.role, 'full_name': user.full_name}
    access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=str(user.id))
    
    # Get role-specific profile ID
    profile_id = None
    if user.role == 'teacher' and user.teacher_profile:
        profile_id = user.teacher_profile.id
    elif user.role == 'student' and user.student_profile:
        profile_id = user.student_profile.id
    elif user.role == 'parent' and user.parent_profile:
        profile_id = user.parent_profile.id
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': {
            **user.to_dict(),
            'profile_id': profile_id
        }
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token"""
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    
    if not user or not user.is_active:
        return jsonify({'error': 'Invalid token'}), 401
    
    additional_claims = {'role': user.role, 'full_name': user.full_name}
    access_token = create_access_token(identity=identity, additional_claims=additional_claims)
    
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get currently authenticated user's profile"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    profile_id = None
    extra = {}
    
    if user.role == 'teacher' and user.teacher_profile:
        profile_id = user.teacher_profile.id
        extra = {'employee_id': user.teacher_profile.employee_id}
    elif user.role == 'student' and user.student_profile:
        profile_id = user.student_profile.id
        extra = {'admission_number': user.student_profile.admission_number}
    elif user.role == 'parent' and user.parent_profile:
        profile_id = user.parent_profile.id
    
    return jsonify({**user.to_dict(), 'profile_id': profile_id, **extra}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    data = request.get_json()
    
    if not user.check_password(data.get('current_password', '')):
        return jsonify({'error': 'Current password is incorrect'}), 400
    
    if len(data.get('new_password', '')) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    return jsonify({'message': 'Password changed successfully'}), 200
