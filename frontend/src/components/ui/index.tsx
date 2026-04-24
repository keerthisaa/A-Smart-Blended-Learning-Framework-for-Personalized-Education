'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, ClipboardList,
  BarChart3, Bell, Brain, LogOut, Menu, X, ChevronRight,
  CalendarCheck, FileText, MessageSquare, Settings, Award,
  TrendingUp, Home, ChevronDown, User
} from 'lucide-react';
import { clearAuth, getUser } from '@/lib/api';

// ─── Toast Context ──────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: string; message: string; type: ToastType; }

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
}>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-amber-500',
  };

  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-lg text-sm font-medium max-w-sm ${colors[t.type]}`}>
            <span className="text-base">{icons[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Nav Config per Role ────────────────────────────────────────────────────

const navConfig = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/admin' },
    { icon: Users, label: 'User Management', href: '/dashboard/admin/users' },
    { icon: BookOpen, label: 'Classes & Sections', href: '/dashboard/admin/classes' },
    { icon: FileText, label: 'Subjects', href: '/dashboard/admin/subjects' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/admin/analytics' },
    { icon: Brain, label: 'ML Insights', href: '/dashboard/admin/ml-insights' },
    { icon: Bell, label: 'Announcements', href: '/dashboard/admin/announcements' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/teacher' },
    { icon: Users, label: 'My Students', href: '/dashboard/teacher/students' },
    { icon: CalendarCheck, label: 'Attendance', href: '/dashboard/teacher/attendance' },
    { icon: Award, label: 'Grades', href: '/dashboard/teacher/grades' },
    { icon: ClipboardList, label: 'Assignments', href: '/dashboard/teacher/assignments' },
    { icon: TrendingUp, label: 'Performance', href: '/dashboard/teacher/performance' },
    { icon: Brain, label: 'ML Grouping', href: '/dashboard/teacher/ml-grouping' },
    { icon: MessageSquare, label: 'AI Assistant', href: '/dashboard/teacher/ai' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/student' },
    { icon: Award, label: 'My Grades', href: '/dashboard/student/grades' },
    { icon: CalendarCheck, label: 'Attendance', href: '/dashboard/student/attendance' },
    { icon: ClipboardList, label: 'Assignments', href: '/dashboard/student/assignments' },
    { icon: Bell, label: 'Announcements', href: '/dashboard/student/announcements' },
    { icon: MessageSquare, label: 'AI Homework Help', href: '/dashboard/student/ai' },
  ],
  parent: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard/parent' },
    { icon: CalendarCheck, label: 'Attendance', href: '/dashboard/parent/attendance' },
    { icon: Award, label: 'Grades', href: '/dashboard/parent/grades' },
    { icon: Bell, label: 'Announcements', href: '/dashboard/parent/announcements' },
  ],
};

const roleColors = {
  admin: { bg: 'from-blue-600 to-violet-700', badge: 'bg-blue-100 text-blue-700' },
  teacher: { bg: 'from-violet-600 to-purple-700', badge: 'bg-violet-100 text-violet-700' },
  student: { bg: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 text-emerald-700' },
  parent: { bg: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700' },
};

// ─── Sidebar ────────────────────────────────────────────────────────────────

interface SidebarProps {
  role: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const navItems = navConfig[role as keyof typeof navConfig] || [];
  const colors = roleColors[role as keyof typeof roleColors] || roleColors.admin;

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' }}>
        
        {/* Logo */}
        <div className={`p-5 bg-gradient-to-r ${colors.bg} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm" style={{ fontFamily: 'Sora' }}>Vidya Jyothi</p>
              <p className="text-white/60 text-xs">CBSE School</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center text-white font-bold text-sm`}>
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.full_name || 'User'}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? `bg-gradient-to-r ${colors.bg} text-white shadow-lg`
                    : 'text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" size={18} />
                <span>{label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 text-sm font-medium transition-all"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── Top Navbar ─────────────────────────────────────────────────────────────

interface NavbarProps {
  title: string;
  onMenuClick: () => void;
  role: string;
}

export function Navbar({ title, onMenuClick, role }: NavbarProps) {
  const user = getUser();

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>{title}</h1>
          <p className="text-xs text-gray-400">Vidya Jyothi CBSE School · Chennai</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">{user?.full_name}</span>
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard Layout ────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
  title: string;
}

export function DashboardLayout({ children, role, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col lg:ml-64 min-h-screen overflow-hidden">
          <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} role={role} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color?: string;
  subtitle?: string;
  trend?: string;
}

export function StatCard({ title, value, icon: Icon, color = 'blue', subtitle, trend }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-violet-500 to-purple-600',
    green: 'from-emerald-500 to-teal-600',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-rose-600',
    indigo: 'from-indigo-500 to-blue-600',
  };

  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50',
    purple: 'bg-violet-50',
    green: 'bg-emerald-50',
    amber: 'bg-amber-50',
    red: 'bg-red-50',
    indigo: 'bg-indigo-50',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${bgMap[color]} flex items-center justify-center`}>
          <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description }: { icon?: any; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {Icon && (
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-2">
          <Icon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <p className="text-gray-600 font-semibold">{title}</p>
      {description && <p className="text-gray-400 text-sm max-w-xs">{description}</p>}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Badge Component ─────────────────────────────────────────────────────────

export function Badge({ label, type }: { label: string; type?: string }) {
  const styles: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    absent: 'bg-red-100 text-red-700',
    late: 'bg-amber-100 text-amber-700',
    fast: 'bg-emerald-100 text-emerald-700',
    average: 'bg-blue-100 text-blue-700',
    slow: 'bg-orange-100 text-orange-700',
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    admin: 'bg-blue-100 text-blue-700',
    teacher: 'bg-violet-100 text-violet-700',
    student: 'bg-emerald-100 text-emerald-700',
    parent: 'bg-amber-100 text-amber-700',
  };
  const cls = styles[type || label.toLowerCase()] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, color = 'blue' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colorMap: Record<string, string> = {
    blue: 'from-blue-400 to-blue-600',
    green: 'from-emerald-400 to-teal-600',
    amber: 'from-amber-400 to-orange-500',
    red: 'from-red-400 to-rose-500',
  };
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full bg-gradient-to-r ${colorMap[color] || colorMap.blue} transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

export function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base" style={{ fontFamily: 'Sora' }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
