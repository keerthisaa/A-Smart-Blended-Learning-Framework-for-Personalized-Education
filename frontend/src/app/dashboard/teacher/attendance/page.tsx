'use client';

import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout, SectionHeader, ToastProvider, useToast, LoadingSpinner } from '@/components/ui';
import { teacherApi, adminApi } from '@/lib/api';
import { CalendarCheck, Check, X, Clock, Save } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function AttendanceContent() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load teacher's sections
  useEffect(() => {
    teacherApi.dashboard().then(res => {
      const s = res.data.sections || [];
      setSections(s);
      const paramSection = searchParams.get('section');
      const initial = paramSection ? parseInt(paramSection) : (s[0]?.id || null);
      setSelectedSection(initial);
    });
  }, []);

  // Load attendance when section or date changes
  const loadAttendance = useCallback(async () => {
    if (!selectedSection) return;
    setLoading(true);
    try {
      const res = await teacherApi.getAttendance(selectedSection, date);
      const records = res.data;
      const attMap: Record<number, string> = {};
      records.forEach((r: any) => {
        attMap[r.student_id] = r.status === 'not_marked' ? 'present' : r.status;
      });
      setStudents(records);
      setAttendance(attMap);
    } catch { showToast('Failed to load attendance', 'error'); }
    finally { setLoading(false); }
  }, [selectedSection, date]);

  useEffect(() => { loadAttendance(); }, [loadAttendance]);

  const markAll = (status: string) => {
    const updated: Record<number, string> = {};
    students.forEach(s => { updated[s.student_id] = status; });
    setAttendance(updated);
  };

  const toggle = (studentId: number) => {
    setAttendance(prev => {
      const current = prev[studentId] || 'present';
      const cycle = { present: 'absent', absent: 'late', late: 'present' };
      return { ...prev, [studentId]: cycle[current as keyof typeof cycle] || 'present' };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const attendanceData = students.map(s => ({
        student_id: s.student_id,
        status: attendance[s.student_id] || 'present'
      }));
      await teacherApi.markAttendance({ section_id: selectedSection, date, attendance: attendanceData });
      showToast('Attendance saved successfully!', 'success');
    } catch { showToast('Failed to save attendance', 'error'); }
    finally { setSaving(false); }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;
  const total = students.length;

  const STATUS_CONFIG = {
    present: { color: 'bg-green-500 text-white', label: 'Present', icon: Check },
    absent: { color: 'bg-red-500 text-white', label: 'Absent', icon: X },
    late: { color: 'bg-amber-500 text-white', label: 'Late', icon: Clock },
  };

  return (
    <DashboardLayout role="teacher" title="Attendance">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <SectionHeader title="Mark Attendance" subtitle="Track daily student presence" />
        <button onClick={handleSave} disabled={saving || students.length === 0} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Controls */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section</label>
            <select className="form-input" value={selectedSection || ''} onChange={e => setSelectedSection(Number(e.target.value))}>
              {sections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
            <input type="date" className="form-input" value={date} max={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quick Actions</label>
            <div className="flex gap-2">
              <button onClick={() => markAll('present')} className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200 transition-colors">All Present</button>
              <button onClick={() => markAll('absent')} className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors">All Absent</button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Present', count: presentCount, color: 'from-emerald-500 to-teal-600', pct: total ? Math.round(presentCount/total*100) : 0 },
          { label: 'Absent', count: absentCount, color: 'from-red-500 to-rose-600', pct: total ? Math.round(absentCount/total*100) : 0 },
          { label: 'Late', count: lateCount, color: 'from-amber-500 to-orange-500', pct: total ? Math.round(lateCount/total*100) : 0 },
        ].map(({ label, count, color, pct }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`text-2xl font-bold bg-gradient-to-br ${color} bg-clip-text text-transparent`} style={{ fontFamily: 'Sora' }}>{count}</div>
            <p className="text-xs text-gray-500 mt-1">{label} ({pct}%)</p>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">{total} students · Tap card to cycle status</p>
          <p className="text-xs text-gray-400 italic">P → A → L → P</p>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {students.map((s, i) => {
              const status = attendance[s.student_id] || 'present';
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              const Icon = config.icon;
              return (
                <div key={s.student_id}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'border-b border-r border-gray-50' : 'border-b border-gray-50'}`}
                  onClick={() => toggle(s.student_id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-xs w-5 text-right">{s.roll_number}</span>
                    <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">
                      {s.student_name?.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{s.student_name}</span>
                  </div>
                  <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AttendancePage() {
  return <ToastProvider><AttendanceContent /></ToastProvider>;
}
