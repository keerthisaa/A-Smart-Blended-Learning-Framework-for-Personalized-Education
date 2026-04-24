'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, StatCard, LoadingSpinner, SectionHeader, Badge } from '@/components/ui';
import { adminApi } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, GraduationCap, BookOpen, TrendingUp, Brain, UserCheck, UserX, Clock } from 'lucide-react';

const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.dashboard(), adminApi.performanceAnalytics()])
      .then(([d, p]) => { setData(d.data); setPerf(p.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      <LoadingSpinner message="Loading school analytics..." />
    </DashboardLayout>
  );

  const { stats, grade_distribution, attendance_trend, ml_distribution } = data || {};

  const mlPieData = [
    { name: 'Slow Learners', value: ml_distribution?.slow || 0 },
    { name: 'Average', value: ml_distribution?.average || 0 },
    { name: 'Fast Learners', value: ml_distribution?.fast || 0 },
  ];

  return (
    <DashboardLayout role="admin" title="Admin Dashboard">
      {/* Hero Banner */}
      <div className="rounded-2xl p-6 mb-6 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #1e40af, #6d28d9)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Sora' }}>Good Morning, Principal! 🎓</h2>
          <p className="text-blue-200 text-sm">Vidya Jyothi CBSE School · Academic Year 2024–25</p>
          <div className="flex gap-4 mt-4">
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats?.today_attendance_pct || 0}%</p>
              <p className="text-blue-200 text-xs">Today's Attendance</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats?.total_students}</p>
              <p className="text-blue-200 text-xs">Total Students</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{stats?.total_teachers}</p>
              <p className="text-blue-200 text-xs">Teaching Staff</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={stats?.total_students || 0} icon={Users} color="blue" subtitle="Grades 1–12" />
        <StatCard title="Total Teachers" value={stats?.total_teachers || 0} icon={GraduationCap} color="purple" subtitle="30 teaching staff" />
        <StatCard title="Sections" value={stats?.total_sections || 24} icon={BookOpen} color="green" subtitle="24 active sections" />
        <StatCard title="Attendance Today" value={`${stats?.today_attendance_pct || 0}%`} icon={UserCheck} color="amber" subtitle={`${stats?.today_present || 0} of ${stats?.today_total || 0}`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Attendance Trend */}
        <div className="card">
          <SectionHeader title="Attendance Trend" subtitle="Last 7 school days" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={attendance_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Attendance']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Line type="monotone" dataKey="percentage" stroke="#3B82F6" strokeWidth={2.5} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

  
        {/* Grade Distribution */}
        <div className="card">
          <SectionHeader title="Students by Grade" subtitle="Enrollment distribution" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grade_distribution || []} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="count" name="Students" radius={[6, 6, 0, 0]}
                fill="url(#gradeGradient)" />
              <defs>
                <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="card">
          <SectionHeader title="Subject Performance" subtitle="School-wide average scores" />
          {perf?.subject_performance ? (
            <div className="space-y-3">
              {perf.subject_performance.map((s: any) => (
                <div key={s.subject} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-28 flex-shrink-0 truncate">{s.subject}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${s.average}%`,
                        background: s.average >= 75 ? 'linear-gradient(90deg, #10B981, #059669)' :
                          s.average >= 60 ? 'linear-gradient(90deg, #3B82F6, #2563eb)' :
                          'linear-gradient(90deg, #F59E0B, #d97706)'
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{s.average}%</span>
                </div>
              ))}
            </div>
          ) : <LoadingSpinner />}
        </div>
      </div>
    </DashboardLayout>
  );
}
