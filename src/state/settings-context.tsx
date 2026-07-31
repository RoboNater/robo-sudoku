import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * App settings. In-memory for now; persistence and the UI/skin/layout
 * choices land in milestone 4.
 */
export interface Settings {
  showErrors: boolean;
  setShowErrors: (value: boolean) => void;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showErrors, setShowErrors] = useState(true);
  const value = useMemo(() => ({ showErrors, setShowErrors }), [showErrors]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used within SettingsProvider');
  return settings;
}
