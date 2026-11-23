import { afterEach, describe, expect, it, vi } from "vitest";
import type { MaplaceMapElement } from "./index";
import { MILAN_LOCATION, ROME_LOCATION } from "./testing/address";
import { connect, errorsOn, mapFrom, nextTask } from "./testing/fake-maps";
import { loaded, serve } from "./testing/fetch";

const ROME_FILE = [ROME_LOCATION];
const BOTH_FILE = [ROME_LOCATION, MILAN_LOCATION];
const NOT_LOCATIONS = { not: "locations" };
const ROUTE = { stops: ["rome", "milan"] };

afterEach(() => vi.unstubAllGlobals());

const ids = (map: MaplaceMapElement) => map.locations.map(({ id }) => id);

/** The map, connected again after a disconnect that stuck. */
async function reconnected(map: MaplaceMapElement): Promise<void> {
  map.remove();
  await nextTask();
  await connect(map);
  await loaded();
}

describe("<maplace-map src> failing", () => {
  it("stands as misuse for a bad file through a reconnect, fetched once, until a good one loads", async () => {
    const files = serve({ "/bad.json": NOT_LOCATIONS, "/rome.json": ROME_FILE });
    const map = await mapFrom('<maplace-map src="/bad.json"></maplace-map>');
    await loaded();
    expect(map.loadState).toBe("error");
    await reconnected(map);
    expect([map.loadState, files.asked()]).toEqual(["error", ["/bad.json"]]);
    map.setAttribute("src", "/rome.json");
    await loaded();
    expect([map.loadState, ids(map)]).toEqual(["loading", ["rome"]]);
  });

  it("reports a failed load as locations-load-failed, its locations and load state kept", async () => {
    serve({ "/rome.json": ROME_FILE });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    await loaded();
    const errors = errorsOn(map);
    map.setAttribute("src", "/gone.json");
    await loaded();
    expect(errors.map(({ code, field }) => [code, field])).toEqual([
      ["locations-load-failed", "src"],
    ]);
    expect([map.loadState, ids(map)]).toEqual(["loading", ["rome"]]);
  });

  it("fetches a failed file again when src is set again: a route given meanwhile fetches nothing, and draws once it lands", async () => {
    const served: Record<string, unknown> = {};
    const files = serve(served);
    const map = await mapFrom('<maplace-map src="/late.json"></maplace-map>');
    await loaded();
    map.route = ROUTE;
    map.route = ROUTE;
    await loaded();
    expect(files.asked()).toEqual(["/late.json"]);
    served["/late.json"] = BOTH_FILE;
    map.setAttribute("src", "/late.json");
    await loaded();
    expect([files.asked(), map.route?.stops]).toEqual([["/late.json", "/late.json"], ROUTE.stops]);
  });

  it("fetches a refused file again when src is set to the same URL, standing as misuse no more", async () => {
    const served: Record<string, unknown> = { "/late.json": NOT_LOCATIONS };
    const files = serve(served);
    const map = await mapFrom('<maplace-map src="/late.json"></maplace-map>');
    await loaded();
    expect(map.loadState).toBe("error");
    served["/late.json"] = ROME_FILE;
    map.setAttribute("src", "/late.json");
    await loaded();
    expect([files.asked(), map.loadState, ids(map)]).toEqual([
      ["/late.json", "/late.json"],
      "loading",
      ["rome"],
    ]);
  });

  it("keeps a route given while a file loads, or after, waiting when that file is refused, drawing it once a good one lands", async () => {
    const served: Record<string, unknown> = { "/a.json": BOTH_FILE, "/b.json": NOT_LOCATIONS };
    const files = serve(served);
    const map = await mapFrom('<maplace-map src="/a.json"></maplace-map>');
    await loaded();
    map.setAttribute("src", "/b.json");
    map.route = ROUTE;
    await loaded();
    map.route = ROUTE;
    await loaded();
    expect([map.route, files.asked()]).toEqual([undefined, ["/a.json", "/b.json"]]);
    served["/b.json"] = BOTH_FILE;
    map.setAttribute("src", "/b.json");
    await loaded();
    expect(map.route?.stops).toEqual(ROUTE.stops);
  });

  it("drops a load in flight when the map is removed, reporting nothing, and fetches it again once the map connects again", async () => {
    const files = serve({}, { held: true });
    const map = await mapFrom('<maplace-map src="/gone.json"></maplace-map>');
    const errors = errorsOn(map);
    map.remove();
    await nextTask();
    files.answer("/gone.json");
    await loaded();
    expect(errors).toEqual([]);
    document.body.append(map);
    await loaded();
    expect(files.asked()).toEqual(["/gone.json", "/gone.json"]);
  });

  it("keeps a failed file through a move, fetching it once", async () => {
    const files = serve({});
    const map = await mapFrom('<maplace-map src="/gone.json"></maplace-map>');
    await loaded();
    const errors = errorsOn(map);
    document.body.append(document.createElement("div"), map);
    await loaded();
    expect([files.asked(), errors]).toEqual([["/gone.json"], []]);
  });

  it("fetches a failed file again once the map connects again", async () => {
    const files = serve({});
    const map = await mapFrom('<maplace-map src="/gone.json"></maplace-map>');
    await loaded();
    await reconnected(map);
    expect(files.asked()).toEqual(["/gone.json", "/gone.json"]);
  });
});
