import { useContext } from 'react';
import { UIContext } from '../context/UIContext';

export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within an AppProvider');
  }
  return context;
};
