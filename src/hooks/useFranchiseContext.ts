import { useContext } from 'react';
import { FranchiseContext } from '../../context/FranchiseContext';
import { FranchiseState, Action } from '../../types';
import { Dispatch } from 'react';

export const useFranchiseContext = (): { franchiseState: FranchiseState; dispatch: Dispatch<Action> } => {
  const context = useContext(FranchiseContext);
  
  if (context === undefined) {
    throw new Error('useFranchiseContext must be used within an AppProvider');
  }
  
  return context;
};