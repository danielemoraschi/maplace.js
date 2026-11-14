import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { CLUSTER_CLASS } from "../adapter-kit/cluster-badge";
import * as cdn from "../cdn/maplibre";
import type * as Core from "../index";
import type { Maplace } from "../index";
import { byText, chooseOption } from "../testing/examples/behaviours/reading";
import {
  EXAMPLE_PAGES,
  onProvider,
  REACT_HOSTS,
  SCRIPT_VERSIONS,
  VANILLA_HOSTS,
} from "../testing/examples/example-files";
import { openPage } from "../testing/examples/example-page";
import { type ExampleRun, openVersion } from "../testing/examples/example-runs";
import { type OffsiteLog, serveExamplesOffline } from "../testing/examples/example-surroundings";
import {
  OPENFREEMAP_DARK as DARK,
  OPENFREEMAP_STYLES,
} from "../testing/examples/openfreemap-styles";
import { openingStyleOf } from "../testing/examples/opening-style";
import { recordErrors } from "../testing/examples/page-errors";
import {
  recordedStoreCount,
  shownIds,
  storeAttachedSince,
} from "../testing/examples/recorded-stores";
import { GLOBE_CLASS } from "./globe";
import "./testing/stylesheet";
import { TEST_STYLE } from "./testing/test-style";

