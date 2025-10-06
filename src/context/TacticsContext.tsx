import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type { TacticsState } from '../types';

interface TacticsContextValue {
  state: TacticsState;
  dispatch: React.Dispatch<TacticsAction>;
}

type TacticsAction =
  | { type: 'SET_PLAYERS'; payload: TacticsState['players'] }
  | { type: 'SET_FORMATION'; payload: { id: string; formation: any } }
  | { type: 'UPDATE_STATE'; payload: Partial<TacticsState> };

const TacticsContext = createContext<TacticsContextValue | undefined>(undefined);

const tacticsReducer = (state: TacticsState, action: TacticsAction): TacticsState => {
  switch (action.type) {
    case 'SET_PLAYERS':
      return { ...state, players: action.payload };
    case 'SET_FORMATION':
      return {
        ...state,
        formations: { ...state.formations, [action.payload.id]: action.payload.formation },
      };
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const getInitialState = (): TacticsState => ({
  players: [],
  formations: {},
  playbook: {},
  activeFormationIds: { home: '', away: '' },
  teamTactics: { home: {} as any, away: {} as any },
  drawings: [],
  tacticalFamiliarity: {},
  chemistry: {},
  captainIds: { home: null, away: null },
  setPieceTakers: { home: {} as any, away: {} as any },
});

interface TacticsProviderProps {
  children: ReactNode;
  initialState?: Partial<TacticsState>;
}

export const TacticsProvider: React.FC<TacticsProviderProps> = ({ children, initialState }) => {
  const [state, dispatch] = useReducer(tacticsReducer, { ...getInitialState(), ...initialState });

  return <TacticsContext.Provider value={{ state, dispatch }}>{children}</TacticsContext.Provider>;
};

export const useTacticsContext = () => {
  const context = useContext(TacticsContext);
  if (!context) {
    throw new Error('useTacticsContext must be used within TacticsProvider');
  }
  return context;
};

export default TacticsProvider;
