import { attempt } from "../consent/site-data.ts";
import { FIRST_PROVIDER, isProvider, type Provider } from "../examples/example-providers.ts";

/** Where the examples' provider is kept, for the visit only (session storage). */
export const PROVIDER_CHOICE_KEY = "maplace-site:provider";

/**
 * The provider kept in `storage` earlier in the visit; the first provider when none is, when the
 * kept value names none, or when the browser keeps no site data.
 */
export function keptProvider(storage: () => Storage): Provider {
  const kept = attempt(() => storage().getItem(PROVIDER_CHOICE_KEY));
  return kept != null && isProvider(kept) ? kept : FIRST_PROVIDER;
}

/** Keeps `provider` in `storage` for the rest of the visit, if the browser keeps site data. */
export function keepProvider(storage: () => Storage, provider: Provider): void {
  attempt(() => storage().setItem(PROVIDER_CHOICE_KEY, provider));
}
