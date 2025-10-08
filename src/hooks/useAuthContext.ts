import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.ts';

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AppProvider');
  }
  return context;
};
