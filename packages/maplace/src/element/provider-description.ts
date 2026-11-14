import type { ProviderFactory } from "./index";
import { MAP_SETTINGS } from "./map-settings-watch";

/** Whom a map on `element` loads from, for its panel; `undefined` names no one. */
export type LoadSource = (element: Element) => string | undefined;

/** What one of maplace's own providers says about itself. */
export interface ProviderDescription {
  /** A change of one of these map settings, and of no other, opens its map again. */
  readonly mapSettings: readonly string[];
  readonly loadSource: LoadSource;
}

const descriptions = new WeakMap<ProviderFactory, ProviderDescription>();

/** Keeps what `provider` says about itself, for the two lookups below. */
export function describeProvider(
  provider: ProviderFactory,
  description: ProviderDescription,
): void {
  descriptions.set(provider, description);
}

/** The map settings `provider` reads; every one for a provider that named none, as a page's own. */
export function mapSettingsReadBy(provider: ProviderFactory): readonly string[] {
  return descriptions.get(provider)?.mapSettings ?? MAP_SETTINGS;
}

/** How `provider` says whom it loads from; `undefined` for a provider that said nothing. */
export function loadSourceNamedBy(provider: ProviderFactory): LoadSource | undefined {
  return descriptions.get(provider)?.loadSource;
}
