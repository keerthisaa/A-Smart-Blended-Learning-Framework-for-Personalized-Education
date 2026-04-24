'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, LoadingSpinner, StatCard } from '@/components/ui';
import { studentApi } from '@/lib/api';
import { CalendarCheck, CalendarX, Clock, TrendingUp } from 'lucide-react';

export default function StudentAttendancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.attendance().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardLayout role="student" title="Attendance"><LoadingSpinner /></DashboardLayout>;

  const { attendance_pct, total_days, present_days, records = [] } = data || {};
  const absent = records.filter((r: any) => r.status === 'absent').length;
  const late = records.filter((r: any) => r.status === 'late').length;

  const STATUS = {
    present: { dot: 'bg-emerald-500', text: 'text-emerald-600 bg-emerald-50', label: 'Present' },
    absent: { dot: 'bg-red-500', text: 'text-red-600 bg-red-50', label: 'Absent' },
    late: { dot: 'bg-amber-500', text: 'text-amber-600 bg-amber-50', label: 'Late' },
  };

  return (
    <DashboardLayout role="student" title="Attendance">
      <SectionHeader title="My Attendance" subtitle="Last 60 school days" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Attendance Rate" value={`${attendance_pct}%`} icon={TrendingUp} color={attendance_pct >= 75 ? 'green' : 'red'} subtitle={attendance_pct >= 75 ? 'Good standing' : 'Below threshold'} />
        <StatCard title="Days Present" value={present_days} icon={CalendarCheck} color="green" />
        <StatCard title="Days Absent" value={absent} icon={CalendarX} color="red" />
        <StatCard title="Late Arrivals" value={late} icon={Clock} color="amber" />
      </div>

      {/* Attendance requirement bar */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">CBSE Minimum Attendance: 75%</span>
          <span className={`text-sm font-bold ${attendance_pct >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>You: {attendance_pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${attendance_pct >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, attendance_pct)}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">0%</span>
          <div className="flex items-center gap-1"><div className="w-0.5 h-3 bg-amber-400" /><span className="text-xs text-amber-600">75% min</span></div>
          <span className="text-xs text-gray-400">100%</span>
        </div>
        {attendance_pct < 75 && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-3">
            ⚠ Your attendance is below the CBSE minimum of 75%. Please ensure regular attendance to avoid academic penalties.
          </p>
        )}
      </div>

      {/* Records table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">Attendance History (Recent 60 days)</h3>
        </div>
        <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
          {records.map((r: any, i: number) => {
            const cfg = STATUS[r.status as keyof typeof STATUS] || STATUS.present;
            return (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
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
    </DashboardLayout>
  );
}
