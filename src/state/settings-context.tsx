import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { useIsHydrated } from '@/hooks/use-is-hydrated';

import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  parseSettings,
  serializeSettings,
  withPerUi,
  type PerUiSettings,
  type SettingsState,
} from './settings-store';
import { getItem, setItem } from './storage';

export interface Settings extends SettingsState {
  /** False on web until stored settings have been read after mount. */
  hydrated: boolean;
  setActiveUi: (uiId: string) => void;
  setShowErrors: (value: boolean) => void;
  /** Updates the seed only — use `useSetAutoClear` to change the live game too. */
  setAutoClearNotes: (unit: keyof SettingsState['autoClearNotes'], value: boolean) => void;
  setSkin: (uiId: string, skinId: string) => void;
  setLayout: (uiId: string, layoutId: string) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Web renders statically first, so the stored settings can only be read once
  // the client has mounted; until then everyone sees the defaults.
  const hydrated = useIsHydrated();
  const stored = useMemo(
    () => (hydrated ? parseSettings(getItem(SETTINGS_KEY)) : DEFAULT_SETTINGS),
    [hydrated],
  );

  // Null until the user changes something, which is what keeps the defaults
  // rendered before hydration from ever being written back over storage.
  const [changed, setChanged] = useState<SettingsState | null>(null);
  const state = changed ?? stored;

  useEffect(() => {
    if (!changed) return;
    setItem(SETTINGS_KEY, serializeSettings(changed));
  }, [changed]);

  const update = useCallback(
    (change: (prev: SettingsState) => SettingsState) =>
      setChanged((prev) => change(prev ?? stored)),
    [stored],
  );

  const setActiveUi = useCallback(
    (uiId: string) => update((prev) => ({ ...prev, activeUiId: uiId })),
    [update],
  );
  const setShowErrors = useCallback(
    (value: boolean) => update((prev) => ({ ...prev, showErrors: value })),
    [update],
  );
  const setAutoClearNotes = useCallback(
    (unit: keyof SettingsState['autoClearNotes'], value: boolean) =>
      update((prev) => ({ ...prev, autoClearNotes: { ...prev.autoClearNotes, [unit]: value } })),
    [update],
  );
  const setPerUi = useCallback(
    (uiId: string, change: PerUiSettings) => update((prev) => withPerUi(prev, uiId, change)),
    [update],
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
    () => ({
      ...state,
      hydrated,
      setActiveUi,
      setShowErrors,
      setAutoClearNotes,
      setSkin,
      setLayout,
    }),
    [state, hydrated, setActiveUi, setShowErrors, setAutoClearNotes, setSkin, setLayout],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used within SettingsProvider');
  return settings;
}
