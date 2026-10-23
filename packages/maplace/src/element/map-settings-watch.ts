import { given, givenAttribute } from "./attribute-values";

/**
 * The attributes a provider may read its map settings from; each provider names those it reads
 * (`provider-map-settings.ts`).
 */
export const MAP_SETTING_ATTRIBUTES = {
  colorScheme: "color-scheme",
  mapStyle: "map-style",
  mapOptions: "map-options",
} as const;

/** One of the map-setting attributes. */
export type MapSettingAttribute =
  (typeof MAP_SETTING_ATTRIBUTES)[keyof typeof MAP_SETTING_ATTRIBUTES];

/** Every map-setting attribute. */
export const MAP_SETTINGS: readonly MapSettingAttribute[] = Object.values(MAP_SETTING_ATTRIBUTES);

/** Calls back once per task in which a watched map setting changed value, while started. */
export interface MapSettingsWatch {
  /** Watches `settings`, replacing what it watched: a change of one of them calls back. */
  start(settings: readonly MapSettingAttribute[]): void;
  /** Stops watching, dropping a change not yet called back for. */
  stop(): void;
}

export function createMapSettingsWatch(host: Element, onChange: () => void): MapSettingsWatch {
  const observer = new MutationObserver((records) => {
    if (someSettingChanged(host, records)) onChange();
  });
  return {
    // Observing again replaces the options, so a second start adds nothing.
    start: (settings) =>
      observer.observe(host, { attributeFilter: [...settings], attributeOldValue: true }),
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
