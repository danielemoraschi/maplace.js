import { MAP_SETTINGS, type MapSettingAttribute } from "../map-settings-watch";
import { elementWith } from "./dom";

/** A value each map setting accepts, from both providers. */
const A_VALUE_OF_EACH_MAP_SETTING: Record<MapSettingAttribute, string> = {
  "color-scheme": "dark",
  "map-style": "https://tiles.example/style.json",
  "map-options": '{"maxZoom":4}',
};

/** The map settings whose value changes what `read` makes of an element. */
export function mapSettingsThatChange(read: (element: Element) => unknown): MapSettingAttribute[] {
  const unset = JSON.stringify(read(elementWith({})));
  return MAP_SETTINGS.filter(
    (name) =>
      JSON.stringify(read(elementWith({ [name]: A_VALUE_OF_EACH_MAP_SETTING[name] }))) !== unset,
  );
}
