'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setAuth } from '@/lib/api';
import { GraduationCap, Eye, EyeOff, BookOpen, Users, Brain, BarChart3 } from 'lucide-react';

const DEMO_CREDENTIALS = [
  { role: 'Admin', username: 'vijayalakshmi.iyer', password: 'admin123', color: 'blue' },
  { role: 'Teacher', username: 'lakshmi_narayanan', password: 'teacher123', color: 'purple' },
  { role: 'Student', username: 'student0001', password: 'student123', color: 'green' },
  { role: 'Parent', username: 'parent0001', password: 'parent123', color: 'amber' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (u?: string, p?: string) => {
    const user_input = u || username;
    const pass_input = p || password;
    if (!user_input || !pass_input) {
      setError('Please enter username and password');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await authApi.login(user_input, pass_input);
      const { access_token, user } = res.data;
      setAuth(access_token, user);

      const roleRoutes: Record<string, string> = {
        admin: '/dashboard/admin',
        teacher: '/dashboard/teacher',
        student: '/dashboard/student',
        parent: '/dashboard/parent',
      };
      router.push(roleRoutes[user.role] || '/dashboard/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setUsername(cred.username);
    setPassword(cred.password);
    handleLogin(cred.username, cred.password);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3B82F6, transparent)', transform: 'translate(-50%, -50%)' }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)', transform: 'translate(50%, 50%)' }} />
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora' }}>Vidya Jyothi</h1>
              <p className="text-blue-300 text-sm">AI Smart School System</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Sora' }}>
            Empowering<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Excellence
            </span><br />
            in Education
          </h2>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">
            AI-powered school management for CBSE schools in Tamil Nadu. 
            Complete attendance, grades, ML insights, and smart analytics.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Users, label: '300+ Students', desc: 'Grades 1–12' },
              { icon: Brain, label: 'ML Predictions', desc: 'Learning pace analysis' },
              { icon: BarChart3, label: 'Smart Analytics', desc: 'Real-time dashboards' },
              { icon: BookOpen, label: 'CBSE Curriculum', desc: '7 subjects tracked' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.2)' }}>
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">Vidya Jyothi</h1>
          </div>

          <div className="rounded-3xl p-8 shadow-2xl" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)' }}>
            <h3 className="text-2xl font-bold text-gray-800 mb-1" style={{ fontFamily: 'Sora' }}>Welcome back</h3>
            <p className="text-gray-500 text-sm mb-6">Sign in to your school dashboard</p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username / Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  placeholder="Enter your username"
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Enter your password"
                    className="form-input pr-10"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleLogin()}
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-70"
                style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in to Dashboard'}
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">Quick Demo Login</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_CREDENTIALS.map(cred => (
                  <button
                    key={cred.role}
                    onClick={() => quickLogin(cred)}
                    disabled={loading}
                    className="py-2 px-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 border"
                    style={{
                      background: cred.color === 'blue' ? '#eff6ff' : cred.color === 'purple' ? '#f5f3ff' : cred.color === 'green' ? '#f0fdf4' : '#fffbeb',
                      color: cred.color === 'blue' ? '#1d4ed8' : cred.color === 'purple' ? '#6d28d9' : cred.color === 'green' ? '#15803d' : '#92400e',
                      borderColor: cred.color === 'blue' ? '#bfdbfe' : cred.color === 'purple' ? '#ddd6fe' : cred.color === 'green' ? '#bbf7d0' : '#fde68a',
                    }}
                  >
                    {cred.role} Login
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              Vidya Jyothi CBSE School · Chennai, Tamil Nadu
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
