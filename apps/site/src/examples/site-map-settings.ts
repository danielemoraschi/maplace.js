import type { Provider } from "./example-providers.ts";

/**
 * What the site runs its Google examples with: its key and its map ID, each when it has one.
 * MapLibre's take neither.
 */
export interface SiteMapSettings {
  readonly apiKey?: string | undefined;
  readonly mapId?: string | undefined;
}

/** Whether a map on `provider` misses the key it needs: Google's, when the site has none. */
export function keyMissing(provider: Provider, { apiKey }: SiteMapSettings): boolean {
  return provider === "google" && apiKey === undefined;
}
