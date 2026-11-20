// A scene's network: the site and OpenFreeMap's live tiles let through, the rest refused, and
// when the tiles have stopped coming.
import { setTimeout as pause } from "node:timers/promises";
import type { BrowserContext, Page, Request } from "playwright";
import { OPENFREEMAP, thirdPartyOf } from "../../apps/site/src/site/third-parties.ts";
import { settled } from "../../apps/site/test/site-session.ts";

/** Whether `url` is OpenFreeMap's: MapLibre's default style, its tiles, glyphs and sprites, fetched live. */
const isTile = (url: string) => thirdPartyOf(url) === OPENFREEMAP;

/** How long the tiles may keep coming. */
const QUIET_WITHIN = { timeout: 30_000 };

/** What a fade (a popup, a selected pin) is given to finish once the tiles are in. */
const FADES_MS = 500;

/** The requests for tiles a page made: how many so far, and how many still out. */
export interface TileCounts {
  asked: number;
  out: number;
}

/** Lets the site at `siteUrl` and the tiles through `context`, refusing the rest. */
export async function letThroughOnly(
  context: Pick<BrowserContext, "route">,
  siteUrl: string,
): Promise<void> {
  const siteOrigin = new URL(siteUrl).origin;
  await context.route("**/*", (route) => {
    const url = route.request().url();
    const allowed = new URL(url).origin === siteOrigin || isTile(url);
    return allowed ? route.continue() : route.abort();
  });
}

/** Counts `page`'s requests for tiles from now on. */
export function watchTiles(page: Pick<Page, "on">): TileCounts {
  const counts = { asked: 0, out: 0 };
  page.on("request", (request) => {
    if (!isTile(request.url())) return;
    counts.asked += 1;
    counts.out += 1;
  });
  const done = (request: Request) => {
    if (isTile(request.url())) counts.out -= 1;
  };
  page.on("requestfinished", done);
  page.on("requestfailed", done);
  return counts;
}

/** Until no tile is out and none was asked for a while, then the fades. */
export async function untilQuiet(counts: TileCounts): Promise<void> {
  await settled(async () => (counts.out === 0 ? counts.asked : undefined), {
    ...QUIET_WITHIN,
    what: "the tiles asked for",
  });
  await pause(FADES_MS);
}
