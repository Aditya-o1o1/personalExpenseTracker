import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, tokenStore } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const refreshProfile = useCallback(async () => {
    const result = await apiRequest('/profile');
    setUser(result.profile);
    return result.profile;
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('spendwise:unauthorized', handleUnauthorized);
    if (!tokenStore.get()) {
      setReady(true);
      return () => window.removeEventListener('spendwise:unauthorized', handleUnauthorized);
    }
    refreshProfile()
      .catch(() => {
        tokenStore.clear();
        setUser(null);
      })
      .finally(() => setReady(true));
    return () => window.removeEventListener('spendwise:unauthorized', handleUnauthorized);
  }, [refreshProfile]);

  const login = async (credentials) => {
    const result = await apiRequest('/auth/login', { method: 'POST', body: credentials, token: null });
    tokenStore.set(result.token);
    try {
      await refreshProfile();
    } catch (error) {
      tokenStore.clear();
      setUser(null);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, setUser, ready, login, logout, refreshProfile }),
    [user, ready, refreshProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
