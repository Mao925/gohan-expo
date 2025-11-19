'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { User } from '@/lib/types';

const TOKEN_STORAGE_KEY = 'gohan_token';

type Credentials = {
  email: string;
  password: string;
};

type RegisterPayload = Credentials & {
  name: string;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (payload: Credentials) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const persistToken = useCallback((nextToken: string | null) => {
    if (typeof window === 'undefined') return;
    if (nextToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const me = await apiFetch<User>('/api/auth/me', { token });
      setUser(me);
    } catch (error) {
      setUser(null);
      setToken(null);
      persistToken(null);
    }
  }, [token, persistToken]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    (async () => {
      try {
        const me = await apiFetch<User>('/api/auth/me', { token: storedToken });
        setUser(me);
      } catch (error) {
        setToken(null);
        persistToken(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [persistToken]);

  const handleAuthSuccess = useCallback(
    (payload: { token: string; user: User }) => {
      setToken(payload.token);
      persistToken(payload.token);
      setUser(payload.user);
    },
    [persistToken]
  );

  const login = useCallback(
    async (payload: Credentials) => {
      const result = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        data: payload
      });
      handleAuthSuccess(result);
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        data: payload
      });
      handleAuthSuccess(result);
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persistToken(null);
  }, [persistToken]);

  const value: AuthContextValue = {
    token,
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
