import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  parseSettings,
  serializeSettings,
  withPerUi,
  type PerUiSettings,
  type SettingsState,
} from './settings-store';
import { getItem, readsBeforeHydration, setItem } from './storage';

export interface Settings extends SettingsState {
  /** False on web until stored settings have been read after mount. */
  hydrated: boolean;
  setActiveUi: (uiId: string) => void;
  setShowErrors: (value: boolean) => void;
  setSkin: (uiId: string, skinId: string) => void;
  setLayout: (uiId: string, layoutId: string) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(() =>
    readsBeforeHydration ? parseSettings(getItem(SETTINGS_KEY)) : DEFAULT_SETTINGS,
  );
  const [hydrated, setHydrated] = useState(readsBeforeHydration);

  // Web renders statically first, so the stored settings can only be read once
  // the client has mounted.
  useEffect(() => {
    if (readsBeforeHydration) return;
    setState(parseSettings(getItem(SETTINGS_KEY)));
    setHydrated(true);
  }, []);

  // Write-through, skipped until hydration so defaults never clobber storage.
  useEffect(() => {
    if (!hydrated) return;
    setItem(SETTINGS_KEY, serializeSettings(state));
  }, [hydrated, state]);

  const setActiveUi = useCallback(
    (uiId: string) => setState((prev) => ({ ...prev, activeUiId: uiId })),
    [],
  );
  const setShowErrors = useCallback(
    (value: boolean) => setState((prev) => ({ ...prev, showErrors: value })),
    [],
  );
  const setPerUi = useCallback(
    (uiId: string, change: PerUiSettings) => setState((prev) => withPerUi(prev, uiId, change)),
    [],
  );
  const setSkin = useCallback(
    (uiId: string, skinId: string) => setPerUi(uiId, { skinId }),
    [setPerUi],
  );
  const setLayout = useCallback(
    (uiId: string, layoutId: string) => setPerUi(uiId, { layoutId }),
    [setPerUi],
  );

  const value = useMemo(
    () => ({ ...state, hydrated, setActiveUi, setShowErrors, setSkin, setLayout }),
    [state, hydrated, setActiveUi, setShowErrors, setSkin, setLayout],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used within SettingsProvider');
  return settings;
}
