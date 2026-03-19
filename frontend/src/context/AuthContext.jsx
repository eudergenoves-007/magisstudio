import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const USER_KEY = 'magis_mock_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to read the mock user from localStorage on load
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // In our Mock, we allow any login if email and password are provided.
    // Real validation is skipped for this frontend-only demo.
    if (!email || !password) throw new Error('Credenciales faltantes');

    const userData = {
      _id: 'mock_' + Date.now().toString(),
      username: email.split('@')[0],
      email: email,
      role: 'admin',
      avatar: { url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}` }
    };

    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (username, email, password) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!username || !email || !password) throw new Error('Campos incompletos');

    const userData = {
      _id: 'mock_' + Date.now().toString(),
      username: username,
      email: email,
      role: 'contributor',
      avatar: { url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` }
    };

    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
