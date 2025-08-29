import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { AuthState, Action } from '../../types';
import { Dispatch } from 'react';

export const useAuthContext = (): { authState: AuthState; dispatch: Dispatch<Action> } => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AppProvider');
  }
  
  return context;
};