// The MapLibre examples on real MapLibre, one after another in one document, with nothing leaving
// the machine: OpenFreeMap's styles are answered with the tests' local one. The recorder is loaded
// by the factory itself: the element's import of the entry runs it before this file's own imports
// are in.
vi.mock("@maplacejs/maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  const { recordingCreateMaplace } = await import("../testing/examples/recorded-stores");
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

const LOAD = { timeout: 15_000 };
/** A reader's stylesheet gives the map its size; the pages leave that to them. */
const PAGE_STYLE = "maplace-map { display: block; height: 240px; }";

/** A version or page running on real MapLibre: its store, and the element holding it. */
type RealRun = Pick<ExampleRun, "store" | "root">;

type RealCheck = (run: RealRun) => Promise<void>;

/** The accent css-markers' CSS gives a selected pin, as a browser computes it. */
const PIN_ACCENT = "rgb(198, 40, 40)";
/** The background brand's palette gives a cluster badge, as a browser computes it. */
const BRAND_BADGE = "rgb(59, 36, 22)";
/** The colour whats-on's CSS gives the Theatre category's pins, as a browser computes it. */
const THEATRE = "rgb(228, 87, 46)";
/** No background: whats-on makes maplace's panel on the map nothing. */
const NO_BACKGROUND = "rgba(0, 0, 0, 0)";

/**
 * What a version does on real MapLibre beyond opening, where only a real map shows it: styled's
 * select loads OpenFreeMap's dark style; css-markers' pins, brand's cluster badges and whats-on's
 * pins and panel take their looks from the page's CSS; flights opens on the globe.
 */
const ON_MAPLIBRE: Readonly<Record<string, RealCheck>> = {
  styled: expectDarkStyleOnChoosing,
  "css-markers": expectSelectedPinLook,
  brand: expectBadgeInBrandColours,
  "whats-on": expectCategoryLook,
  flights: expectOnTheGlobe,
};

let offsite: OffsiteLog;
let opened: Maplace | undefined;

beforeAll(() => {
  // A page's own script and a script version reach maplace through the CDN script's `Maplace`.
  vi.stubGlobal("Maplace", cdn);
  const style = document.createElement("style");
  style.textContent = PAGE_STYLE;
  document.head.append(style);
  offsite = serveExamplesOffline(TEST_STYLE);
});

afterEach(takeDown);

afterAll(() => vi.unstubAllGlobals());

describe("the example pages on MapLibre", () => {
  it.each(EXAMPLE_PAGES.filter(onProvider("maplibre")))(
    "opens the $name page, OpenFreeMap answered locally",
    async ({ name, html }) => {
      const askedBefore = offsite.asked().length;
      const page = openPage(html);
      await expectReadyOffline({ store: page.map.maplace, root: page.root }, name, askedBefore);
      expect(page.errors).toEqual([]);
    },
  );
});

describe("the example versions on MapLibre", () => {
  it.each([...SCRIPT_VERSIONS, ...VANILLA_HOSTS, ...REACT_HOSTS].filter(onProvider("maplibre")))(
    "draws the $example $kind version on MapLibre",
    async (version) => {
      const askedBefore = offsite.asked().length;
      const { root, run } = openVersion(version);
      const errors = recordErrors();
      const stores = recordedStoreCount();
      await run();
      opened = await vi.waitFor(() => storeAttachedSince(stores));
      await expectReadyOffline({ store: opened, root }, version.example, askedBefore);
      expect(errors).toEqual([]);
    },
  );
});

/** Every map taken down after its test, so the browser's WebGL contexts never run out. */
function takeDown(): void {
  opened?.destroy();
  opened = undefined;
  document.body.replaceChildren();
}

/**
 * The run's map ready on the local style, showing its locations (a version fetching them has
 * them), having asked offsite for the OpenFreeMap style its page opens on only, then doing what its
 * example does on MapLibre. `askedBefore` counts the offsite URLs asked before the run opened.
 */
async function expectReadyOffline(
  run: RealRun,
  example: string,
  askedBefore: number,
): Promise<void> {
  await expect.poll(() => run.store.getSnapshot().loadState, LOAD).toBe("ready");
  await expect.poll(() => shownIds(run.store).length, LOAD).toBeGreaterThan(0);
  expect(offsite.asked().slice(askedBefore)).toContain(openingStyleOf(example));
  expectNothingElseOffsite();
  await ON_MAPLIBRE[example]?.(run);
}

/** Nothing asked offsite but OpenFreeMap's styles, which the local style answers. */
function expectNothingElseOffsite(): void {
  expect(offsite.asked().filter((url) => !url.startsWith(OPENFREEMAP_STYLES))).toEqual([]);
}

/** A selected museum's pin, drawn on the map, takes the selected look the page's CSS gives it. */
async function expectSelectedPinLook({ store, root }: RealRun): Promise<void> {
  store.select("rijks");
  await expect.poll(() => styleOf(root, SELECTED_PIN)?.backgroundColor, LOAD).toBe(PIN_ACCENT);
}

/** Flights opens on the globe, its toggle pressed: every version asks for it. */
async function expectOnTheGlobe({ root }: RealRun): Promise<void> {
  await expect
    .poll(() => root.querySelector(`.${GLOBE_CLASS}`)?.getAttribute("aria-pressed"), LOAD)
    .toBe("true");
}

/** The shops' cluster badges take the brand's colours from the custom properties around the map. */
async function expectBadgeInBrandColours({ root }: RealRun): Promise<void> {
  await expect
    .poll(() => styleOf(root, `.${CLUSTER_CLASS}`)?.backgroundColor, LOAD)
    .toBe(BRAND_BADGE);
}

/** whats-on's chip pressed, `#f2f2f3` in its CSS, and hovered, as a browser computes them. */
const PRESSED_CHIP = "rgb(242, 242, 243)";
const HOVERED_CHIP = "rgba(255, 255, 255, 0.12)";

/** whats-on's selected pin, grown by its CSS's `scale(1.25)`. */
const GROWN_PIN = "matrix(1.25, 0, 0, 1.25, 0, 0)";

/**
 * A Theatre pin takes its category's colour, and the legend's panel no background of its own; a
 * selected pin grows; a chip takes its own hovered look, and a chip pressed keeps its pressed look
 * under the pointer, over MapLibre's own hover on a control's buttons.
 */
async function expectCategoryLook({ store, root }: RealRun): Promise<void> {
  const theatrePin = '.pin[data-category="Theatre"]';
  await expect.poll(() => styleOf(root, theatrePin)?.backgroundColor, LOAD).toBe(THEATRE);
  const legendPanel = ".maplace-control:has(.event-legend)";
  await expect.poll(() => styleOf(root, legendPanel)?.backgroundColor, LOAD).toBe(NO_BACKGROUND);
  store.select("royal-albert-hall");
  await expect.poll(() => styleOf(root, SELECTED_PIN)?.transform, LOAD).toBe(GROWN_PIN);
  const talks = byText(root, ".category-chip", "Talks");
  await userEvent.hover(talks);
  await expect.poll(() => getComputedStyle(talks).backgroundColor, LOAD).toBe(HOVERED_CHIP);
  const markets = byText(root, ".category-chip", "Markets");
  markets.click();
  await userEvent.hover(markets);
  await expect.poll(() => getComputedStyle(markets).backgroundColor, LOAD).toBe(PRESSED_CHIP);
}

/** The selected pin: marked itself, or inside the node React's markers are marked on. */
const SELECTED_PIN = ".pin[data-selected], [data-selected] > .pin";

/** The style the page's CSS gives the first `selector` inside `root`, once it is drawn. */
function styleOf(root: Element, selector: string): CSSStyleDeclaration | undefined {
  const element = root.querySelector(selector);
  return element ? getComputedStyle(element) : undefined;
}

/** Choosing Dark opens the map again on OpenFreeMap's dark style, ready. */
async function expectDarkStyleOnChoosing({ store, root }: RealRun): Promise<void> {
  chooseOption(root, "Map style", "Dark");
  await expect.poll(() => offsite.asked().at(-1), LOAD).toBe(DARK);
  await expect.poll(() => store.getSnapshot().loadState, LOAD).toBe("ready");
  expectNothingElseOffsite();
}
