import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';

import {
  createEmptyGame,
  createNewGame,
  gameReducer,
  type GameAction,
  type GameState,
} from './game-reducer';
import { GAME_KEY, parseGame, serializeGame } from './game-store';
import { getItem, readsBeforeHydration, removeItem, setItem } from './storage';

/** Play is bursty; one write per pause instead of one per digit. */
const SAVE_DEBOUNCE_MS = 400;

const DEFAULT_DIFFICULTY = 'easy';

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

/** The stored game if there is one, otherwise a freshly dealt puzzle. */
function restoredOrNewGame(): GameState {
  return parseGame(getItem(GAME_KEY)) ?? createNewGame(DEFAULT_DIFFICULTY);
}

function initialGame(): GameState {
  return readsBeforeHydration ? restoredOrNewGame() : createEmptyGame();
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialGame);

  // Web starts blank because the static render cannot reach storage; the real
  // board arrives on the first client render.
  useEffect(() => {
    if (readsBeforeHydration) return;
    dispatch({ type: 'HYDRATE', state: restoredOrNewGame() });
  }, []);

  // Write-through, debounced. The blank pre-hydration board has no puzzle, which
  // is also what keeps it from overwriting a real game in progress.
  useEffect(() => {
    if (!state.meta) return;
    if (state.status === 'won') {
      removeItem(GAME_KEY);
      return;
    }
    const timer = setTimeout(() => {
      const serialized = serializeGame(state);
      if (serialized) setItem(GAME_KEY, serialized);
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state]);

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
