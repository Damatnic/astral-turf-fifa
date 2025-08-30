import { useContext } from 'react';
import { FranchiseContext } from '../context/FranchiseContext';

export const useFranchiseContext = () => {
  const context = useContext(FranchiseContext);
  if (context === undefined) {
    throw new Error('useFranchiseContext must be used within an AppProvider');
  }
  return context;
};