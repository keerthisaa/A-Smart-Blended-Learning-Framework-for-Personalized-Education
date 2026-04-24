'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, Modal, ToastProvider, useToast, LoadingSpinner } from '@/components/ui';
import { teacherApi } from '@/lib/api';
import { Plus, ClipboardList } from 'lucide-react';

function AssignmentsContent() {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title:'', description:'', subject_id:'', section_id:'', due_date:'', max_marks:'10' });

  useEffect(() => {
    Promise.all([teacherApi.assignments(), teacherApi.dashboard(), teacherApi.subjects()])
      .then(([a, d, s]) => { setAssignments(a.data); setSections(d.data.sections||[]); setSubjects(s.data||[]); })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await teacherApi.createAssignment(form);
      showToast('Assignment created!', 'success');
      setShowModal(false);
      teacherApi.assignments().then(r => setAssignments(r.data));
    } catch { showToast('Failed to create', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <DashboardLayout role="teacher" title="Assignments">
      <div className="flex items-center justify-between mb-6">
        <SectionHeader title="Assignments" subtitle={`${assignments.length} assignments`} />
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Assignment
        </button>
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {assignments.length === 0
            ? <div className="card text-center py-12 text-gray-400">No assignments created yet</div>
            : assignments.map(a => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-gray-800 text-sm">{a.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-2">{a.description}</p>
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span>📚 {a.subject_name}</span>
                    <span>📅 Due: {a.due_date ? new Date(a.due_date).toLocaleDateString('en-IN') : 'No deadline'}</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600 ml-4">{a.max_marks} marks</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Assignment">
        <div className="space-y-4">
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Title</label><input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Assignment title" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label><textarea className="form-input h-20 resize-none" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Instructions..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label><select className="form-input" value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})}><option value="">Select</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Section</label><select className="form-input" value={form.section_id} onChange={e => setForm({...form, section_id: e.target.value})}><option value="">Select</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Due Date</label><input type="datetime-local" className="form-input" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} /></div>
            <div><label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Marks</label><input type="number" className="form-input" value={form.max_marks} onChange={e => setForm({...form, max_marks: e.target.value})} /></div>
          </div>
          <div className="flex gap-3"><button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button><button className="btn-primary flex-1" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create'}</button></div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
export default function AssignmentsPage() { return <ToastProvider><AssignmentsContent /></ToastProvider>; }
