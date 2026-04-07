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
    <nav className="bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md border-b border-indigo-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-indigo-200 hover:scale-105 transition-all duration-200">
            Latra
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-indigo-200">
                  {user.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-indigo-900/60 hover:bg-indigo-900 active:scale-95 px-3 py-1.5 rounded-md transition-all duration-150"
                >
                  Logout
                </button>
              </>
            ) : !isAuthPage ? (
              <>
                <Link href="/login" className="text-sm hover:text-indigo-200 transition-colors">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm bg-indigo-900/60 hover:bg-indigo-900 active:scale-95 px-3 py-1.5 rounded-md transition-all duration-150"
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
