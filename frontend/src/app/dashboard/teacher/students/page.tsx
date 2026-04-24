'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, LoadingSpinner, ProgressBar } from '@/components/ui';
import { teacherApi } from '@/lib/api';

export default function TeacherStudentsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    teacherApi.dashboard().then(r => {
      const s = r.data.sections || [];
      setSections(s);
      if (s.length) setSelected(s[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    teacherApi.sectionStudents(selected).then(r => setStudents(r.data.students || [])).finally(() => setLoading(false));
  }, [selected]);

  return (
    <DashboardLayout role="teacher" title="My Students">
      <SectionHeader title="Student List" subtitle="Enrolled students in your sections" />
      <div className="card mb-5">
        <select className="form-input max-w-xs" value={selected||''} onChange={e => setSelected(Number(e.target.value))}>
          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            <th className="table-header text-left">Roll No</th>
            <th className="table-header text-left">Student Name</th>
            <th className="table-header text-left hidden md:table-cell">Gender</th>
            <th className="table-header text-left">Attendance</th>
            <th className="table-header text-left">Avg Marks</th>
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5}><LoadingSpinner /></td></tr> :
             students.map(s => (
              <tr key={s.id} className="table-row">
                <td className="table-cell text-gray-500 text-xs">{s.roll_number}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center">{s.full_name?.charAt(0)}</div>
                    <span className="font-medium text-gray-800 text-sm">{s.full_name}</span>
                  </div>
                </td>
                <td className="table-cell hidden md:table-cell text-gray-500 text-sm">{s.gender}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={s.attendance_pct} color={s.attendance_pct >= 75 ? 'green' : 'red'} />
                    <span className="text-xs font-bold text-gray-600 w-10">{s.attendance_pct}%</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`text-sm font-bold ${s.average_marks >= 75 ? 'text-emerald-600' : s.average_marks >= 60 ? 'text-blue-600' : 'text-red-500'}`}>{s.average_marks}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
