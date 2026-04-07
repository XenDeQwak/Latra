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
    <div className="min-h-screen bg-gradient-to-br from-[#0052cc] to-[#0079bf] flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
        Organise your work with <span className="text-white/80">Latra</span>
      </h1>
      <p className="text-lg text-white/70 max-w-xl mb-10">
        A simple, fast Kanban board. Create boards, manage tasks across columns, assign teammates, and track deadlines — all in one place.
      </p>
      <div className="flex items-center gap-4">
        <Link
          href="/signup"
          className="bg-white text-[#0052cc] hover:bg-white/90 font-semibold px-6 py-3 rounded-xl text-sm transition-colors shadow-sm"
        >
          Get started for free
        </Link>
        <Link
          href="/login"
          className="border border-white/50 text-white hover:bg-white/10 font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
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
          <div key={title} className="bg-white/10 backdrop-blur rounded-2xl border border-white/20 p-6">
            <div className="text-3xl mb-3">{icon}</div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-white/70 leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
