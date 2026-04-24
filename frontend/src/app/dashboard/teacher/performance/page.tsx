'use client';
import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, LoadingSpinner } from '@/components/ui';
import { teacherApi } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TeacherPerformancePage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [data, setData] = useState<any>(null);
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
    teacherApi.performance(selected).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [selected]);

  return (
    <DashboardLayout role="teacher" title="Performance Analytics">
      <SectionHeader title="Class Performance" subtitle="Analyze student and subject-wise performance" />
      <div className="card mb-5">
        <select className="form-input max-w-xs" value={selected||''} onChange={e => setSelected(Number(e.target.value))}>
          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      {loading ? <LoadingSpinner /> : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card">
            <SectionHeader title="Subject Averages" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.subject_averages||[]} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="subject" tick={{fontSize:10}} angle={-20} textAnchor="end" height={40} />
                <YAxis domain={[0,100]} tickFormatter={v=>`${v}%`} tick={{fontSize:11}} />
                <Tooltip formatter={(v:any)=>[`${v}%`,'Average']} contentStyle={{borderRadius:12,border:'none'}} />
                <Bar dataKey="average" fill="#8B5CF6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <SectionHeader title="Top 10 Students" />
            <div className="space-y-2.5">
              {(data.student_ranking||[]).map((s:any, i:number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${i===0?'bg-amber-100 text-amber-700':i===1?'bg-gray-100 text-gray-600':i===2?'bg-orange-100 text-orange-600':'bg-gray-50 text-gray-400'}`}>{i+1}</span>
                  <span className="text-sm text-gray-700 flex-1 truncate">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-2"><div className="h-2 bg-blue-500 rounded-full" style={{width:`${s.average}%`}} /></div>
                    <span className="text-sm font-bold text-gray-700 w-12 text-right">{s.average}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
