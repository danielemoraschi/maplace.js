import { defineProvider } from "./define";
import type { ProviderFactory } from "./index";
import type { MapSettingAttribute } from "./map-settings-watch";
import { nameMapSettings } from "./provider-map-settings";

/**
 * Registers one of maplace's own providers with the map settings it reads, named first: a map
 * waiting for the provider opens as it registers, and watches what the provider reads.
 */
export function defineBuiltInProvider(
  name: string,
  factory: ProviderFactory,
  mapSettings: readonly MapSettingAttribute[],
): void {
  nameMapSettings(factory, mapSettings);
  defineProvider(name, factory);
}
