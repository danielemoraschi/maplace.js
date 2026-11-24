import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type Browser, chromium, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { builtCdnScript, CDN_SCRIPTS } from "./cdn-builds.ts";
import { tempDir } from "./temp-dir.ts";

// The MapLibre CDN script's worker. Blocked by the page's content security policy, it never starts:
// its failure, one `error` event early on, in every timing a map can meet it. A dead worker lasts
// as long as its page, so each case is a fresh page. This pins MapLibre's wording too
// (`WORKER_FAILED`, maplibre/map-errors.ts): an upgrade rewording it fails here. Opened as a file
// with no such policy, the worker starts: maplibre-gl 6.17 and later need no web server.

/** A content security policy that lets no worker start. */
const NO_WORKERS = `<meta http-equiv="Content-Security-Policy" content="worker-src 'none'">`;

const STYLE = { version: 8, sources: {}, layers: [] };
const INLINE = JSON.stringify(STYLE);
/** A style answering after `delay` ms. */
const styleAfter = (delay: number) => `https://style.maplace.test/style.json?delay=${delay}`;

const MAP = 'style="display:block;width:400px;height:300px"';
const element = (id: string, style: string) =>
  `<maplace-map id="${id}" ${MAP} map-style='${style}'></maplace-map>`;

/** Keeps what each map reports, by its container's id, for `outcomeOf`. */
const RECORDER = `<script>
  window.reported = {};
  window.stores = {};
  window.note = (id, { code, message }) => (window.reported[id] ??= []).push({ code, message });
  window.watched = (id, store) => {
    window.stores[id] = store;
    store.on("error", ({ error }) => window.note(id, error));
    return store;
  };
  window.createdMap = (id) => {
    const div = document.body.appendChild(document.createElement("div"));
    div.id = id;
    div.style.cssText = "width:400px;height:300px";
    return window.watched(id, Maplace.createMapLibreMap(div, { mapStyle: ${INLINE} }));
  };
  document.addEventListener("maplace-error", (event) => window.note(event.target.id, event.detail.error));
</script>`;

interface Outcome {
  readonly loadState: string | undefined;
  readonly errors: readonly { readonly code: string; readonly message: string }[];
  readonly panel: string | null;
}

let browser: Browser;
const folder = tempDir("cdn-worker");
let pages = 0;

beforeAll(async () => {
  await writeFile(join(folder, CDN_SCRIPTS.maplibre), await builtCdnScript("maplibre"));
  browser = await chromium.launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
});

