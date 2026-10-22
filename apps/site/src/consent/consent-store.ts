/** Where the visitor's consent to the maps (Google Maps and OpenFreeMap) is kept, site-wide. */
export const CONSENT_KEY = "maplace-site:maps";

/** The kept value meaning consent. */
export const CONSENT_GRANTED = "granted";

/** The visitor's consent to load the site's maps, site-wide (D12). */
export interface ConsentStore {
  isGranted(): boolean;
  grant(): void;
  revoke(): void;
}

/**
 * Consent kept in `storage` for later visits. Read once; a browser that keeps no site data (a
 * blocked `localStorage` throws) still has consent for the page it was given on.
 */
export function createConsentStore(storage: () => Storage): ConsentStore {
  let granted = attempt(() => storage().getItem(CONSENT_KEY) === CONSENT_GRANTED) ?? false;
  return {
    isGranted: () => granted,
    grant() {
      granted = true;
      attempt(() => storage().setItem(CONSENT_KEY, CONSENT_GRANTED));
    },
    revoke() {
      granted = false;
      attempt(() => storage().removeItem(CONSENT_KEY));
    },
  };
}

/** `access`'s result, or undefined when the browser refuses its site data. */
function attempt<T>(access: () => T): T | undefined {
  try {
    return access();
  } catch {
    return undefined;
  }
}
