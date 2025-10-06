import { createContext, type Dispatch } from 'react';
import type { AuthState, Action } from '../types';
import { INITIAL_STATE } from '../constants';

export const AuthContext = createContext<{ authState: AuthState; dispatch: Dispatch<Action> }>({
  authState: INITIAL_STATE.auth,
  dispatch: () => null,
});
