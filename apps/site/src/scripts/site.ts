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
import { byProvider, providerOf } from "./by-provider.ts";
import { startCopyButtons } from "./copy-buttons.ts";
import { googleVersionReady } from "./google-version-ready.ts";
import { noteMapsJsFailure, noteVersionFailure, startFailureNotes } from "./map-failures.ts";
import { mapsJsOnPage, watchMapsJs } from "./maps-on-page.ts";
import { followNavFocus, revealCurrentNavLink } from "./nav-in-view.ts";
import { pageMapRelease } from "./page-map-release.ts";
import { ELEMENT_LOADERS, readyMapLibre } from "./provider-loaders.ts";
import { startReloadButtons } from "./reload-buttons.ts";
import { startStarButtons } from "./star-buttons.ts";
import { startTabs } from "./tabs.ts";
import { versionStarter } from "./version-start.ts";
import { startVersionSwitches } from "./version-switch.ts";

// Every map on the site is held (`<maplace-map hold>`): nothing from Google Maps or OpenFreeMap
// loads until the visitor consents, then each map as it comes into view. A provider's element
// loads with the first of its maps released, so a page without maps, or a visitor who never
// consents, never fetches it, and maplibre-gl comes only with a MapLibre map; a map's page scripts
// run when it is released, once the element is defined, as the CDN script would have it. A
// vanilla or React version, once chosen, starts the same way: consented and in view, its provider
// readied (on Google, its bootstrap and Maps JS; on MapLibre, its worker), then its module run.
// A map whose failure a reload mends (a script, Maps JS, a provider's map that didn't load) offers one.
const mapsJs = watchMapsJs(document);
const maps = [...document.querySelectorAll<MaplaceMapElement>("maplace-map[hold]")];
const versions = [
  ...document.querySelectorAll<HTMLElement>('[data-live-version]:not([data-live-version="html"])'),
];

const release = pageMapRelease(ELEMENT_LOADERS);

/** Imports the module of `version`, which runs it. */
function loadVersion(version: HTMLElement): Promise<unknown> {
  const { example, liveVersion } = version.dataset;
  if (example === undefined) throw new Error("a live version has no data-example");
  const folder = exampleFolder(example, providerOf(version));
  return versionModule(folder, liveVersion as LiveVersion)();
}

const startVersion = versionStarter({
  ready: byProvider({
    google: googleVersionReady({
      runBootstrap: runPageScripts,
      mapsJsOnPage: () => mapsJsOnPage(document),
      mapsImportable: mapsJs.importable,
    }),
    maplibre: readyMapLibre,
  }),
  load: loadVersion,
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
