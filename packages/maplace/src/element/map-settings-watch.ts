import { given, givenAttribute } from "./attribute-values";

/**
 * The attributes a map's provider reads its map settings from; a change opens the map again.
 * Google's provider reads `color-scheme`, MapLibre's `map-style`, and both read `map-options`.
 */
export const MAP_SETTING_ATTRIBUTES = {
  colorScheme: "color-scheme",
  mapStyle: "map-style",
  mapOptions: "map-options",
} as const;

const WATCHED = Object.values(MAP_SETTING_ATTRIBUTES);

/** Calls back once per task in which a map setting changed value, while started. */
export interface MapSettingsWatch {
  start(): void;
  /** Stops watching, dropping a change not yet called back for. */
  stop(): void;
}

export function createMapSettingsWatch(host: Element, onChange: () => void): MapSettingsWatch {
  const observer = new MutationObserver((records) => {
    if (someSettingChanged(host, records)) onChange();
  });
  return {
    // Observing again replaces the options, so a second start adds nothing.
    start: () => observer.observe(host, { attributeFilter: WATCHED, attributeOldValue: true }),
    stop: () => observer.disconnect(),
  };
}

/** Whether a setting ends the task with another value than it started with; empty is missing. */
function someSettingChanged(host: Element, records: readonly MutationRecord[]): boolean {
  const before = new Map<string, string | null>();
  for (const { attributeName, oldValue } of records) {
    if (attributeName !== null && !before.has(attributeName)) before.set(attributeName, oldValue);
  }
  return [...before].some(([name, old]) => given(old) !== givenAttribute(host, name));
}
