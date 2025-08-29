import { useContext } from 'react';
import { TacticsContext } from '../../context/TacticsContext';
import { TacticsState, Action } from '../../types';
import { Dispatch } from 'react';

export const useTacticsContext = (): { tacticsState: TacticsState; dispatch: Dispatch<Action> } => {
  const context = useContext(TacticsContext);
  
  if (context === undefined) {
    throw new Error('useTacticsContext must be used within an AppProvider');
  }
  
  return context;
};