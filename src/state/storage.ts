import Storage from 'expo-sqlite/kv-store';

/**
 * Synchronous key-value storage, native only (Metro picks `storage.web.ts` for
 * web because expo-sqlite's wasm build does not work with `web.output: static`).
 */

/** Native storage can be read during the first render; web has to wait. */
export const readsBeforeHydration = true;

export function getItem(key: string): string | null {
  return Storage.getItemSync(key);
}

export function setItem(key: string, value: string): void {
  Storage.setItemSync(key, value);
}

export function removeItem(key: string): void {
  Storage.removeItemSync(key);
}
