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
    <nav className="bg-indigo-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-indigo-200 transition-colors">
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
                  className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded-md transition-colors"
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
                  className="text-sm bg-indigo-800 hover:bg-indigo-900 px-3 py-1.5 rounded-md transition-colors"
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
