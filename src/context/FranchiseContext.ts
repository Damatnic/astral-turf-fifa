import { createContext, type Dispatch } from 'react';
import type { FranchiseState, Action } from '../types';
import { INITIAL_STATE } from '../constants';

export const FranchiseContext = createContext<{
  franchiseState: FranchiseState;
  dispatch: Dispatch<Action>;
}>({
  franchiseState: INITIAL_STATE.franchise,
  dispatch: () => null,
});
