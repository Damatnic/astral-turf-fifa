// Authentication and user related types

export interface User {
  id: string;
  email: string;
  role: 'coach' | 'player';
  // For players, this links to their player data
  playerId?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}
