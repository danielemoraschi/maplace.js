import type { MaplaceMapElement } from "maplace/element/google";
import { startConsent } from "../consent/consent-controls.ts";
import { createConsentStore } from "../consent/consent-store.ts";
import { gateMaps } from "../consent/map-gate.ts";
import { whenVisible } from "../consent/when-visible.ts";
import { runPageScripts } from "../examples/page-scripts.ts";
import { provideSave } from "../examples/page-surroundings.ts";
import { startCopyButtons } from "./copy-buttons.ts";
import { releaseOnceDefined } from "./element-loader.ts";
import { clearScriptFailure, noteScriptFailure, startFailureNotes } from "./map-failures.ts";
import { startTabs } from "./tabs.ts";

// Every map on the site is held (`<maplace-map hold>`): nothing from Google loads until the
// visitor consents, then each map as it comes into view. The element itself loads with the
// first map released, so a page without maps, or a visitor who never consents, never fetches it;
// a map's page scripts run when it is released, once the element is defined, as the CDN script
// would have it.
const maps = [...document.querySelectorAll<MaplaceMapElement>("maplace-map[hold]")];

const release = releaseOnceDefined<MaplaceMapElement>({
  load: () => import("maplace/element/google"),
  release(map) {
    runPageScripts(map.closest("[data-live-page]") ?? map);
    map.release();
  },
  failed(map, error) {
    console.error("maplace: the map element's script didn't load", error);
    noteScriptFailure(map);
  },
  recovered: clearScriptFailure,
});

provideSave(globalThis, document);
startTabs(document);
startCopyButtons(document);
startFailureNotes(maps);
startConsent({
  document,
  store: createConsentStore(() => localStorage),
  openMaps: gateMaps(maps, { whenVisible, release }),
  reload: () => location.reload(),
});
