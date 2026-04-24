'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, StatCard, SectionHeader, LoadingSpinner, ProgressBar } from '@/components/ui';
import { studentApi } from '@/lib/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Award, CalendarCheck, ClipboardList, Lightbulb, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function StudentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.dashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="student" title="My Dashboard"><LoadingSpinner message="Loading your dashboard..." /></DashboardLayout>;

  const { stats, subject_performance, recommendation, upcoming_assignments, student } = data || {};
  const perf = subject_performance || [];

  return (
    <DashboardLayout role="student" title="My Dashboard">
      {/* Welcome banner */}
      <div className="rounded-2xl p-6 mb-6 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #059669, #0d9488)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }} />
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Sora' }}>Hello, {student?.full_name?.split(' ')[0]}! 👋</h2>
        <p className="text-emerald-200 text-sm mb-1">Admission: {student?.admission_number}</p>
        <p className="text-emerald-200 text-sm">Grade {student?.grade} – Section {student?.section_name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Overall Average" value={`${stats?.overall_average || 0}%`} icon={Award} color="green" />
        <StatCard title="Attendance" value={`${stats?.attendance_pct || 0}%`} icon={CalendarCheck} color="blue" subtitle={`${stats?.total_days_present} days present`} />
        <StatCard title="Grade" value={`${student?.grade || '-'}`} icon={TrendingUp} color="purple" subtitle={`Section ${student?.section_name}`} />
        <StatCard title="Assignments" value={upcoming_assignments?.length || 0} icon={ClipboardList} color="amber" subtitle="Upcoming" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Subject Performance */}
        <div className="card">
          <SectionHeader title="Subject Performance" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={perf} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Average']} contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="average" radius={[6, 6, 0, 0]}>
                {perf.map((_: any, i: number) => (
                  <rect key={i} fill={['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#6366f1','#ec4899'][i%7]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* AI Recommendation */}
        {recommendation && (
          <div className="card bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Sora' }}>Study Recommendation</h3>
                <p className="text-xs text-violet-500">Personalized for you</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{recommendation}</p>
            <Link href="/dashboard/student/ai" className="mt-4 inline-flex items-center gap-2 text-sm text-violet-600 font-semibold hover:underline">
              Ask AI for more help →
            </Link>
          </div>
        )}
      </div>

      {/* Upcoming Assignments */}
      {upcoming_assignments?.length > 0 && (
        <div className="card">
          <SectionHeader title="Upcoming Assignments" action={
            <Link href="/dashboard/student/assignments" className="text-blue-500 text-sm hover:underline">View All</Link>
          } />
          <div className="space-y-3">
            {upcoming_assignments.slice(0, 4).map((a: any) => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.subject_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-amber-600">
                    {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'No deadline'}
                  </p>
                  <p className="text-xs text-gray-400">{a.max_marks} marks</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
