
import { createContext, Dispatch } from 'react';
import { UIState, Action } from '../types';
import { INITIAL_STATE } from '../constants';

export const UIContext = createContext<{ uiState: UIState; dispatch: Dispatch<Action> }>({
  uiState: INITIAL_STATE.ui,
  dispatch: () => null,
});
