"""
Authentication utilities using PyJWT directly.
No flask-jwt-extended needed.
"""

import jwt
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, g

SECRET_KEY = os.environ.get('SECRET_KEY', 'vidya-jyothi-secret-key-2024')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_HOURS = 24


def hash_password(password: str) -> str:
    """Hash a password using SHA-256 with salt."""
    salt = 'vidya_jyothi_salt_2024'
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


def check_password(password: str, password_hash: str) -> bool:
    """Verify password against stored hash."""
    return hash_password(password) == password_hash


def create_access_token(user_id: int, role: str, full_name: str) -> str:
    """Create a JWT access token."""
    payload = {
        'sub': str(user_id),
        'role': role,
        'full_name': full_name,
        'exp': datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])


def get_token_from_request() -> str | None:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:]
    return None


def jwt_required(f):
    """Decorator: require valid JWT token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({'error': 'Authorization token required'}), 401
        try:
            payload = decode_token(token)
            g.user_id = int(payload['sub'])
            g.user_role = payload['role']
            g.user_name = payload.get('full_name', '')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired. Please login again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


def require_role(*roles):
    """Decorator: require specific role(s)."""
    def decorator(f):
        @wraps(f)
        @jwt_required
        def decorated(*args, **kwargs):
            if g.user_role not in roles:
                return jsonify({'error': f'Access denied. Required role: {", ".join(roles)}'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


def cors_headers(response):
    """Add CORS headers to all responses."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response