/** A page of `head` and `body` in a new context, opened as a file; closed when `check` is done. */
async function onPage(
  head: string,
  body: string,
  check: (page: Page) => Promise<void>,
): Promise<void> {
  pages += 1;
  const file = join(folder, `page-${pages}.html`);
  const script = `<script src="${CDN_SCRIPTS.maplibre}"></script>`;
  await writeFile(
    file,
    `<!doctype html><head>${head}</head><body>${script}${RECORDER}${body}</body>`,
  );
  const context = await browser.newContext();
  try {
    await context.route("https://style.maplace.test/**", async (route) => {
      const delay = Number(new URL(route.request().url()).searchParams.get("delay"));
      await new Promise((resolve) => setTimeout(resolve, delay));
      await route.fulfill({ json: STYLE, headers: { "access-control-allow-origin": "*" } });
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(file).href);
    await check(page);
  } finally {
    await context.close();
  }
}

/** `body` on a page whose policy blocks the worker. */
const withWorkersBlocked = (body: string, check: (page: Page) => Promise<void>) =>
  onPage(NO_WORKERS, body, check);

function outcomeOf(page: Page, id: string): Promise<Outcome> {
  return page.evaluate((id) => {
    const scope = window as unknown as {
      reported: Record<string, Outcome["errors"]>;
      stores: Record<string, { getSnapshot(): { loadState: string } }>;
    };
    const container = document.getElementById(id) as (HTMLElement & { loadState?: string }) | null;
    const words = container?.querySelector<HTMLElement>(".maplace-map-failure>*");
    return {
      loadState: scope.stores[id]?.getSnapshot().loadState ?? container?.loadState,
      errors: scope.reported[id] ?? [],
      panel: words?.checkVisibility() ? words.textContent : null,
    };
  }, id);
}

const THE_PANEL = "The map couldn't load.";

/** Waits for `id` to fail, then expects one error naming the worker, and no style. */
async function expectWorkerFailure(page: Page, id: string, panel: string | null = THE_PANEL) {
  await page.waitForFunction(
    (id) => {
      const { reported } = window as unknown as { reported: Record<string, unknown[]> };
      return (reported[id]?.length ?? 0) > 0;
    },
    id,
    { timeout: 15_000 },
  );
  // A second report, if there were one, comes on the heels of the first.
  await page.waitForTimeout(200);
  const outcome = await outcomeOf(page, id);
  expect(outcome.loadState, id).toBe("error");
  expect(outcome.errors, id).toHaveLength(1);
  expect(outcome.errors[0]?.code).toBe("provider-load-failed");
  expect(outcome.errors[0]?.message).toMatch(/worker/i);
  expect(outcome.errors[0]?.message).not.toMatch(/style/i);
  expect(outcome.errors[0]?.message).toMatch(/content security policy/);
  expect(outcome.panel, id).toBe(panel);
}

describe("the MapLibre script with its worker blocked", { timeout: 60_000 }, () => {
  it.each([
    ["an inline style", INLINE],
    ["a style answering at once", styleAfter(0)],
    ["a slower style", styleAfter(1500)],
  ])("%s: error, naming the worker, not the style", (_, style) =>
    withWorkersBlocked(element("map", style), (page) => expectWorkerFailure(page, "map")),
  );

  it("a second map beside the first: each error, naming the worker", () =>
    withWorkersBlocked(
      element("first", INLINE) + element("second", styleAfter(800)),
      async (page) => {
        await expectWorkerFailure(page, "first");
        await expectWorkerFailure(page, "second");
      },
    ));

  it("an element added after the first map failed", () =>
    withWorkersBlocked(element("first", INLINE), async (page) => {
      await expectWorkerFailure(page, "first");
      await page.evaluate(
        (html) => document.body.insertAdjacentHTML("beforeend", html),
        element("later", INLINE),
      );
      await expectWorkerFailure(page, "later");
    }));

  it("Maplace.createMapLibreMap added after the first map failed", () =>
    withWorkersBlocked(element("first", INLINE), async (page) => {
      await expectWorkerFailure(page, "first");
      await page.evaluate(() =>
        (window as never as { createdMap(id: string): void }).createdMap("later"),
      );
      await expectWorkerFailure(page, "later");
    }));

  it("a map destroyed, then another: the second fails too", () =>
    withWorkersBlocked("<script>window.createdMap('first')</script>", async (page) => {
      await expectWorkerFailure(page, "first");
      await page.evaluate(() => {
        const scope = window as never as {
          stores: Record<string, { destroy(): void }>;
          createdMap(id: string): void;
        };
        scope.stores.first?.destroy();
        scope.createdMap("second");
      });
      await expectWorkerFailure(page, "second");
    }));

  it("a page's own map with a slower style: error naming the worker, and no panel", () =>
    withWorkersBlocked(
      `<div id="own" style="width:400px;height:300px"></div>
      <script>
        const map = new Maplace.maplibre.Map({ container: "own", style: "${styleAfter(1500)}" });
        window.watched("own", Maplace.createMaplace({ locations: [] }))
          .attach(Maplace.createMapLibreAdapter({ map }), "#own");
      </script>`,
      (page) => expectWorkerFailure(page, "own", null),
    ));
});

describe("the MapLibre script opened as a file", { timeout: 60_000 }, () => {
  it("the element with a style URL: ready, with no error", () =>
    onPage("", element("map", styleAfter(0)), async (page) => {
      await page.waitForFunction(
        () =>
          (document.getElementById("map") as { loadState?: string } | null)?.loadState === "ready",
        null,
        { timeout: 15_000 },
      );
      // The worker's failure, were it to come, comes on the heels of the style.
      await page.waitForTimeout(200);
      expect(await outcomeOf(page, "map")).toEqual({ loadState: "ready", errors: [], panel: null });
    }));

  it("a page's own map loads its GeoJSON in the worker, with no error", () =>
    onPage(
      "",
      `<div id="own" style="width:400px;height:300px"></div>
      <script>
        const points = {
          type: "geojson",
          data: { type: "Point", coordinates: [12.5, 41.9] },
        };
        const style = {
          version: 8,
          sources: { points },
          layers: [{ id: "points", type: "circle", source: "points" }],
        };
        const map = new Maplace.maplibre.Map({ container: "own", style });
        window.watched("own", Maplace.createMaplace({ locations: [] }))
          .attach(Maplace.createMapLibreAdapter({ map }), "#own");
        map.on("idle", () => (window.loaded = map.isSourceLoaded("points")));
      </script>`,
      async (page) => {
        await page.waitForFunction(() => (window as { loaded?: boolean }).loaded === true, null, {
          timeout: 15_000,
        });
        expect(await outcomeOf(page, "own")).toEqual({
          loadState: "ready",
          errors: [],
          panel: null,
        });
      },
    ));
});
