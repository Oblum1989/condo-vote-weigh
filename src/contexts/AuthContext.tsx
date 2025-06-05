
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin_votacion' | 'admin_asistencias' | null;

interface User {
  role: UserRole;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Credenciales por rol (en producción esto estaría en el backend)
const CREDENTIALS = {
  admin_votacion: { username: 'admin_votacion', password: 'admin123' },
  admin_asistencias: { username: 'admin_asistencias', password: 'asist123' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Restaurar sesión del localStorage
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string, role: UserRole): boolean => {
    if (!role || !CREDENTIALS[role]) return false;
    
    const credentials = CREDENTIALS[role];
    if (credentials.username === username && credentials.password === password) {
      const newUser = { role, username };
      setUser(newUser);
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
