import { classicUI } from './classic';
import type { GameUI } from './types';

/** Every selectable game UI. Adding a UI is one folder plus one line here. */
export const UIs: Record<string, GameUI> = {
  [classicUI.id]: classicUI,
};

export const DEFAULT_UI_ID = classicUI.id;

/** Resolves a (possibly stale or persisted) UI id, falling back to the default. */
export function getUI(id: string): GameUI {
  return UIs[id] ?? UIs[DEFAULT_UI_ID];
}

export function listUIs(): GameUI[] {
  return Object.values(UIs);
}
