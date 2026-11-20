// A scene of one example, as its thumbnail or sharing image shows it: its page on the site, on
// MapLibre, the example's map (or the whole example) pinned to the viewport and nothing else drawn.
import type { SelectOptions } from "@maplacejs/maplace";
import type { MaplaceMapElement } from "@maplacejs/maplace/element";
import type { BrowserContext, Locator, Page } from "playwright";
import { CONSENT_GRANTED, CONSENT_KEY } from "../../apps/site/src/consent/consent-store.ts";
import { sectionPage } from "../../apps/site/test/home-sections.ts";
import { holdsItself, loadMapButton } from "../../apps/site/test/visitor.ts";
import type { ShotPlan } from "./plans.ts";
import { exampleSelector, finishingStyle, sceneStyle } from "./scene-style.ts";
import type { ShotSize } from "./shot-sizes.ts";
import { letThroughOnly, untilQuiet, watchTiles } from "./tiles.ts";

/** How long a map may take to open. */
const WAIT = { timeout: 30_000 };

/** A point the map shows and how close: what a sharing image takes from its thumbnail. */
export interface View {
  readonly center: { readonly lat: number; readonly lng: number };
  readonly zoom: number;
}

/** An example's scene, open and ready: what a plan stages it with. */
export interface Scene {
  readonly page: Page;
  /** The example as its page runs it on MapLibre: its map and its own controls. */
  readonly example: Locator;
  /** The example's map. */
  readonly map: Locator;
  view(view: View): Promise<void>;
  select(id: string, options?: SelectOptions): Promise<void>;
  hover(id: string): Promise<void>;
  /** Fits every location, as the map's first view does when it selects none. */
  fit(): Promise<void>;
  /** The view the map shows now, none while it holds itself. */
  shownView(): Promise<View | undefined>;
  /** The scene as `size`, once its tiles are in: the map's controls hidden, and its credit unless shown. */
  capture(size: ShotSize): Promise<Buffer>;
}

/**
 * `plan`'s example's page of the site at `siteUrl`, in `context`: framed from the first paint, so
 * its map opens at the scene's size and its first fit is the scene's, then given consent as a
 * returning visitor (MapLibre is the site's first provider, so Google is never asked).
 */
export async function openScene(
  context: BrowserContext,
  siteUrl: string,
  plan: ShotPlan,
): Promise<Scene> {
  await letThroughOnly(context, siteUrl);
  await context.addInitScript(asVisitorWhoConsented, {
    style: sceneStyle(plan),
    key: CONSENT_KEY,
    granted: CONSENT_GRANTED,
  });
  const page = await context.newPage();
  const tiles = watchTiles(page);
  await page.goto(new URL(sectionPage(plan.name), siteUrl).href);
  const section = page.locator(`section#${plan.name}`);
  const example = exampleSelector(plan.name);
  await untilReady(page, section, `${example} maplace-map`);
  return sceneOn(page, page.locator(example), () => untilQuiet(tiles));
}

/**
 * Run in the page before its own scripts: the maps consented to, and the scene's style in as soon
 * as the document has its root, which it hasn't yet at the very start.
 */
function asVisitorWhoConsented({
  style,
  key,
  granted,
}: {
  style: string;
  key: string;
  granted: string;
}): void {
  try {
    localStorage.setItem(key, granted);
  } catch {
    // A document without storage (about:blank) has no maps to consent to.
  }
  const addStyle = () => {
    const sheet = document.createElement("style");
    sheet.textContent = style;
    document.documentElement.append(sheet);
  };
  if (document.documentElement !== null) {
    addStyle();
    return;
  }
  new MutationObserver((_, observer) => {
    if (document.documentElement === null) return;
    observer.disconnect();
    addStyle();
  }).observe(document, { childList: true });
}

/**
 * Until the map at `mapSelector` is ready, or, for a map that holds itself, its panel offers to
 * load it: found again on each look, as the dev server may reload the page once as it opens.
 */
async function untilReady(page: Page, section: Locator, mapSelector: string): Promise<void> {
  if (await holdsItself(section)) {
    await page.locator(`${mapSelector}[data-held-by-example="open"]`).waitFor(WAIT);
    await loadMapButton(page.locator(mapSelector)).waitFor({ state: "visible", ...WAIT });
    return;
  }
  await page.waitForFunction(
    (selector) => document.querySelector<MaplaceMapElement>(selector)?.loadState === "ready",
    mapSelector,
    WAIT,
  );
}

/** The scene's calls on its map's store, through the element's `maplace`. */
function sceneOn(page: Page, example: Locator, untilTilesQuiet: () => Promise<void>): Scene {
  const map = example.locator("maplace-map").first();
  return {
    page,
    example,
    map,
    async view({ center, zoom }) {
      await map.evaluate((element: MaplaceMapElement, [at, z]) => element.maplace.setView(at, z), [
        center,
        zoom,
      ] as const);
    },
    async select(id, options) {
      await map.evaluate(
        (element: MaplaceMapElement, [at, given]) => element.maplace.select(at, given),
        [id, options] as const,
      );
    },
    async hover(id) {
      await map.evaluate((element: MaplaceMapElement, at) => element.maplace.hover(at), id);
    },
    async fit() {
      await map.evaluate((element: MaplaceMapElement) => element.maplace.fitAll());
    },
    shownView: () =>
      map.evaluate((element: MaplaceMapElement) => {
        const viewport = element.maplace.getSnapshot().viewport;
        return viewport && { center: viewport.center, zoom: viewport.zoom };
      }),
    async capture(size) {
      await page.addStyleTag({ content: finishingStyle(size) });
      await untilTilesQuiet();
      return page.screenshot({ type: "jpeg", quality: 85 });
    },
  };
}
