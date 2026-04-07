'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/boards');
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;
  if (user) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
        Organise your work with <span className="text-indigo-600">Latra</span>
      </h1>
      <p className="text-lg text-gray-500 max-w-xl mb-10">
        A simple, fast Kanban board. Create boards, manage tasks across columns, assign teammates, and track deadlines — all in one place.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/signup"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
        >
          Get started for free
        </Link>
        <Link
          href="/login"
          className="border border-gray-300 hover:border-indigo-400 text-gray-700 hover:text-indigo-600 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl w-full text-left">
        {[
          { icon: '📋', title: 'Boards & Lists', body: 'Create boards with fully customisable lists to match any workflow.' },
          { icon: '🃏', title: 'Cards & Deadlines', body: 'Add cards with descriptions and deadlines. Drag them across columns as work progresses.' },
          { icon: '👥', title: 'Team Collaboration', body: 'Invite teammates to boards and assign cards to individuals.' },
        ].map(({ icon, title, body }) => (
          <div key={title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
