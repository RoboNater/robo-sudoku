import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react';

import {
  createEmptyGame,
  createNewGame,
  gameReducer,
  type GameAction,
  type GameState,
  type NotePrefs,
} from './game-reducer';
import { GAME_KEY, parseGame, serializeGame } from './game-store';
import { useSettings } from './settings-context';
import { getItem, readsBeforeHydration, removeItem, setItem } from './storage';

/** Play is bursty; one write per pause instead of one per digit. */
const SAVE_DEBOUNCE_MS = 400;

const DEFAULT_DIFFICULTY = 'easy';

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

/**
 * The stored game if there is one, otherwise a freshly dealt puzzle. Only the
 * fresh puzzle consults the settings seed — a restored game carries its own
 * note preferences, which the player may have changed since.
 */
function restoredOrNewGame(prefs: NotePrefs): GameState {
  return parseGame(getItem(GAME_KEY)) ?? createNewGame(DEFAULT_DIFFICULTY, prefs);
}

export function GameProvider({ children }: { children: ReactNode }) {
  const settings = useSettings();
  const prefs: NotePrefs = { notesMode: false, autoClearNotes: settings.autoClearNotes };

  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    readsBeforeHydration ? restoredOrNewGame(prefs) : createEmptyGame(prefs),
  );

  // Held in a ref so the one-shot hydration effect below can read the latest
  // seed without re-running (and re-dealing the board) on every change to it.
  const prefsRef = useRef(prefs);
  useEffect(() => {
    prefsRef.current = prefs;
  });

  // Web starts blank because the static render cannot reach storage; the real
  // board arrives once the client has mounted — and only once the settings have
  // been read too, or a fresh game would be seeded from the defaults.
  useEffect(() => {
    if (readsBeforeHydration || !settings.hydrated) return;
    dispatch({ type: 'HYDRATE', state: restoredOrNewGame(prefsRef.current) });
  }, [settings.hydrated]);

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
