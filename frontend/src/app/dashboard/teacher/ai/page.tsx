'use client';

import { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/ui';
import { aiApi, getUser } from '@/lib/api';
import { Send, Bot, User, Sparkles, BookOpen, Brain, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function AIAssistantContent({ role }: { role: string }) {
  const user = getUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ROLE_CONFIG = {
    teacher: {
      title: 'AI Teaching Assistant',
      subtitle: 'Get pedagogical strategies, classroom insights, and student support tips',
      greeting: `Hello! I'm your AI teaching assistant. I can help you with:\n\n📋 **Teaching strategies** for different learning levels\n🎯 **Lesson planning** ideas for CBSE curriculum\n📊 **Student performance** analysis guidance\n💡 **Differentiated instruction** techniques\n\nWhat would you like help with today?`,
      suggestions: ['How to help slow learners in Math?', 'Suggest activities for Grade 8 Science', 'How to conduct formative assessment?', 'Tips for parent-teacher communication'],
      color: 'from-violet-600 to-purple-700',
    },
    student: {
      title: 'AI Homework Helper',
      subtitle: 'Get concept explanations, study tips, and exam preparation guidance',
      greeting: `Hi there! I'm your AI study assistant! I'm here to help you:\n\n📚 **Understand concepts** from any subject\n✏️ **Guide you through problems** step by step\n🎯 **Prepare for exams** with smart strategies\n💡 **Give study tips** to improve your scores\n\n*Note: I'll help you understand, not give direct answers!*\n\nWhat would you like to learn today?`,
      suggestions: ['Explain photosynthesis simply', 'Help me understand fractions', 'How to write a good essay?', 'Tips for studying before exams'],
      color: 'from-emerald-500 to-teal-600',
    },
    admin: {
      title: 'AI Analytics Assistant',
      subtitle: 'School analytics, improvement strategies, and management insights',
      greeting: `Hello! I'm your school analytics assistant. I can help you with:\n\n📊 **Interpreting performance data** and trends\n🎯 **Strategic recommendations** for school improvement\n👥 **Resource allocation** and planning guidance\n📈 **Attendance and ML insights** interpretation\n\nHow can I assist you today?`,
      suggestions: ['How to improve school attendance?', 'Interpreting ML prediction data', 'Strategies for Grade 10 performance', 'How to support slow learners at scale?'],
      color: 'from-blue-600 to-indigo-700',
    },
    parent: {
      title: 'Parent Support Assistant',
      subtitle: 'Understand your child\'s progress and get support tips',
      greeting: `Hello! I'm here to help you support your child's education. I can help with:\n\n📚 **Understanding your child's progress** reports\n🏠 **Home study strategies** that actually work\n🤝 **How to communicate** with teachers effectively\n💪 **Motivating your child** during tough times\n\nWhat would you like to know?`,
      suggestions: ['How to help my child study at home?', 'My child is struggling with Math', 'How to talk to teachers about performance?', 'Signs of academic stress in children'],
      color: 'from-amber-500 to-orange-600',
    },
  };

  const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.student;

  // Initialize with greeting
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: config.greeting,
      timestamp: new Date()
    }]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMsg: Message = { role: 'user', content: messageText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await aiApi.chat(messageText, history);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having a bit of trouble right now. Please try again in a moment! 🙏",
        timestamp: new Date()
      }]);
    } finally { setLoading(false); }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: config.greeting, timestamp: new Date() }]);
  };

  return (
    <DashboardLayout role={role} title={config.title}>
      <div className="flex flex-col h-[calc(100vh-160px)] max-h-[700px]">
        {/* Header */}
        <div className={`rounded-2xl p-5 mb-4 bg-gradient-to-r ${config.color} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontFamily: 'Sora' }}>{config.title}</h2>
              <p className="text-white/70 text-xs">{config.subtitle}</p>
            </div>
          </div>
          <button onClick={clearChat} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors" title="Clear chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                msg.role === 'user' ? `bg-gradient-to-br ${config.color}` : 'bg-slate-700'
              }`}>
                {msg.role === 'user' ? (user?.full_name?.charAt(0) || 'U') : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? `bg-gradient-to-br ${config.color} text-white rounded-tr-sm`
                  : 'bg-white border border-gray-100 shadow-sm text-gray-700 rounded-tl-sm'
              }`}>
                <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-300'}`}>
                  {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="flex gap-2 flex-wrap mb-3">
            {config.suggestions.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 px-3 py-2 rounded-xl transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-3 bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your question..."
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              input.trim() && !loading
                ? `bg-gradient-to-br ${config.color} text-white shadow-md hover:shadow-lg hover:scale-105`
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function TeacherAIPage() {
  return <AIAssistantContent role="teacher" />;
}
