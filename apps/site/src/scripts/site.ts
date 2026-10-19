import type { MaplaceMapElement } from "maplace/element/google";
import { startConsent } from "../consent/consent-controls.ts";
import { createConsentStore } from "../consent/consent-store.ts";
import { gateMaps } from "../consent/map-gate.ts";
import { whenVisible } from "../consent/when-visible.ts";
import { versionModule } from "../examples/example-modules.ts";
import type { LiveVersion } from "../examples/example-versions.ts";
import { provideSave } from "../examples/page-save.ts";
import { runPageScripts } from "../examples/page-scripts.ts";
import { startCopyButtons } from "./copy-buttons.ts";
import { releaseOnceDefined } from "./element-loader.ts";
import {
  clearScriptFailure,
  noteMapsJsFailure,
  noteScriptFailure,
  noteVersionFailure,
  startFailureNotes,
} from "./map-failures.ts";
import { mapsJsOnPage, watchMapsJs } from "./maps-on-page.ts";
import { startTabs } from "./tabs.ts";
import { versionStarter } from "./version-start.ts";
import { startVersionSwitches } from "./version-switch.ts";

// Every map on the site is held (`<maplace-map hold>`): nothing from Google loads until the
// visitor consents, then each map as it comes into view. The element itself loads with the
// first map released, so a page without maps, or a visitor who never consents, never fetches it;
// a map's page scripts run when it is released, once the element is defined, as the CDN script
// would have it. A vanilla or React version, once chosen, starts the same way: consented and in
// view, its bootstrap and module run then.
const mapsJs = watchMapsJs(document);
const maps = [...document.querySelectorAll<MaplaceMapElement>("maplace-map[hold]")];
const versions = [
  ...document.querySelectorAll<HTMLElement>('[data-live-version]:not([data-live-version="html"])'),
];

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

const startVersion = versionStarter({
  load: ({ dataset }) => versionModule(dataset.example ?? "", dataset.liveVersion as LiveVersion)(),
  runBootstrap: runPageScripts,
  mapsJsOnPage: () => mapsJsOnPage(document),
  mapsImportable: mapsJs.importable,
  failed: noteVersionFailure,
});

mapsJs.whenFailed(() => noteMapsJsFailure(document));

const openPageMaps = gateMaps(maps, { whenVisible, release });
const openVersions = gateMaps(versions, { whenVisible, release: startVersion });

provideSave(globalThis, document);
startTabs(document);
startVersionSwitches(document);
startCopyButtons(document);
startFailureNotes(maps);
startConsent({
  document,
  store: createConsentStore(() => localStorage),
  openMaps: () => {
    openPageMaps();
    openVersions();
  },
  reload: () => location.reload(),
});
