import type { MapSettingAttribute } from "../map-settings-watch";
import { elementWith } from "./dom";

/** The shared map settings and MapLibre's globe ones, held to its list by `maplibre-attributes.test.ts`. */
type MapSetting = MapSettingAttribute | "globe" | "globe-position" | "globe-label";

/**
 * Each map setting, shared or one provider's, with a value it accepts and what it is read beside:
 * the globe's corner and words count only with the globe asked for.
 */
const SETTING_GIVEN: Readonly<Record<MapSetting, Readonly<Record<string, string>>>> = {
  "color-scheme": { "color-scheme": "dark" },
  "map-style": { "map-style": "https://tiles.example/style.json" },
  "map-options": { "map-options": '{"maxZoom":4}' },
  globe: { globe: "" },
  "globe-position": { globe: "", "globe-position": "bottom-left" },
  "globe-label": { globe: "", "globe-label": "Earth" },
};

/** The map settings whose value changes what `read` makes of an element. */
export function mapSettingsThatChange(read: (element: HTMLElement) => unknown): MapSetting[] {
  return (Object.keys(SETTING_GIVEN) as MapSetting[]).filter((name) => {
    const { [name]: _value, ...beside } = SETTING_GIVEN[name];
    const without = JSON.stringify(read(elementWith(beside)));
    return JSON.stringify(read(elementWith(SETTING_GIVEN[name]))) !== without;
  });
}
