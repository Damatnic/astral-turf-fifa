import { createContext, type Dispatch } from 'react';
import type { AuthState, Action } from '../types';

export const AuthContext = createContext<
  { authState: AuthState; dispatch: Dispatch<Action> } | undefined
>(undefined);

export { AuthProvider, useAuthContext } from './AuthContext.tsx';
