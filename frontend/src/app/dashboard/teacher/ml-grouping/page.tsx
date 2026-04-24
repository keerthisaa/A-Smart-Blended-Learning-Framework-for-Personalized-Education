'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout, SectionHeader, LoadingSpinner, Badge } from '@/components/ui';
import { teacherApi } from '@/lib/api';
import { Brain, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';

export default function MLGroupingPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<number | null>(null);

  useEffect(() => {
    teacherApi.dashboard().then(res => {
      const s = res.data.sections || [];
      setSections(s);
      if (s.length > 0) setSelectedSection(s[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedSection) return;
    setLoading(true);
    teacherApi.mlGrouping(selectedSection)
      .then(r => setGroupData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedSection]);

  const groups = groupData?.groups || {};
  const dist = groupData?.distribution || {};

  const GROUP_CONFIG = {
    fast: {
      label: 'Fast Learners',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700'
    },
    average: {
      label: 'Average Learners',
      icon: Minus,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      badge: 'bg-blue-100 text-blue-700'
    },
    slow: {
      label: 'Need Extra Support',
      icon: TrendingDown,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-700'
    },
  };

  return (
    <DashboardLayout role="teacher" title="ML Grouping">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Sora' }}>ML Student Grouping</h2>
            <p className="text-sm text-gray-500">AI-powered learning pace classification for Grades 6–12</p>
          </div>
        </div>
      </div>

      {/* Section selector */}
      <div className="card mb-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Select Section</label>
            <select className="form-input" value={selectedSection || ''} onChange={e => setSelectedSection(Number(e.target.value))}>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {groupData?.available === false && (
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm text-amber-700 font-medium">⚠ ML insights available only for Grades 6–12</p>
            </div>
          )}
        </div>
      </div>

      {loading ? <LoadingSpinner message="Running ML analysis..." /> : groupData?.available === false ? (
        <div className="card text-center py-12">
          <Brain className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-gray-500 font-semibold">ML Not Available</h3>
          <p className="text-gray-400 text-sm mt-1">ML predictions are only available for students in Grades 6–12</p>
        </div>
      ) : groupData ? (
        <>
          {/* Distribution summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(GROUP_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={key} className={`rounded-2xl p-4 ${cfg.bg} border ${cfg.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
                  </div>
                  <p className={`text-3xl font-bold ${cfg.text}`} style={{ fontFamily: 'Sora' }}>{dist[key] || 0}</p>
                  <p className={`text-xs ${cfg.text} opacity-70 mt-1`}>
                    {groupData.total ? Math.round((dist[key] || 0) / groupData.total * 100) : 0}% of class
                  </p>
                </div>
              );
            })}
          </div>

          {/* Groups */}
          <div className="space-y-5">
            {Object.entries(GROUP_CONFIG).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const groupStudents = groups[key] || [];
              if (groupStudents.length === 0) return null;

              return (
                <div key={key} className="card p-0 overflow-hidden">
                  <div className={`flex items-center gap-3 p-4 bg-gradient-to-r ${cfg.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                    <h3 className="font-bold text-white" style={{ fontFamily: 'Sora' }}>{cfg.label}</h3>
                    <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{groupStudents.length} students</span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {groupStudents.map((s: any) => (
                      <div key={s.student_id} className="px-4 py-3">
                        <div
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedStudent(expandedStudent === s.student_id ? null : s.student_id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${cfg.color} text-white font-bold text-xs flex items-center justify-center`}>
                              {s.student_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{s.student_name}</p>
                              <p className="text-xs text-gray-400">Confidence: {(s.confidence * 100).toFixed(0)}%</p>
                            </div>
                          </div>
                          <button className="text-gray-400">
                            {expandedStudent === s.student_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                        {expandedStudent === s.student_id && (
                          <div className={`mt-3 p-3 rounded-xl ${cfg.bg} border ${cfg.border}`}>
                            <div className="flex items-start gap-2">
                              <Lightbulb className={`w-4 h-4 ${cfg.text} mt-0.5 flex-shrink-0`} />
                              <p className={`text-xs ${cfg.text} leading-relaxed`}>{s.recommendation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </DashboardLayout>
  );
}
