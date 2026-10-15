/** Where Maps JS loads from; the page's tag is the one whose `src` starts with it. */
export const MAPS_SCRIPT_ORIGIN = "https://maps.googleapis.com/maps/api/js";

/** What the page asks Maps JS for: each setting Google's URL takes, when given. */
export interface MapsScriptRequest {
  readonly key?: string | undefined;
  readonly version?: string | undefined;
  readonly language?: string | undefined;
  readonly region?: string | undefined;
}

/** Each setting's name in Google's URL. */
const PARAMS = { key: "key", version: "v", language: "language", region: "region" } as const;

type Setting = keyof typeof PARAMS;

const SETTINGS = Object.keys(PARAMS) as Setting[];

/** Maps JS's URL for `request`, loaded asynchronously as Google asks. */
export function mapsScriptUrl(request: MapsScriptRequest): string {
  const url = new URL(MAPS_SCRIPT_ORIGIN);
  for (const setting of SETTINGS) {
    const value = request[setting];
    if (value !== undefined) url.searchParams.set(PARAMS[setting], value);
  }
  url.searchParams.set("loading", "async");
  return url.href;
}

/** The settings a loaded tag's `src` asked for. */
export function requestIn(src: string): MapsScriptRequest {
  const { searchParams } = new URL(src);
  const request: Record<string, string> = {};
  for (const setting of SETTINGS) {
    const value = searchParams.get(PARAMS[setting]);
    if (value !== null) request[setting] = value;
  }
  return request;
}

/**
 * The first setting `request` gives that differs from what the page loaded, if any: one the
 * request leaves out takes whatever was loaded.
 */
export function conflictingSetting(
  request: MapsScriptRequest,
  loaded: MapsScriptRequest,
): Setting | undefined {
  return SETTINGS.find(
    (setting) => request[setting] !== undefined && request[setting] !== loaded[setting],
  );
}
