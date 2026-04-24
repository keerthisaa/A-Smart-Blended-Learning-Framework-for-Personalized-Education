'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, StatCard, SectionHeader, LoadingSpinner, ProgressBar } from '@/components/ui';
import { parentApi } from '@/lib/api';
import { CalendarCheck, Award, MessageSquare, Bell, TrendingUp, User } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Parent Dashboard ─────────────────────────────────────────────────────────
export function ParentDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentApi.dashboard().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="parent" title="Parent Dashboard"><LoadingSpinner message="Loading your child's information..." /></DashboardLayout>;

  const { child, stats, subject_performance = [], teacher_remarks = [], announcements = [] } = data || {};

  return (
    <DashboardLayout role="parent" title="Parent Dashboard">
      {/* Child Info Banner */}
      <div className="rounded-2xl p-6 mb-6 text-white overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
        <div className="absolute top-0 right-0 w-48 h-48 opacity-10 rounded-full" style={{ background: 'radial-gradient(circle, white, transparent)', transform: 'translate(20%, -20%)' }} />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ fontFamily: 'Sora' }}>
            {child?.full_name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Sora' }}>{child?.full_name}</h2>
            <p className="text-amber-200 text-sm">Grade {child?.grade} – Section {child?.section_name}</p>
            <p className="text-amber-200 text-xs">Admission No: {child?.admission_number}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Attendance" value={`${stats?.attendance_pct || 0}%`} icon={CalendarCheck} color={stats?.attendance_pct >= 75 ? 'green' : 'red'} subtitle={`${stats?.present_days} / ${stats?.total_days} days`} />
        <StatCard title="Overall Average" value={`${stats?.overall_average || 0}%`} icon={Award} color="blue" />
        <StatCard title="Teacher Remarks" value={teacher_remarks.length} icon={MessageSquare} color="purple" />
        <StatCard title="Announcements" value={announcements.length} icon={Bell} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Subject Performance */}
        <div className="card">
          <SectionHeader title="Subject-wise Performance" subtitle="Your child's academic progress" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subject_performance} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={40} />
              <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Average']} contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="average" radius={[6, 6, 0, 0]} fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Teacher Remarks */}
        <div className="card">
          <SectionHeader title="Teacher Remarks" subtitle="Recent feedback from teachers" />
          {teacher_remarks.length === 0
            ? <p className="text-gray-400 text-sm text-center py-8">No remarks yet</p>
            : (
            <div className="space-y-3">
              {teacher_remarks.slice(0, 4).map((r: any, i: number) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-amber-700">{r.teacher_name}</span>
                    <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{r.remark}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="card">
          <SectionHeader title="School Announcements" />
          <div className="space-y-3">
            {announcements.slice(0, 3).map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <Bell className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Parent Attendance View ───────────────────────────────────────────────────
export function ParentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentApi.childAttendance().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const { attendance_pct = 0, records = [] } = data || {};
  const STATUS = {
    present: { dot: 'bg-emerald-500', text: 'text-emerald-600 bg-emerald-50', label: 'Present' },
    absent: { dot: 'bg-red-500', text: 'text-red-600 bg-red-50', label: 'Absent' },
    late: { dot: 'bg-amber-500', text: 'text-amber-600 bg-amber-50', label: 'Late' },
  };

  return (
    <DashboardLayout role="parent" title="Child's Attendance">
      <SectionHeader title="Attendance Record" subtitle="Your child's attendance history" />
      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card mb-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-700">Attendance Rate</span>
              <span className={`text-xl font-bold ${attendance_pct >= 75 ? 'text-emerald-600' : 'text-red-500'}`} style={{ fontFamily: 'Sora' }}>{attendance_pct}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={`h-3 rounded-full ${attendance_pct >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, attendance_pct)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">CBSE minimum requirement: 75%</p>
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {records.map((r: any, i: number) => {
                const cfg = STATUS[r.status as keyof typeof STATUS] || STATUS.present;
                return (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className="text-sm text-gray-700">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.text}`}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

// ─── Parent Grades View ───────────────────────────────────────────────────────
export function ParentGradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentApi.childGrades().then(r => setGrades(r.data)).finally(() => setLoading(false));
  }, []);

  const getColor = (pct: number) =>
    pct >= 90 ? 'text-emerald-600 bg-emerald-50' : pct >= 75 ? 'text-blue-600 bg-blue-50' : pct >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

  return (
    <DashboardLayout role="parent" title="Child's Grades">
      <SectionHeader title="Academic Grades" subtitle="Your child's examination results (read-only)" />
      {loading ? <LoadingSpinner /> : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header text-left">Subject</th>
                <th className="table-header text-left">Exam Type</th>
                <th className="table-header text-center">Marks</th>
                <th className="table-header text-center">Percentage</th>
                <th className="table-header text-left hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0
                ? <tr><td colSpan={5} className="text-center py-10 text-gray-400">No grade records found</td></tr>
                : grades.map((g, i) => (
                <tr key={i} className="table-row">
                  <td className="table-cell font-medium text-gray-800">{g.subject_name}</td>
                  <td className="table-cell"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{g.exam_type}</span></td>
                  <td className="table-cell text-center font-semibold">{g.marks_obtained}/{g.max_marks}</td>
                  <td className="table-cell text-center"><span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${getColor(g.percentage)}`}>{g.percentage}%</span></td>
                  <td className="table-cell hidden md:table-cell text-gray-400 text-xs">{g.exam_date ? new Date(g.exam_date).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

// ─── Parent Announcements ─────────────────────────────────────────────────────
export function ParentAnnouncementsPage() {
  const [anns, setAnns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentApi.announcements().then(r => setAnns(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="parent" title="Announcements">
      <SectionHeader title="School Announcements" subtitle="Latest updates for parents" />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {anns.length === 0
            ? <div className="card text-center py-12 text-gray-400">No announcements</div>
            : anns.map(a => (
            <div key={a.id} className="card border-l-4 border-l-amber-500">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-gray-800 mb-2" style={{ fontFamily: 'Sora' }}>{a.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
                  <p className="text-gray-400 text-xs mt-3">{new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">
                  {a.target_roles === 'all' ? 'Everyone' : 'Parents'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
