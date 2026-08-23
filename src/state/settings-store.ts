/**
 * Persisted settings shape and its (de)serialization. Kept free of React and of
 * the UI registry so it can be unit tested and so a stale persisted id never
 * throws — unknown UI/skin/layout ids are resolved with fallbacks at render time.
 */

import type { Digit } from '@/engine/types';

export const SETTINGS_KEY = 'robosudoku.settings.v1';

/** Per-UI choices; absent entries mean "use that UI's defaults". */
export interface PerUiSettings {
  skinId?: string;
  layoutId?: string;
}

/** Auto-clear flags, one per unit a noted digit can conflict in. */
export interface AutoClearNotes {
  row: boolean;
  col: boolean;
  box: boolean;
}

/**
 * Spotlight highlights one digit everywhere it appears — values and pencil
 * notes alike — and fades everything else. Independent of entry and notes mode,
 * so the digit only changes when the player picks a new one here.
 */
export interface SpotlightSettings {
  on: boolean;
  digit: Digit;
}

export interface SettingsState {
  activeUiId: string;
  showErrors: boolean;
  /**
   * Whether pencil notes are shown outside of notes mode. Notes mode always
   * shows them regardless of this flag; leaving notes mode reverts to it.
   */
  notesVisible: boolean;
  /**
   * Seed for a fresh game only — the live, undoable flags live in GameState.
   * Kept here so a preference survives winning a puzzle (which clears the game store).
   */
  autoClearNotes: AutoClearNotes;
  spotlight: SpotlightSettings;
  perUi: Record<string, PerUiSettings>;
}

export const DEFAULT_SETTINGS: SettingsState = {
  activeUiId: 'classic',
  showErrors: true,
  notesVisible: true,
  autoClearNotes: { row: true, col: true, box: true },
  spotlight: { on: false, digit: 1 },
  perUi: {},
};

/** Per-field tolerant: a missing or junk flag falls back to its default. */
function parseAutoClearNotes(value: unknown): AutoClearNotes {
  const fallback = DEFAULT_SETTINGS.autoClearNotes;
  if (typeof value !== 'object' || value === null) return { ...fallback };
  const { row, col, box } = value as Record<string, unknown>;
  return {
    row: typeof row === 'boolean' ? row : fallback.row,
    col: typeof col === 'boolean' ? col : fallback.col,
    box: typeof box === 'boolean' ? box : fallback.box,
  };
}

/** Per-field tolerant, and a digit outside 1-9 falls back to the default. */
function parseSpotlight(value: unknown): SpotlightSettings {
  const fallback = DEFAULT_SETTINGS.spotlight;
  if (typeof value !== 'object' || value === null) return { ...fallback };
  const { on, digit } = value as Record<string, unknown>;
  const valid = Number.isInteger(digit) && (digit as number) >= 1 && (digit as number) <= 9;
  return {
    on: typeof on === 'boolean' ? on : fallback.on,
    digit: valid ? (digit as Digit) : fallback.digit,
  };
}

function parsePerUi(value: unknown): Record<string, PerUiSettings> {
  if (typeof value !== 'object' || value === null) return {};
  const result: Record<string, PerUiSettings> = {};
  for (const [uiId, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw !== 'object' || raw === null) continue;
    const { skinId, layoutId } = raw as Record<string, unknown>;
    const entry: PerUiSettings = {};
    if (typeof skinId === 'string') entry.skinId = skinId;
    if (typeof layoutId === 'string') entry.layoutId = layoutId;
    result[uiId] = entry;
  }
  return result;
}

/** Reads stored JSON, falling back to defaults for anything missing or malformed. */
export function parseSettings(raw: string | null): SettingsState {
  if (!raw) return DEFAULT_SETTINGS;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return DEFAULT_SETTINGS;
  }
  if (typeof parsed !== 'object' || parsed === null) return DEFAULT_SETTINGS;
  const { activeUiId, showErrors, notesVisible, autoClearNotes, spotlight, perUi } =
    parsed as Record<string, unknown>;
  return {
    activeUiId: typeof activeUiId === 'string' ? activeUiId : DEFAULT_SETTINGS.activeUiId,
    showErrors: typeof showErrors === 'boolean' ? showErrors : DEFAULT_SETTINGS.showErrors,
    notesVisible: typeof notesVisible === 'boolean' ? notesVisible : DEFAULT_SETTINGS.notesVisible,
    autoClearNotes: parseAutoClearNotes(autoClearNotes),
    spotlight: parseSpotlight(spotlight),
    perUi: parsePerUi(perUi),
  };
}

export function serializeSettings(settings: SettingsState): string {
  return JSON.stringify(settings);
}

/** Merges one UI's skin/layout choice into the settings, leaving others alone. */
export function withPerUi(
  settings: SettingsState,
  uiId: string,
  change: PerUiSettings,
): SettingsState {
  return {
    ...settings,
    perUi: { ...settings.perUi, [uiId]: { ...settings.perUi[uiId], ...change } },
  };
}
