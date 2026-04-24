/**
 * API Client for School Management System
 * Handles JWT auth, request/response interceptors
 */

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor - attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth helpers
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  me: () => api.get('/auth/me'),
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

// Auth state helpers
export const getUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
};

export const isAuthenticated = () => !!getToken();

export const setAuth = (token: string, user: any) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
};

// Role-based API endpoints
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params?: any) => api.get('/admin/users', { params }),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  grades: () => api.get('/admin/grades'),
  subjects: () => api.get('/admin/subjects'),
  teachers: () => api.get('/admin/teachers'),
  students: (params?: any) => api.get('/admin/students', { params }),
  announcements: () => api.get('/admin/announcements'),
  createAnnouncement: (data: any) => api.post('/admin/announcements', data),
  deleteAnnouncement: (id: number) => api.delete(`/admin/announcements/${id}`),
  mlInsights: () => api.get('/admin/ml-insights'),
  performanceAnalytics: () => api.get('/admin/analytics/performance'),
};

export const teacherApi = {
  dashboard: () => api.get('/teacher/dashboard'),
  sectionStudents: (sectionId: number) => api.get(`/teacher/sections/${sectionId}/students`),
  getAttendance: (sectionId: number, date: string) =>
    api.get('/teacher/attendance', { params: { section_id: sectionId, date } }),
  markAttendance: (data: any) => api.post('/teacher/attendance', data),
  addGrade: (data: any) => api.post('/teacher/grades', data),
  sectionGrades: (sectionId: number, params?: any) =>
    api.get(`/teacher/grades/${sectionId}`, { params }),
  assignments: () => api.get('/teacher/assignments'),
  createAssignment: (data: any) => api.post('/teacher/assignments', data),
  performance: (sectionId: number) => api.get(`/teacher/performance/${sectionId}`),
  mlGrouping: (sectionId: number) => api.get(`/teacher/ml-grouping/${sectionId}`),
  addRemark: (data: any) => api.post('/teacher/remarks', data),
  subjects: () => api.get('/teacher/subjects'),
};

export const studentApi = {
  dashboard: () => api.get('/student/dashboard'),
  grades: () => api.get('/student/grades'),
  attendance: () => api.get('/student/attendance'),
  assignments: () => api.get('/student/assignments'),
  announcements: () => api.get('/student/announcements'),
};

export const parentApi = {
  dashboard: () => api.get('/parent/dashboard'),
  childAttendance: () => api.get('/parent/child/attendance'),
  childGrades: () => api.get('/parent/child/grades'),
  announcements: () => api.get('/parent/announcements'),
};

export const aiApi = {
  chat: (message: string, history: any[] = []) =>
    api.post('/ai/chat', { message, history }),
};
