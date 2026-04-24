'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, Modal, ToastProvider, useToast, LoadingSpinner, Badge } from '@/components/ui';
import { teacherApi } from '@/lib/api';
import { Plus, Award } from 'lucide-react';

function GradesContent() {
  const { showToast } = useToast();
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student_id: '', subject_id: '', section_id: '',
    exam_type: 'Unit Test 1', marks_obtained: '', max_marks: '100',
    exam_date: new Date().toISOString().split('T')[0], remarks: ''
  });

  useEffect(() => {
    Promise.all([teacherApi.dashboard(), teacherApi.subjects()]).then(([d, s]) => {
      const sects = d.data.sections || [];
      setSections(sects);
      setSubjects(s.data || []);
      if (sects.length > 0) {
        setSelectedSection(sects[0].id);
        setForm(f => ({ ...f, section_id: String(sects[0].id) }));
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    setLoading(true);
    Promise.all([
      teacherApi.sectionGrades(selectedSection),
      teacherApi.sectionStudents(selectedSection)
    ]).then(([g, s]) => {
      setGrades(g.data);
      setStudents(s.data.students || []);
    }).finally(() => setLoading(false));
  }, [selectedSection]);

  const handleSave = async () => {
    if (!form.student_id || !form.subject_id || !form.marks_obtained) {
      showToast('Please fill all required fields', 'error'); return;
    }
    setSaving(true);
    try {
      await teacherApi.addGrade({ ...form, section_id: selectedSection });
      showToast('Grade recorded successfully!', 'success');
      setShowModal(false);
      teacherApi.sectionGrades(selectedSection!).then(r => setGrades(r.data));
    } catch (e: any) {
      showToast(e.response?.data?.error || 'Failed to save grade', 'error');
    } finally { setSaving(false); }
  };

  const getGradeColor = (pct: number) => {
    if (pct >= 90) return 'text-emerald-600 bg-emerald-50';
    if (pct >= 75) return 'text-blue-600 bg-blue-50';
    if (pct >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  const EXAM_TYPES = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam', 'Assignment', 'Practical'];

  return (
    <DashboardLayout role="teacher" title="Grades">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Grade Management" subtitle="Enter and manage student marks" />
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Grade
        </button>
      </div>

      <div className="card mb-5">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-40">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Section</label>
            <select className="form-input" value={selectedSection || ''} onChange={e => { setSelectedSection(Number(e.target.value)); setForm(f => ({...f, section_id: e.target.value})); }}>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="table-header text-left">Student</th>
              <th className="table-header text-left">Subject</th>
              <th className="table-header text-left">Exam Type</th>
              <th className="table-header text-center">Marks</th>
              <th className="table-header text-center">%</th>
              <th className="table-header text-left hidden md:table-cell">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><LoadingSpinner /></td></tr>
            ) : grades.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No grades entered yet. Click "Add Grade" to start.</td></tr>
            ) : grades.map((g, i) => {
              const pct = Math.round((g.marks_obtained / g.max_marks) * 100);
              return (
                <tr key={i} className="table-row">
                  <td className="table-cell font-medium text-gray-800 text-sm">{g.student_id}</td>
                  <td className="table-cell text-sm">{g.subject_name}</td>
                  <td className="table-cell"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">{g.exam_type}</span></td>
                  <td className="table-cell text-center font-semibold text-gray-800">{g.marks_obtained}/{g.max_marks}</td>
                  <td className="table-cell text-center">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${getGradeColor(pct)}`}>{pct}%</span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-400 text-xs">{g.exam_date ? new Date(g.exam_date).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Grade">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Student</label>
              <select className="form-input" value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}>
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
              <select className="form-input" value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Exam Type</label>
            <select className="form-input" value={form.exam_type} onChange={e => setForm({...form, exam_type: e.target.value})}>
              {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Marks Obtained</label>
              <input type="number" className="form-input" value={form.marks_obtained} onChange={e => setForm({...form, marks_obtained: e.target.value})} placeholder="e.g. 85" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Marks</label>
              <input type="number" className="form-input" value={form.max_marks} onChange={e => setForm({...form, max_marks: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Exam Date</label>
            <input type="date" className="form-input" value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Remarks (Optional)</label>
            <input className="form-input" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} placeholder="Add a note..." />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Grade'}</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default function GradesPage() {
  return <ToastProvider><GradesContent /></ToastProvider>;
}
