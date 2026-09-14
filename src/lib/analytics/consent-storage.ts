const KEY = 'gaviota.consent.analytics.v1';
const EVENT = 'gaviota:consent-analytics';

export type ConsentStatus = 'unknown' | 'granted' | 'denied';

// Keep the current visit usable if the browser blocks localStorage.
let memoryStatus: ConsentStatus | null = null;

export function getConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const value = window.localStorage.getItem(KEY);
    if (value === 'granted' || value === 'denied') return value;
  } catch {
    // Falls through to the in-memory value below.
  }
  return memoryStatus ?? 'unknown';
}

export function setConsent(status: 'granted' | 'denied'): void {
  if (typeof window === 'undefined') return;
  memoryStatus = status;
  try {
    window.localStorage.setItem(KEY, status);
  } catch {
    // The in-memory value still works for the rest of this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeConsent(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onStorage);
  };
}
