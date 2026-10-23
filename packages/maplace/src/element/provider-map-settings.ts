import type { ProviderFactory } from "./index";
import { MAP_SETTINGS, type MapSettingAttribute } from "./map-settings-watch";

const settingsNamedBy = new WeakMap<ProviderFactory, readonly MapSettingAttribute[]>();

/** Names the map settings `provider` reads: a change of one of them, and of no other, opens its map again. */
export function nameMapSettings(
  provider: ProviderFactory,
  settings: readonly MapSettingAttribute[],
): void {
  settingsNamedBy.set(provider, settings);
}

/** The map settings `provider` reads; every one for a provider that named none, as a page's own. */
export function mapSettingsReadBy(provider: ProviderFactory): readonly MapSettingAttribute[] {
  return settingsNamedBy.get(provider) ?? MAP_SETTINGS;
}
