'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, StatCard, SectionHeader, LoadingSpinner, Badge } from '@/components/ui';
import { teacherApi } from '@/lib/api';
import { Users, CalendarCheck, ClipboardList, BookOpen, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teacherApi.dashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="teacher" title="Teacher Dashboard"><LoadingSpinner message="Loading your dashboard..." /></DashboardLayout>;

  const { stats, sections, recent_grades } = data || {};

  return (
    <DashboardLayout role="teacher" title="Teacher Dashboard">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 mb-6 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #4c1d95, #6d28d9)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }} />
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora' }}>Welcome to your classroom! 📚</h2>
        <p className="text-violet-200 text-sm mb-4">Vidya Jyothi CBSE School · Academic Year 2024–25</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/teacher/attendance" className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2 text-sm font-medium">
            Mark Attendance →
          </Link>
          <Link href="/dashboard/teacher/grades" className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2 text-sm font-medium">
            Enter Grades →
          </Link>
          <Link href="/dashboard/teacher/ml-grouping" className="bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 py-2 text-sm font-medium">
            ML Grouping →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="My Students" value={stats?.total_students || 0} icon={Users} color="purple" subtitle="Across all sections" />
        <StatCard title="My Sections" value={stats?.total_sections || 0} icon={BookOpen} color="blue" subtitle="Active this year" />
        <StatCard title="Attendance Today" value={`${stats?.today_attendance_pct || 0}%`} icon={CalendarCheck} color="green" />
        <StatCard title="Active Assignments" value={stats?.pending_assignments || 0} icon={ClipboardList} color="amber" subtitle="With upcoming deadline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Sections */}
        <div className="card">
          <SectionHeader title="My Sections" subtitle="Classes you teach" action={
            <Link href="/dashboard/teacher/students" className="text-blue-500 text-sm hover:underline">View All</Link>
          } />
          <div className="space-y-3">
            {sections?.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-4 hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500 text-white font-bold text-sm flex items-center justify-center">
                    {s.grade}{s.section}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                    <p className="text-gray-500 text-xs">{s.student_count} students</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/teacher/attendance?section=${s.id}`} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg font-medium hover:bg-blue-200 transition-colors">
                    Attendance
                  </Link>
                </div>
              </div>
            ))}
            {(!sections || sections.length === 0) && (
              <p className="text-gray-400 text-sm text-center py-6">No sections assigned yet</p>
            )}
          </div>
        </div>

        {/* Recent Grades */}
        <div className="card">
          <SectionHeader title="Recent Grades Entered" action={
            <Link href="/dashboard/teacher/grades" className="text-blue-500 text-sm hover:underline">View All</Link>
          } />
          <div className="space-y-3">
            {recent_grades?.length > 0 ? recent_grades.map((g: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{g.subject_name}</p>
                  <p className="text-xs text-gray-400">{g.exam_type} · {g.exam_date ? new Date(g.exam_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{g.marks_obtained}/{g.max_marks}</p>
                  <p className="text-xs text-gray-400">{g.percentage}%</p>
                </div>
              </div>
            )) : (
              <p className="text-gray-400 text-sm text-center py-6">No grades entered yet</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
