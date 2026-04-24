'use client';
import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/ui';
import { aiApi, getUser } from '@/lib/api';
import { Send, Bot, Sparkles, RotateCcw } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date; }

export default function StudentAIPage() {
  const user = getUser();
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hi ${firstName}! 👋 I'm your AI study helper!\n\nI can help you:\n📚 **Understand concepts** from any CBSE subject\n✏️ **Guide you through problems** step by step\n🎯 **Prepare for exams** with effective strategies\n\n*I'll help you understand — not just give you answers!*\n\nWhat would you like to learn today?`,
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const suggestions = ['Explain photosynthesis simply', 'Help with quadratic equations', 'How to write a good essay?', 'Explain the French Revolution', 'Tips for exam preparation'];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setMessages(p => [...p, { role: 'user', content: msg, timestamp: new Date() }]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await aiApi.chat(msg, history);
      setMessages(p => [...p, { role: 'assistant', content: res.data.response, timestamp: new Date() }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: "Sorry, I'm having trouble right now. Please try again! 🙏", timestamp: new Date() }]);
    } finally { setLoading(false); }
  };

  const fmt = (c: string) => c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  return (
    <DashboardLayout role="student" title="AI Homework Helper">
      <div className="flex flex-col h-[calc(100vh-160px)] max-h-[700px]">
        <div className="rounded-2xl p-5 mb-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
            <div>
              <h2 className="font-bold" style={{ fontFamily: 'Sora' }}>AI Homework Helper</h2>
              <p className="text-white/70 text-xs">CBSE curriculum · Study guidance only</p>
            </div>
          </div>
          <button onClick={() => setMessages([{ role: 'assistant', content: 'Chat cleared! What would you like to learn?', timestamp: new Date() }])} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Clear chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${m.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-slate-700'}`}>
                {m.role === 'user' ? (user?.full_name?.charAt(0) || 'S') : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-tr-sm' : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'}`}>
                <div dangerouslySetInnerHTML={{ __html: fmt(m.content) }} />
                <p className={`text-xs mt-1 ${m.role === 'user' ? 'text-white/60' : 'text-gray-300'}`}>
                  {m.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><Bot className="w-4 h-4 text-white" /></div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-600 px-3 py-2 rounded-xl transition-all">
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask me anything about your studies..."
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${input.trim() && !loading ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg' : 'bg-gray-100 text-gray-300'}`}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
