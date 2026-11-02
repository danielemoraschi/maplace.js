// Records the README's GIF: run by hand after `npm run build`, when the map or the list changes.
// Needs ffmpeg and gifsicle on PATH, and the network for OpenFreeMap's tiles.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { type BrowserContext, chromium, type Locator, type Page } from "playwright";
import { CDN_SCRIPTS } from "./build/cdn-builds.ts";
import { DIST, ROOT } from "./build/package.ts";
import { newTempDir, removeTempDir } from "./build/temp-dir.ts";

// Its `<script src>` names this same file: `CDN_SCRIPTS.maplibre`.
const PAGE = resolve(ROOT, "scripts/readme-demo.html");
const SCRIPT = resolve(ROOT, DIST, CDN_SCRIPTS.maplibre);
const DEMO_URL = "https://demo.maplace.test/";
const GIF = resolve(ROOT, "docs/media/maplibre-demo.gif");
const VIEWPORT = { width: 800, height: 450 };
const MOST_BYTES = 2_000_000;
const READY_WITHIN_MS = 30_000;
/** How long the map gets to settle before the GIF starts. */
const TILES_MS = 1500;
/** How long each selection is shown. */
const HOLD_MS = 2200;
const POINTER_REST = { x: 660, y: 330 };

/** Serves the page and the built script to `context`, as a MapLibre page has to be served. */
async function serveDemo(context: BrowserContext): Promise<void> {
  if (!existsSync(SCRIPT)) throw new Error(`no ${SCRIPT}: run npm run build first`);
  await context.route(DEMO_URL, (route) =>
    route.fulfill({ contentType: "text/html", body: readFileSync(PAGE, "utf8") }),
  );
  await context.route(`${DEMO_URL}${CDN_SCRIPTS.maplibre}`, (route) =>
    route.fulfill({ contentType: "text/javascript", body: readFileSync(SCRIPT) }),
  );
}

/** Every place shown once before the GIF starts, so no pan in it waits for its tiles. */
async function visitEveryPlace(page: Page): Promise<void> {
  for (const id of ["rome", "milan", "venice", undefined]) {
    await page.evaluate((selected) => {
      type Demo = { maplace: { select(id?: string): void; fitAll(): void } };
      const { maplace } = document.getElementById("demo") as unknown as Demo;
      maplace.select(selected);
      if (selected === undefined) maplace.fitAll();
    }, id);
    await page.waitForTimeout(HOLD_MS);
  }
}

/** A click the recording shows: the pointer travels there first. */
async function clickSeen(page: Page, target: Locator): Promise<void> {
  const box = await target.boundingBox();
  if (box === null) throw new Error(`the demo can't see ${target}`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(HOLD_MS);
}

/** Records the demo in `folder`: the video, and how far into it the map has drawn. */
async function recordDemo(folder: string): Promise<{ video: string; readyAtMs: number }> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      recordVideo: { dir: folder, size: VIEWPORT },
    });
    await serveDemo(context);
    const startedAt = Date.now();
    const page = await context.newPage();
    await page.goto(DEMO_URL);
    await page.waitForFunction(
      () =>
        (document.getElementById("demo") as { loadState?: string } | null)?.loadState === "ready",
      undefined,
      { timeout: READY_WITHIN_MS },
    );
    await visitEveryPlace(page);
    await page.mouse.move(POINTER_REST.x, POINTER_REST.y);
    await page.waitForTimeout(TILES_MS);
    const readyAtMs = Date.now() - startedAt;
    await clickSeen(page, page.getByRole("option", { name: "Rome" }));
    await clickSeen(page, page.getByRole("option", { name: "Milan" }));
    // Venice's pin: in view at Milan's zoom, as it wasn't at Rome's.
    await clickSeen(page, page.locator(".pin").nth(2));
    await context.close();
    const video = readdirSync(folder).find((file) => file.endsWith(".webm"));
    if (video === undefined) throw new Error("Playwright wrote no video");
    return { video: join(folder, video), readyAtMs };
  } finally {
    await browser.close();
  }
}

function run(tool: string, args: readonly string[]): void {
  try {
    execFileSync(tool, args, { stdio: "pipe" });
  } catch (error) {
    throw new Error(`${tool} failed, or isn't on PATH`, { cause: error });
  }
}

/** The video from `readyAtMs` on as an optimised GIF, refused when too large for a README. */
function toGif(video: string, readyAtMs: number, gif: string): void {
  const draft = join(dirname(video), "draft.gif");
  const filter = `fps=10,scale=${VIEWPORT.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64:stats_mode=diff[p];[b][p]paletteuse=dither=none`;
  const start = (readyAtMs / 1000).toFixed(2);
  run("ffmpeg", ["-y", "-i", video, "-ss", start, "-filter_complex", filter, "-loop", "0", draft]);
  run("gifsicle", ["-O3", "--lossy=160", "--batch", draft]);
  const { size } = statSync(draft);
  if (size > MOST_BYTES) throw new Error(`the GIF is ${size} bytes, over ${MOST_BYTES}`);
  copyFileSync(draft, gif);
}

const folder = newTempDir("demo");
try {
  const { video, readyAtMs } = await recordDemo(folder);
  toGif(video, readyAtMs, GIF);
} finally {
  removeTempDir(folder);
}
