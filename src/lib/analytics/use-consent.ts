'use client';

import { useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { getConsent, setConsent, subscribeConsent } from './consent-storage';

const getServerSnapshot = () => 'unknown' as const;

/**
 * Same pattern as `commerce/bag.ts` (see `mobile-purchase-bar.tsx`):
 * `useSyncExternalStore` reads localStorage as the external source of truth,
 * server-rendering 'unknown' so it never desyncs from the SSR HTML.
 */
export function useConsent() {
  const status = useSyncExternalStore(subscribeConsent, getConsent, getServerSnapshot);

  const accept = useCallback(() => setConsent('granted'), []);
  const reject = useCallback(() => setConsent('denied'), []);

  return { status, accept, reject };
}
