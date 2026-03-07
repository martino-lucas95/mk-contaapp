import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  credentialsToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setCredentialsToken: (token: string, expiresInMs?: number) => void;
  clearCredentialsToken: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      credentialsToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setCredentialsToken: (token, expiresInMs = 5 * 60 * 1000) => {
        set({ credentialsToken: token });
        setTimeout(() => set({ credentialsToken: null }), expiresInMs);
      },
      clearCredentialsToken: () => set({ credentialsToken: null }),
      logout: () =>
        set({ user: null, accessToken: null, refreshToken: null, credentialsToken: null, isAuthenticated: false }),
    }),
    { name: 'contaapp-auth' },
  ),
);
