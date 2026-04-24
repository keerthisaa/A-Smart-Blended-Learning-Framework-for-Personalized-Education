'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, isAuthenticated } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      const routes: Record<string, string> = {
        admin: '/dashboard/admin',
        teacher: '/dashboard/teacher',
        student: '/dashboard/student',
        parent: '/dashboard/parent',
      };
      router.replace(routes[user?.role] || '/login');
    } else {
      router.replace('/login');
    }
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
        <p className="text-gray-500 text-sm">Loading Vidya Jyothi...</p>
      </div>
    </div>
  );
}
