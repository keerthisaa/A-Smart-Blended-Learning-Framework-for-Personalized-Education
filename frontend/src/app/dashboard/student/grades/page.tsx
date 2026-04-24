'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, LoadingSpinner } from '@/components/ui';
import { studentApi } from '@/lib/api';

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    studentApi.grades().then(r => setGrades(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = filter ? grades.filter(g => g.subject_name === filter) : grades;
  const subjects = [...new Set(grades.map(g => g.subject_name))];

  const getColor = (pct: number) =>
    pct >= 90 ? 'text-emerald-600 bg-emerald-50' :
    pct >= 75 ? 'text-blue-600 bg-blue-50' :
    pct >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

  const getGrade = (pct: number) =>
    pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';

  // Subject averages
  const subjectAvgs = subjects.map(subj => {
    const sg = grades.filter(g => g.subject_name === subj);
    const avg = sg.reduce((a, g) => a + g.percentage, 0) / sg.length;
    return { subject: subj, avg: Math.round(avg) };
  });

  return (
    <DashboardLayout role="student" title="My Grades">
      <SectionHeader title="My Academic Grades" subtitle="All examination results" />

      {/* Subject averages strip */}
      {!loading && subjectAvgs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
          {subjectAvgs.map(s => (
            <div key={s.subject} className="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setFilter(filter === s.subject ? '' : s.subject)}>
              <p className={`text-xl font-bold ${s.avg >= 75 ? 'text-emerald-600' : s.avg >= 60 ? 'text-blue-600' : 'text-red-500'}`} style={{ fontFamily: 'Sora' }}>{s.avg}%</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{s.subject}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Filter by Subject:</label>
        <select className="form-input max-w-xs" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Subjects</option>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header text-left">Subject</th>
              <th className="table-header text-left">Exam Type</th>
              <th className="table-header text-center">Marks</th>
              <th className="table-header text-center">Percentage</th>
              <th className="table-header text-center">Grade</th>
              <th className="table-header text-left hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6}><LoadingSpinner /></td></tr> :
             filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">No grades found</td></tr> :
             filtered.map((g, i) => (
              <tr key={i} className="table-row">
                <td className="table-cell font-medium text-gray-800">{g.subject_name}</td>
                <td className="table-cell"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{g.exam_type}</span></td>
                <td className="table-cell text-center font-semibold text-gray-700">{g.marks_obtained}/{g.max_marks}</td>
                <td className="table-cell text-center">
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${getColor(g.percentage)}`}>{g.percentage}%</span>
                </td>
                <td className="table-cell text-center">
                  <span className="font-bold text-gray-700">{getGrade(g.percentage)}</span>
                </td>
                <td className="table-cell hidden md:table-cell text-gray-400 text-xs">{g.exam_date ? new Date(g.exam_date).toLocaleDateString('en-IN') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
