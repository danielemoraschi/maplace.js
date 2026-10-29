import { startConsent } from "../consent/consent-controls.ts";
import { createConsentStore } from "../consent/consent-store.ts";
import { consentLatch } from "../consent/map-gate.ts";
import { whenVisible } from "../consent/when-visible.ts";
import { versionModule } from "../examples/example-modules.ts";
import { exampleFolder } from "../examples/example-providers.ts";
import type { LiveVersion } from "../examples/example-versions.ts";
import { runPageScripts } from "../examples/page-scripts.ts";
import { byKind } from "./by-kind.ts";
import { byProvider, providerOf } from "./by-provider.ts";
import { googleScriptReady, googleVersionReady, type PageMapsJs } from "./google-version-ready.ts";
import { fetchGroupPanel } from "./group-panels.ts";
import { startGroupSwitch } from "./group-switch.ts";
import { noteMapsJsFailure, noteVersionStartFailure } from "./map-failures.ts";
import { askBootstrapForMapsJs, mapsJsOnPage, watchMapsJs } from "./maps-on-page.ts";
import { followNavFocus, revealCurrentNavLink } from "./nav-in-view.ts";
import { pageMapRelease } from "./page-map-release.ts";
import { provideSave } from "./page-save.ts";
import { ELEMENT_LOADERS, READY_MAPLIBRE_VERSION } from "./provider-loaders.ts";
import { importAsModule, scriptVersionStart } from "./script-version.ts";
import { followSectionAnchor } from "./section-anchor.ts";
import { sectionStarter } from "./section-start.ts";
import { installMaplace } from "./site-maplace.ts";
import { showStarCount } from "./star-count.ts";
import { versionStarter } from "./version-start.ts";
import { startProviderToggle } from "./version-switch.ts";

// An old home page link to an example on another group's page goes there (W38).
followSectionAnchor(location);

// Every map on the site is held (`<maplace-map hold>`): nothing from Google Maps or OpenFreeMap
// loads until the visitor consents, then each map as it comes into view. A provider's element
// loads with the first of its maps released, so a page without maps, or a visitor who never
// consents, never fetches it, and maplibre-gl comes only with a MapLibre map; a map's page scripts
// run when it is released, once the element is defined and the page's `Maplace` set, as the CDN
// script would have it. A script, vanilla or React version, once chosen, starts the same way:
// consented and in view, its provider readied, then a script version's program run on the page's
// `Maplace`, as an imported module, or a module version's module. On Google, a module version's
// bootstrap runs and is asked for Maps JS at once; a script version's adapter adds Maps JS itself.
// On MapLibre, maplibre-gl as its adapter imports it is asked for beside the version's own imports.
// A map whose failure a reload mends offers one (`MENDED_BY_RELOAD`, map-failures.ts).
const mapsJs = watchMapsJs(document);

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
      module: googleVersionReady({
        ...pageMapsJs,
        runBootstrap: runPageScripts,
        askForMapsJs: askBootstrapForMapsJs,
      }),
    }),
    maplibre: READY_MAPLIBRE_VERSION,
  }),
  load: byKind({ script: scriptVersionStart(installMaplace, importAsModule), module: loadVersion }),
  failed: noteVersionStartFailure,
});

mapsJs.whenFailed(() => noteMapsJsFailure(document));

const reloadPage = () => location.reload();
const latch = consentLatch();
const startSections = sectionStarter({
  whenVisible,
  release,
  startVersion,
  followToggle: startProviderToggle(document, () => sessionStorage),
  reload: reloadPage,
  latch,
});

provideSave(globalThis, document);
revealCurrentNavLink(document);
followNavFocus(document);
startSections(document);
startGroupSwitch({ document, startSections, fetchPanel: fetchGroupPanel, leave: location });
void showStarCount(document);
startConsent({
  document,
  store: createConsentStore(() => localStorage),
  openMaps: latch.turnOn,
  reload: reloadPage,
});

// The nav's link again once the web fonts are in, last, so nothing above waits for them: wider
// than the fallback's, they can move it under the nav's end fade.
await document.fonts.ready;
revealCurrentNavLink(document);
