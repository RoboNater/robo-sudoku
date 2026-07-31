import { createContext, useContext, type ReactNode } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import type { BoardSkin, SkinPalette } from '@/skins/types';
import { useSettings } from '@/state/settings-context';

import type { GameUI, UiLayout } from './types';

/**
 * Makes the running UI's manifest available to its own components, so a UI can
 * resolve its active skin/layout without importing the registry (which would
 * import it right back).
 */
const ActiveUiContext = createContext<GameUI | null>(null);

export function ActiveUiProvider({ ui, children }: { ui: GameUI; children: ReactNode }) {
  return <ActiveUiContext.Provider value={ui}>{children}</ActiveUiContext.Provider>;
}

export function useActiveUi(): GameUI {
  const ui = useContext(ActiveUiContext);
  if (!ui) throw new Error('useActiveUi must be used within ActiveUiProvider');
  return ui;
}

/**
 * The skin the user picked for the running UI plus the palette for the current
 * system color scheme. Unknown or missing choices fall back to the UI's default.
 */
export function useActiveSkin(): { skin: BoardSkin; palette: SkinPalette } {
  const ui = useActiveUi();
  const settings = useSettings();
  const scheme = useColorScheme();

  const skins = ui.skins;
  if (!skins) throw new Error(`UI "${ui.id}" declares no skins`);

  const chosenId = settings.perUi[ui.id]?.skinId;
  const skin =
    (chosenId ? skins[chosenId] : undefined) ??
    (ui.defaultSkinId ? skins[ui.defaultSkinId] : undefined) ??
    Object.values(skins)[0];

  return { skin, palette: scheme === 'dark' ? skin.dark : skin.light };
}

/** The layout variant chosen for the running UI, or null if it has none. */
export function useActiveLayout(): UiLayout | null {
  const ui = useActiveUi();
  const settings = useSettings();

  const layouts = ui.layouts;
  if (!layouts) return null;

  const chosenId = settings.perUi[ui.id]?.layoutId;
  return (
    (chosenId ? layouts[chosenId] : undefined) ??
    (ui.defaultLayoutId ? layouts[ui.defaultLayoutId] : undefined) ??
    Object.values(layouts)[0] ??
    null
  );
}
