import type { MaplaceMapElement } from "maplace/element";
import { startConsent } from "../consent/consent-controls.ts";
import { createConsentStore } from "../consent/consent-store.ts";
import { gateMaps } from "../consent/map-gate.ts";
import { whenVisible } from "../consent/when-visible.ts";
import { versionModule } from "../examples/example-modules.ts";
import { exampleFolder } from "../examples/example-providers.ts";
import type { LiveVersion } from "../examples/example-versions.ts";
import { provideSave } from "../examples/page-save.ts";
import { runPageScripts } from "../examples/page-scripts.ts";
import { byKind } from "./by-kind.ts";
import { byProvider, providerOf } from "./by-provider.ts";
import { startCopyButtons } from "./copy-buttons.ts";
import { googleScriptReady, googleVersionReady, type PageMapsJs } from "./google-version-ready.ts";
import { noteMapsJsFailure, noteVersionFailure, startFailureNotes } from "./map-failures.ts";
import { mapsJsOnPage, watchMapsJs } from "./maps-on-page.ts";
import { followNavFocus, revealCurrentNavLink } from "./nav-in-view.ts";
import { pageMapRelease } from "./page-map-release.ts";
import { ELEMENT_LOADERS, readyMapLibre } from "./provider-loaders.ts";
import { startReloadButtons } from "./reload-buttons.ts";
import { scriptVersionStart } from "./script-version.ts";
import { installMaplace } from "./site-maplace.ts";
import { startStarButtons } from "./star-buttons.ts";
import { startTabs } from "./tabs.ts";
import { versionStarter } from "./version-start.ts";
import { startVersionSwitches } from "./version-switch.ts";

// Every map on the site is held (`<maplace-map hold>`): nothing from Google Maps or OpenFreeMap
// loads until the visitor consents, then each map as it comes into view. A provider's element
// loads with the first of its maps released, so a page without maps, or a visitor who never
// consents, never fetches it, and maplibre-gl comes only with a MapLibre map; a map's page scripts
// run when it is released, once the element is defined and the page's `Maplace` set, as the CDN
// script would have it. A script, vanilla or React version, once chosen, starts the same way:
// consented and in view, its provider readied (on MapLibre, its worker; on Google, a module
// version's bootstrap and Maps JS, a script version's adapter adding Maps JS itself), then a
// script version's program run on the page's `Maplace`, or a module version's module.
// A map whose failure a reload mends (a script, Maps JS, a provider's map that didn't load) offers one.
const mapsJs = watchMapsJs(document);
const maps = [...document.querySelectorAll<MaplaceMapElement>("maplace-map[hold]")];
const versions = [
  ...document.querySelectorAll<HTMLElement>('[data-live-version]:not([data-live-version="html"])'),
];

const release = pageMapRelease(ELEMENT_LOADERS, installMaplace);

/** Imports the module of `version`, which runs it. */
function loadVersion(version: HTMLElement): Promise<unknown> {
  const { example, liveVersion } = version.dataset;
  if (example === undefined) throw new Error("a live version has no data-example");
  const folder = exampleFolder(example, providerOf(version));
  return versionModule(folder, liveVersion as LiveVersion)();
}

const pageMapsJs: PageMapsJs = {
  mapsJsOnPage: () => mapsJsOnPage(document),
  mapsImportable: mapsJs.importable,
};

const startVersion = versionStarter({
  ready: byProvider({
    // A script version's adapter adds Maps JS itself, or shares the page's.
    google: byKind({
      script: googleScriptReady(pageMapsJs),
      module: googleVersionReady({ ...pageMapsJs, runBootstrap: runPageScripts }),
    }),
    maplibre: readyMapLibre,
  }),
  load: byKind({ script: scriptVersionStart(installMaplace), module: loadVersion }),
  failed: noteVersionFailure,
});

mapsJs.whenFailed(() => noteMapsJsFailure(document));

const reloadPage = () => location.reload();
const openPageMaps = gateMaps(maps, { whenVisible, release });
const openVersions = gateMaps(versions, { whenVisible, release: startVersion });

provideSave(globalThis, document);
revealCurrentNavLink(document);
followNavFocus(document);
startTabs(document);
startVersionSwitches(document);
startCopyButtons(document);
startReloadButtons(document, reloadPage);
void startStarButtons(document);
startFailureNotes(maps);
startConsent({
  document,
  store: createConsentStore(() => localStorage),
  openMaps: () => {
    openPageMaps();
    openVersions();
  },
  reload: reloadPage,
});

// The nav's link again once the web fonts are in, last, so nothing above waits for them: wider
// than the fallback's, they can move it under the nav's end fade.
await document.fonts.ready;
revealCurrentNavLink(document);
