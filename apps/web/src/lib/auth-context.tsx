'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { LoginInput, RegisterInput } from '@sourcing/shared';
import { api, ApiError } from './api-client';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface SessionUser {
  id: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}

interface AuthContextValue {
  user: SessionUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Enrobe un appel authentifié — rejoue une fois après un refresh si le token a expiré. */
  authFetch: <T>(fn: (accessToken: string) => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Le refresh token vit en localStorage (seule option persistante sans backend-for-frontend
// à cookies httpOnly) ; l'access token, lui, ne quitte jamais la mémoire du contexte React —
// il ne survit pas à un rechargement de page, ce qui limite l'exposition en cas de XSS.
const REFRESH_TOKEN_KEY = 'sourcing.refreshToken';

function decodeAccessToken(token: string): SessionUser {
  const payloadBase64 = token.split('.').at(1);
  if (!payloadBase64) throw new Error('Jeton d\'accès malformé.');
  const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
  return { id: payload.sub, roleId: payload.roleId, roleName: payload.roleName, permissions: payload.permissions ?? [] };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applyTokens = useCallback((tokens: AuthTokens) => {
    setAccessToken(tokens.accessToken);
    setUser(decodeAccessToken(tokens.accessToken));
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    api
      .post<AuthTokens>('/auth/refresh', { refreshToken: stored })
      .then(applyTokens)
      .catch(() => clearSession())
      .finally(() => setIsLoading(false));
  }, [applyTokens, clearSession]);

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await api.post<AuthTokens | { mfaRequired: true; mfaChallenge: string }>(
        '/auth/login',
        input,
      );
      if ('mfaRequired' in result) {
        throw new Error("Ce compte nécessite une vérification MFA, non prise en charge sur cette interface pour l'instant.");
      }
      applyTokens(result);
    },
    [applyTokens],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const result = await api.post<AuthTokens>('/auth/register', input);
      applyTokens(result);
    },
    [applyTokens],
  );

  const logout = useCallback(async () => {
    const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      await api.post('/auth/logout', { refreshToken: stored }).catch(() => undefined);
    }
    clearSession();
  }, [clearSession]);

  const authFetch = useCallback(
    async <T,>(fn: (accessToken: string) => Promise<T>): Promise<T> => {
      if (!accessToken) throw new ApiError(401, 'Non authentifié.');
      try {
        return await fn(accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error;

        const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!stored) {
          clearSession();
          throw error;
        }
        const tokens = await api.post<AuthTokens>('/auth/refresh', { refreshToken: stored }).catch(() => {
          clearSession();
          throw error;
        });
        applyTokens(tokens);
        return fn(tokens.accessToken);
      }
    },
    [accessToken, applyTokens, clearSession],
  );

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé à l\'intérieur de <AuthProvider>.');
  return ctx;
}
