'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  return (
    <nav className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md group-hover:bg-indigo-400 transition-colors duration-200">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors duration-200">
              Latra
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 bg-white/5 rounded-full pl-2 pr-3 py-1.5 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold uppercase">
                    {user.username[0]}
                  </div>
                  <span className="text-sm text-slate-300 font-medium">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 px-4 py-1.5 rounded-full transition-all duration-150"
                >
                  Sign out
                </button>
              </>
            ) : !isAuthPage ? (
              <>
                <Link
                  href="/login"
                  className="text-sm text-slate-300 hover:text-white transition-colors duration-150"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white px-4 py-1.5 rounded-full transition-all duration-150 shadow-sm"
                >
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
