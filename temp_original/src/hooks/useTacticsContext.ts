import { useContext } from 'react';
import { TacticsContext } from '../context/TacticsContext';

export const useTacticsContext = () => {
  const context = useContext(TacticsContext);
  if (context === undefined) {
    throw new Error('useTacticsContext must be used within an AppProvider');
  }
  return context;
};
