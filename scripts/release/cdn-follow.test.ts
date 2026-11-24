import { describe, expect, it, vi } from "vitest";
import { FOLLOW_TIMES, floatingUrlProblems } from "./cdn-follow.ts";
import { toolsOnFakeClock } from "./fake-clock.ts";
import type { Fetch } from "./published-package.ts";
import { parseVersion } from "./versions.ts";

const VERSION = parseVersion("1.3.0");
const FILES = ["a.iife.js", "a.iife.js.map", "b.iife.js", "b.iife.js.map"];
const PURGE = "https://purge.jsdelivr.net";
const CDN = "https://cdn.jsdelivr.net";
const PATHS = 4 * FILES.length;

/** How jsDelivr answers a purge of a path: done, throttled, or down. */
type Purging = "done" | "throttled" | "down";

/** jsDelivr purging as `purging` says, each floating path answering what `servedBy` says then. */
function jsDelivr(servedBy: (path: string) => string, purging: Purging = "done") {
  return vi.fn<Fetch>(async (url) => {
    if (url.startsWith(PURGE)) {
      const path = url.slice(PURGE.length);
      if (purging === "down") return new Response("down", { status: 503 });
      const throttled = purging === "throttled";
      return Response.json({
        status: "finished",
        paths: { [path]: { throttled, providers: throttled ? {} : { CF: true } } },
      });
    }
    return new Response(null, { headers: { "x-jsd-version": servedBy(url.slice(CDN.length)) } });
  });
}

const purged = (fetchUrl: ReturnType<typeof jsDelivr>) =>
  fetchUrl.mock.calls.flatMap(([url]) => (url.startsWith(PURGE) ? [url.slice(PURGE.length)] : []));

const STALE_MAPLIBRE = "/npm/@maplacejs/maplace@1/dist/b.iife.js";

describe("floatingUrlProblems", () => {
  it("purges each floating path once and stops when each answers the release", async () => {
    const fetchUrl = jsDelivr(() => "1.3.0");
    const run = toolsOnFakeClock(fetchUrl);
    expect(await floatingUrlProblems(VERSION, FILES, run)).toEqual([]);
    expect(purged(fetchUrl)).toHaveLength(PATHS);
    const asked = fetchUrl.mock.calls.filter(([, init]) => init?.method === "HEAD");
    expect(asked).toHaveLength(PATHS);
    expect(run.wait).not.toHaveBeenCalled();
  });

  it("purges again only a path that still answers the version before, until it moves", async () => {
    let asked = 0;
    const fetchUrl = jsDelivr((path) =>
      path === STALE_MAPLIBRE && asked++ < 1 ? "1.2.0" : "1.3.0",
    );
    const run = toolsOnFakeClock(fetchUrl);
    expect(await floatingUrlProblems(VERSION, FILES, run)).toEqual([]);
    expect(purged(fetchUrl)).toHaveLength(PATHS + 1);
    expect(purged(fetchUrl).at(-1)).toBe(STALE_MAPLIBRE);
    expect(run.log).toHaveBeenCalledWith(`Not yet: ${STALE_MAPLIBRE} still answers 1.2.0`);
  });

  it("fails while any file of an alias lags, though the alias's first file moved", async () => {
    const run = toolsOnFakeClock(jsDelivr((path) => (path === STALE_MAPLIBRE ? "1.2.0" : "1.3.0")));
    expect(await floatingUrlProblems(VERSION, FILES, run)).toEqual([
      `${STALE_MAPLIBRE} still answers 1.2.0`,
    ]);
    expect(run.elapsed()).toBeLessThanOrEqual(FOLLOW_TIMES.deadlineMs);
    expect(run.elapsed()).toBeGreaterThan(FOLLOW_TIMES.deadlineMs - FOLLOW_TIMES.waitMs);
  });

  it("leaves a throttled path to its answer, and logs it", async () => {
    const fresh = toolsOnFakeClock(jsDelivr(() => "1.3.0", "throttled"));
    expect(await floatingUrlProblems(VERSION, FILES, fresh)).toEqual([]);
    expect(fresh.log).toHaveBeenCalledWith(
      `jsDelivr purged ${PATHS} of the floating paths too recently to purge again: their answers tell`,
    );
    const stale = toolsOnFakeClock(jsDelivr(() => "1.2.0", "throttled"));
    expect(await floatingUrlProblems(VERSION, FILES, stale)).toHaveLength(PATHS);
  });

  it("doesn't ask the paths while the purge itself failed", async () => {
    const fetchUrl = jsDelivr(() => "1.3.0", "down");
    const problems = await floatingUrlProblems(VERSION, FILES, toolsOnFakeClock(fetchUrl));
    expect(problems).toHaveLength(PATHS);
    expect(problems[0]).toMatch(/: jsDelivr's purge answered 503$/);
    expect(fetchUrl.mock.calls.some(([url]) => url.startsWith(CDN))).toBe(false);
  });

  it("reports a path jsDelivr can't be asked, one it answers with an error, and one that names no version", async () => {
    const files = ["a.iife.js"];
    const fetchUrl = vi.fn<Fetch>(async (url, init) => {
      if (url.startsWith(PURGE)) return jsDelivr(() => "1.3.0")(url, init);
      if (url.includes("@latest")) throw new TypeError("fetch failed");
      if (url.includes("@1/")) return new Response(null, { status: 503 });
      return new Response(
        null,
        url.includes("@1.3/") ? {} : { headers: { "x-jsd-version": "1.3.0" } },
      );
    });
    expect(await floatingUrlProblems(VERSION, files, toolsOnFakeClock(fetchUrl))).toEqual([
      "/npm/@maplacejs/maplace@1/dist/a.iife.js answered 503",
      "/npm/@maplacejs/maplace@1.3/dist/a.iife.js still answers no version",
      "/npm/@maplacejs/maplace@latest/dist/a.iife.js can't be asked: fetch failed",
    ]);
  });
});
