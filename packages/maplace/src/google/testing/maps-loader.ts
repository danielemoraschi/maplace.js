import { loadLibraries } from "../libraries";
import { mapsScriptUrl } from "../maps-script-url";

/**
 * The Maps JS the tests run against: numbered, so runs repeat. Google retires a numbered version
 * about a year after its release; the version check in `maps-loader.browser.test.ts` then fails.
 */
export const MAPS_JS_VERSION = "3.66";

const LOADED_CALLBACK = "__maplaceTestMapsLoaded";

let loading: Promise<void> | undefined;
let authFailed = false;

/**
 * Loads Maps JS once per page with the tests' key, as a page would with Google's script, and the
 * libraries the adapter uses, so tests can build maps and markers synchronously.
 */
export function loadMapsForTests(key: string): Promise<void> {
  loading ??= injectMapsScript(key).then(async () => {
    await loadLibraries();
  });
  return loading;
}

/** Whether Google refused the key (`gm_authFailure`), which leaves maps loading but blank. */
export function keyRefused(): boolean {
  return authFailed;
}

function injectMapsScript(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    Object.assign(globalThis, {
      [LOADED_CALLBACK]: resolve,
      gm_authFailure: () => {
        authFailed = true;
      },
    });
    const script = document.createElement("script");
    script.src = testScriptUrl(key);
    script.onerror = () => reject(new Error("Maps JS failed to load"));
    document.head.append(script);
  });
}

/** The element's URL, pinned, with a callback: tests know when Maps JS arrived. */
function testScriptUrl(key: string): string {
  const url = new URL(mapsScriptUrl({ key, version: MAPS_JS_VERSION }));
  url.searchParams.set("callback", LOADED_CALLBACK);
  return url.href;
}
