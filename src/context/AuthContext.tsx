import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AuthState } from '../types';

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateState: (updates: Partial<AuthState>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getInitialState = (): AuthState => ({
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
  familyAssociations: [],
});

interface AuthProviderProps {
  children: ReactNode;
  initialState?: Partial<AuthState>;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialState }) => {
  const [state, setState] = useState<AuthState>({
    ...getInitialState(),
    ...initialState,
  });

  const login = async (email: string, _password: string) => {
    // Stub implementation
    setState({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        email,
        role: 'coach',
        firstName: 'Test',
        lastName: 'User',
        notifications: {
          email: true,
          sms: false,
          push: true,
          matchUpdates: true,
          trainingReminders: true,
          emergencyAlerts: true,
          paymentReminders: false,
        },
        timezone: 'UTC',
        language: 'en',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      error: null,
      familyAssociations: [],
    });
  };

  const logout = () => {
    setState(getInitialState());
  };

  const updateState = (updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ state, login, logout, updateState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

export default AuthProvider;
