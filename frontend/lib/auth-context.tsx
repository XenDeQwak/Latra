'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('latra_user');
      if (stored) setUserState(JSON.parse(stored) as User);
    } catch {
      // ignore malformed data
    }
    setIsLoading(false);
  }, []);

  const setUser = (u: User) => {
    setUserState(u);
    localStorage.setItem('latra_user', JSON.stringify(u));
  };

  const logout = () => {
    setUserState(null);
    localStorage.removeItem('latra_user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
