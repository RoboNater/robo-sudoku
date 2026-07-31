import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';

import { createNewGame, gameReducer, type GameAction, type GameState } from './game-reducer';

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, 'easy', createNewGame);
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGame(): GameState {
  const state = useContext(GameStateContext);
  if (!state) throw new Error('useGame must be used within GameProvider');
  return state;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = useContext(GameDispatchContext);
  if (!dispatch) throw new Error('useGameDispatch must be used within GameProvider');
  return dispatch;
}
