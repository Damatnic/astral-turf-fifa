import { createContext, type Dispatch } from 'react';
import type { TacticsState, Action } from '../types';
import { INITIAL_STATE } from '../constants';

export const TacticsContext = createContext<{
  tacticsState: TacticsState;
  dispatch: Dispatch<Action>;
}>({
  tacticsState: INITIAL_STATE.tactics,
  dispatch: () => null,
});
