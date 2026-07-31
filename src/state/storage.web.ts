/**
 * Web counterpart of `storage.ts`. `localStorage` is unavailable while the
 * statically rendered HTML is produced, so callers must defer reads until after
 * hydration (see `readsBeforeHydration`); every accessor is guarded regardless.
 */

export const readsBeforeHydration = false;

function available(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage;
}

export function getItem(key: string): string | null {
  if (!available()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  if (!available()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private-mode / quota failures are not worth breaking the game over.
  }
}

export function removeItem(key: string): void {
  if (!available()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignored, same as above.
  }
}
