import { useSyncExternalStore } from 'react';

/** Nothing ever changes after hydration, so there is nothing to subscribe to. */
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * False while the statically rendered web HTML is being produced and during the
 * client's hydration pass, true from the first render after that; always true on
 * native, which never hydrates. Anything that reads browser-only state (window
 * size, `localStorage`, the system color scheme) has to wait for it.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
