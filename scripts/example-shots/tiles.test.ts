import { EventEmitter } from "node:events";
import type { BrowserContext, Page, Request, Route } from "playwright";
import { describe, expect, it } from "vitest";
import { OPENFREEMAP } from "../../apps/site/src/site/third-parties.ts";
import { letThroughOnly, untilQuiet, watchTiles } from "./tiles.ts";

const TILE_HOST = OPENFREEMAP.domains[0];

const SITE = "http://localhost:4390";
const request = (url: string) => ({ url: () => url }) as Request;

/** What `letThroughOnly` does with a request for `url`: the route's answer its handler returns. */
async function answerFor(url: string): Promise<unknown> {
  let handler: ((route: Route) => unknown) | undefined;
  const context = {
    route: async (_: string, given: typeof handler) => {
      handler = given;
    },
  };
  await letThroughOnly(context as unknown as Pick<BrowserContext, "route">, SITE);
  return handler?.({
    request: () => request(url),
    continue: async () => "continue",
    abort: async () => "abort",
  } as unknown as Route);
}

describe("letThroughOnly", () => {
  it("lets the site and the tiles through, and refuses any other host", async () => {
    expect(await answerFor(`${SITE}/examples/markers/simple/`)).toBe("continue");
    expect(await answerFor(`https://${TILE_HOST}/styles/bright`)).toBe("continue");
    expect(await answerFor("https://maps.googleapis.com/maps/api/js")).toBe("abort");
  });
});

describe("watchTiles", () => {
  it("counts the tiles asked for and still out, and nothing else", () => {
    const page = new EventEmitter();
    const counts = watchTiles(page as unknown as Pick<Page, "on">);
    const tile = request(`https://${TILE_HOST}/planet/1/2/3.pbf`);
    page.emit("request", tile);
    page.emit("request", tile);
    page.emit("request", request(`${SITE}/favicon.ico`));
    page.emit("requestfinished", tile);
    page.emit("requestfinished", request(`${SITE}/favicon.ico`));
    expect(counts).toEqual({ asked: 2, out: 1 });
    page.emit("requestfailed", tile);
    expect(counts).toEqual({ asked: 2, out: 0 });
  });
});

describe("untilQuiet", () => {
  it("waits until no tile is out and none is asked for", async () => {
    const counts = { asked: 3, out: 1 };
    setTimeout(() => {
      counts.out = 0;
    }, 300);
    await untilQuiet(counts);
    expect(counts.out).toBe(0);
  }, 10_000);
});
