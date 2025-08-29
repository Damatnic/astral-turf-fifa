import { useContext } from 'react';
import { UIContext } from '../../context/UIContext';
import { UIState, Action } from '../../types';
import { Dispatch } from 'react';

export const useUIContext = (): { uiState: UIState; dispatch: Dispatch<Action> } => {
  const context = useContext(UIContext);
  
  if (context === undefined) {
    throw new Error('useUIContext must be used within an AppProvider');
  }
  
  return context;
};