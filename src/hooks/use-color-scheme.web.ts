import { useColorScheme as useRNColorScheme } from 'react-native';

import { useIsHydrated } from './use-is-hydrated';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const hasHydrated = useIsHydrated();
  const colorScheme = useRNColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
