import { describe, expect, it, vi } from "vitest";
import { floatingAliases, floatingPaths, pinnedFiles, purgeProblems } from "./cdn-purge.ts";
import type { Fetch } from "./published-package.ts";
import { parseVersion } from "./versions.ts";

const PURGE = "https://purge.jsdelivr.net";
const PATH = "/npm/@maplacejs/maplace@1/dist/a.iife.js";
const OTHER = "/npm/@maplacejs/maplace@latest/dist/a.iife.js";

/** The README as the repo writes it: the scripts' versions and hashes are filled in when staged. */
const README = ["a.iife.js", "b.iife.js"]
  .map(
    (file) =>
      `<script src="https://cdn.jsdelivr.net/npm/@maplacejs/maplace@x.y.z/dist/${file}"\n  integrity="sha384-…" crossorigin="anonymous"></script>`,
  )
  .join("\n");

/** jsDelivr's answer to a purge of `path` that worked on every provider. */
const purged = (path: string) => ({
  id: "x",
  status: "finished",
  paths: { [path]: { throttled: false, providers: { CF: true, FY: true } } },
});

const answering = (answer: (path: string) => Response | Promise<Response>) =>
  vi.fn<Fetch>(async (url) => answer(url.slice(PURGE.length)));

describe("floatingAliases", () => {
  it("names the major, minor, latest and bare aliases of a release", () => {
    expect(floatingAliases(parseVersion("1.3.2"))).toEqual(["@1", "@1.3", "@latest", ""]);
  });

  it("moves no alias for a pre-release", () => {
    expect(floatingAliases(parseVersion("1.4.0-rc.1"))).toEqual([]);
  });
});

describe("pinnedFiles", () => {
  it("purges each pinned script and its map", () => {
    expect(pinnedFiles(README)).toEqual([
      "a.iife.js",
      "a.iife.js.map",
      "b.iife.js",
      "b.iife.js.map",
    ]);
  });

  it("refuses a README that pins no script", () => {
    expect(() => pinnedFiles("# Maplace.js")).toThrow("the README pins no script");
  });
});

describe("floatingPaths", () => {
  it("is each file under each alias, on jsDelivr's npm paths", () => {
    expect(floatingPaths(["@1", ""], ["a.js"])).toEqual([
      "/npm/@maplacejs/maplace@1/dist/a.js",
      "/npm/@maplacejs/maplace/dist/a.js",
    ]);
  });
});

describe("purgeProblems", () => {
  it("reports nothing when jsDelivr purged every path everywhere", async () => {
    const fetchUrl = answering((path) => Response.json(purged(path)));
    expect(await purgeProblems([PATH, OTHER], fetchUrl)).toEqual({ problems: [], throttled: [] });
    expect(fetchUrl.mock.calls.map(([url]) => url)).toEqual([
      `${PURGE}${PATH}`,
      `${PURGE}${OTHER}`,
    ]);
  });

  it("counts a path jsDelivr purged too recently to purge again as purged, naming it", async () => {
    const throttled = { status: "finished", paths: { [PATH]: { throttled: true, providers: {} } } };
    expect(
      await purgeProblems(
        [PATH],
        answering(() => Response.json(throttled)),
      ),
    ).toEqual({
      problems: [],
      throttled: [PATH],
    });
  });

  it.each([
    [
      "an error answer",
      () => new Response("down", { status: 503 }),
      "jsDelivr's purge answered 503",
    ],
    [
      "an answer that isn't JSON",
      () => new Response("<html>"),
      "jsDelivr's purge gave no JSON answer",
    ],
    [
      "a purge not finished",
      () => Response.json({ ...purged(PATH), status: "pending" }),
      "jsDelivr's purge is pending",
    ],
    [
      "a path missing from it",
      () => Response.json(purged(OTHER)),
      "jsDelivr's purge doesn't name it",
    ],
    [
      "a provider that failed",
      () =>
        Response.json({
          status: "finished",
          paths: { [PATH]: { throttled: false, providers: { CF: true, FY: false } } },
        }),
      "not purged on FY",
    ],
    [
      "an answer naming no provider",
      () =>
        Response.json({
          status: "finished",
          paths: { [PATH]: { throttled: false, providers: {} } },
        }),
      "jsDelivr's purge names no provider",
    ],
    [
      "a host that can't be reached",
      () => Promise.reject(new TypeError("fetch failed", { cause: new Error("ENOTFOUND") })),
      "jsDelivr's purge can't be reached: fetch failed (ENOTFOUND)",
    ],
  ])("reports, by path, %s", async (_case, answer, problem) => {
    const { problems } = await purgeProblems([PATH], answering(answer));
    expect(problems).toEqual([`${PATH}: ${problem}`]);
  });
});
