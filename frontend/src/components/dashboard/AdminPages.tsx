'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, Badge, Modal, LoadingSpinner, ToastProvider, useToast, StatCard } from '@/components/ui';
import { adminApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BookOpen, Users, Brain, TrendingUp, Bell, Plus, Trash2 } from 'lucide-react';

// ─── Classes Page ────────────────────────────────────────────────────────────
export function ClassesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.grades().then(r => setGrades(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="admin" title="Classes & Sections"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout role="admin" title="Classes & Sections">
      <SectionHeader title="Classes & Sections" subtitle="24 sections across 12 grades" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.map(grade => (
          <div key={grade.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>{grade.name}</h3>
              <span className="badge-blue">{grade.sections?.reduce((a: number, s: any) => a + (s.student_count || 0), 0)} students</span>
            </div>
            <div className="space-y-2">
              {grade.sections?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                      {s.section_name}
                    </div>
                    <span className="text-sm text-gray-600">Section {s.section_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{s.student_count} students</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Subjects Page ───────────────────────────────────────────────────────────
export function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.subjects().then(r => setSubjects(r.data)).finally(() => setLoading(false));
  }, []);

  const SUBJECT_ICONS: Record<string, string> = {
    'English': '📖', 'Mathematics': '🔢', 'Science': '🔬',
    'Social Science': '🌍', 'Tamil': '🕌', 'Computer Science': '💻', 'General Knowledge': '🧠'
  };
  const COLORS = ['from-blue-500 to-blue-600', 'from-violet-500 to-purple-600', 'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-500', 'from-red-500 to-rose-600', 'from-indigo-500 to-blue-600', 'from-pink-500 to-rose-500'];

  if (loading) return <DashboardLayout role="admin" title="Subjects"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout role="admin" title="Subjects">
      <SectionHeader title="Subjects" subtitle="7 subjects taught across all grades" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subjects.map((s, i) => (
          <div key={s.id} className="card hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center text-2xl mb-4`}>
              {SUBJECT_ICONS[s.name] || '📚'}
            </div>
            <h3 className="font-bold text-gray-800 text-base mb-1" style={{ fontFamily: 'Sora' }}>{s.name}</h3>
            <p className="text-xs text-gray-400 font-mono mb-2">Code: {s.code}</p>
            <p className="text-sm text-gray-500">{s.description}</p>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">Taught in all 12 grades · 24 sections</span>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

// ─── Analytics Page ──────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [perf, setPerf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.performanceAnalytics().then(r => setPerf(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="admin" title="Analytics"><LoadingSpinner /></DashboardLayout>;

  return (
    <DashboardLayout role="admin" title="Analytics">
      <SectionHeader title="School Analytics" subtitle="Performance insights across grades and subjects" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <SectionHeader title="Subject-wise Average" subtitle="School-wide performance per subject" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perf?.subject_performance || []} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9ca3af' }} angle={-20} textAnchor="end" height={45} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Score']} contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="average" name="Average %" radius={[8, 8, 0, 0]}>
                {perf?.subject_performance?.map((_: any, i: number) => (
                  <Cell key={i} fill={['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366f1', '#ec4899'][i % 7]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionHeader title="Grade-wise Performance" subtitle="Average marks per grade" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perf?.grade_performance || []} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="grade" tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`, 'Avg Score']} contentStyle={{ borderRadius: 12, border: 'none' }} />
              <Bar dataKey="average" name="Average %" radius={[6, 6, 0, 0]} fill="url(#perfGradient)" />
              <defs>
                <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>Subject Performance Rankings</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header text-left">Rank</th>
              <th className="table-header text-left">Subject</th>
              <th className="table-header text-left">Average Score</th>
              <th className="table-header text-left">Performance</th>
            </tr>
          </thead>
          <tbody>
            {[...(perf?.subject_performance || [])].sort((a, b) => b.average - a.average).map((s, i) => (
              <tr key={s.subject} className="table-row">
                <td className="table-cell">
                  <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="table-cell font-medium text-gray-800">{s.subject}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-32">
                      <div className="h-2 rounded-full bg-blue-500" style={{ width: `${s.average}%` }} />
                    </div>
                    <span className="font-bold text-gray-700 text-sm">{s.average}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  <Badge label={s.average >= 75 ? 'Excellent' : s.average >= 60 ? 'Good' : 'Needs Focus'} type={s.average >= 75 ? 'fast' : s.average >= 60 ? 'average' : 'slow'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

// ─── ML Insights Page ────────────────────────────────────────────────────────
export function MLInsightsPage() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.mlInsights().then(r => setInsights(r.data)).finally(() => setLoading(false));
  }, []);

  const PIE_COLORS = ['#EF4444', '#F59E0B', '#10B981'];

  if (loading) return <DashboardLayout role="admin" title="ML Insights"><LoadingSpinner /></DashboardLayout>;

  const { overall_distribution: dist, grade_breakdown, recent_predictions, total_predictions } = insights || {};
  const pieData = [
    { name: 'Slow Learners', value: dist?.slow || 0 },
    { name: 'Average', value: dist?.average || 0 },
    { name: 'Fast Learners', value: dist?.fast || 0 },
  ];

  return (
    <DashboardLayout role="admin" title="ML Insights">
      {/* Hero */}
      <div className="card mb-6 bg-gradient-to-br from-violet-600 to-purple-700 text-white border-0">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Sora' }}>ML Learning Pace Insights</h2>
            <p className="text-violet-200 text-sm">Random Forest predictions for Grades 6–12 students</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/15 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{total_predictions}</p>
            <p className="text-violet-200 text-xs mt-1">Total Predictions</p>
          </div>
          <div className="bg-white/15 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{dist?.fast || 0}</p>
            <p className="text-violet-200 text-xs mt-1">Fast Learners</p>
          </div>
          <div className="bg-white/15 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{dist?.slow || 0}</p>
            <p className="text-violet-200 text-xs mt-1">Need Support</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="card">
          <SectionHeader title="Learning Pace Distribution" subtitle="Overall across Grades 6–12" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="40%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionHeader title="Grade-wise Breakdown" subtitle="Learning distribution by grade" />
          <div className="space-y-3 overflow-y-auto max-h-56">
            {(grade_breakdown || []).map((g: any) => (
              <div key={g.grade} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">{g.grade}</span>
                <div className="flex-1 flex gap-1 h-5 rounded-lg overflow-hidden">
                  {g.total > 0 && (
                    <>
                      <div className="bg-red-400" style={{ width: `${(g.slow / g.total) * 100}%` }} title={`Slow: ${g.slow}`} />
                      <div className="bg-amber-400" style={{ width: `${(g.average / g.total) * 100}%` }} title={`Average: ${g.average}`} />
                      <div className="bg-emerald-400" style={{ width: `${(g.fast / g.total) * 100}%` }} title={`Fast: ${g.fast}`} />
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-500 w-8">{g.total}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
            {[['bg-red-400', 'Slow'], ['bg-amber-400', 'Average'], ['bg-emerald-400', 'Fast']].map(([bg, l]) => (
              <div key={l} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded-full ${bg}`} /><span className="text-xs text-gray-500">{l}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="card p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>Recent Predictions</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header text-left">Student</th>
              <th className="table-header text-left">Learning Pace</th>
              <th className="table-header text-left">Confidence</th>
              <th className="table-header text-left hidden md:table-cell">Predicted At</th>
            </tr>
          </thead>
          <tbody>
            {(recent_predictions || []).map((p: any, i: number) => (
              <tr key={i} className="table-row">
                <td className="table-cell font-medium text-gray-800">{p.student_name}</td>
                <td className="table-cell"><Badge label={p.label.charAt(0).toUpperCase() + p.label.slice(1)} type={p.label} /></td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${(p.confidence * 100).toFixed(0)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{(p.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="table-cell hidden md:table-cell text-gray-400 text-xs">{new Date(p.predicted_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}

// ─── Announcements Page ──────────────────────────────────────────────────────
export function AnnouncementsPage() {
  const [anns, setAnns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', target_roles: 'all' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    adminApi.announcements().then(r => setAnns(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await adminApi.createAnnouncement(form);
      setShowModal(false);
      setForm({ title: '', content: '', target_roles: 'all' });
      load();
    } catch { } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this announcement?')) return;
    await adminApi.deleteAnnouncement(id);
    load();
  };

  const TARGET_COLORS: Record<string, string> = { all: 'bg-blue-100 text-blue-700', teacher: 'bg-purple-100 text-purple-700', student: 'bg-emerald-100 text-emerald-700', parent: 'bg-amber-100 text-amber-700' };

  return (
    <DashboardLayout role="admin" title="Announcements">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Announcements" subtitle={`${anns.length} active announcements`} />
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {anns.map(a => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TARGET_COLORS[a.target_roles] || TARGET_COLORS.all}`}>
                      {a.target_roles === 'all' ? 'Everyone' : a.target_roles?.charAt(0).toUpperCase() + a.target_roles?.slice(1)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
                  <p className="text-gray-400 text-xs mt-3">
                    By {a.creator_name} · {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <button onClick={() => handleDelete(a.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Announcement">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label>
            <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Announcement title" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content</label>
            <textarea className="form-input h-28 resize-none" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Announcement details..." />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Audience</label>
            <select className="form-input" value={form.target_roles} onChange={e => setForm({ ...form, target_roles: e.target.value })}>
              <option value="all">Everyone</option>
              <option value="teacher">Teachers Only</option>
              <option value="student">Students Only</option>
              <option value="parent">Parents Only</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>{saving ? 'Publishing...' : 'Publish'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
