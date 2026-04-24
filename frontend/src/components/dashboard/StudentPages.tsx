'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, LoadingSpinner } from '@/components/ui';
import { studentApi } from '@/lib/api';
import { ClipboardList, Calendar, BookOpen } from 'lucide-react';

export function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.assignments().then(r => setAssignments(r.data)).finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const upcoming = assignments.filter(a => a.due_date && new Date(a.due_date) > now);
  const past = assignments.filter(a => !a.due_date || new Date(a.due_date) <= now);

  const getDaysLeft = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const AssignmentCard = ({ a }: { a: any }) => {
    const daysLeft = a.due_date ? getDaysLeft(a.due_date) : null;
    const urgency = daysLeft !== null ? (daysLeft <= 2 ? 'red' : daysLeft <= 5 ? 'amber' : 'green') : 'gray';
    const urgencyBg = { red: 'bg-red-50 border-red-200', amber: 'bg-amber-50 border-amber-200', green: 'bg-emerald-50 border-emerald-200', gray: 'bg-gray-50 border-gray-200' };
    const urgencyText = { red: 'text-red-600', amber: 'text-amber-600', green: 'text-emerald-600', gray: 'text-gray-500' };

    return (
      <div className={`rounded-2xl border p-4 ${urgencyBg[urgency]}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className={`w-4 h-4 ${urgencyText[urgency]}`} />
              <span className="text-xs font-semibold text-gray-500">{a.subject_name}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-1">{a.title}</h3>
            {a.description && <p className="text-xs text-gray-500 leading-relaxed">{a.description}</p>}
            <p className="text-xs text-gray-400 mt-2">Teacher: {a.teacher_name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-blue-600">{a.max_marks} marks</p>
            {daysLeft !== null && (
              <p className={`text-xs font-semibold mt-1 ${urgencyText[urgency]}`}>
                {daysLeft === 0 ? 'Due today!' : daysLeft < 0 ? 'Overdue' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
              </p>
            )}
            {a.due_date && (
              <p className="text-xs text-gray-400 mt-0.5">{new Date(a.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout role="student" title="Assignments">
      <SectionHeader title="My Assignments" subtitle={`${assignments.length} total assignments`} />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> Upcoming ({upcoming.length})
              </h3>
              <div className="space-y-3">
                {upcoming.map(a => <AssignmentCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Past / No Deadline ({past.length})
              </h3>
              <div className="space-y-3">
                {past.map(a => <AssignmentCard key={a.id} a={a} />)}
              </div>
            </div>
          )}
          {assignments.length === 0 && <div className="card text-center py-12 text-gray-400">No assignments yet</div>}
        </div>
      )}
    </DashboardLayout>
  );
}

export function StudentAnnouncementsPage() {
  const [anns, setAnns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.announcements().then(r => setAnns(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout role="student" title="Announcements">
      <SectionHeader title="School Announcements" subtitle="Latest updates from school management" />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">
          {anns.length === 0
            ? <div className="card text-center py-12 text-gray-400">No announcements</div>
            : anns.map(a => (
            <div key={a.id} className="card border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-2" style={{ fontFamily: 'Sora' }}>{a.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{a.content}</p>
                  <p className="text-gray-400 text-xs mt-3">
                    {new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold flex-shrink-0">
                  {a.target_roles === 'all' ? 'Everyone' : 'Students'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
