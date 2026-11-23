import { afterEach, describe, expect, it, vi } from "vitest";
import type { MaplaceMapElement } from "./index";
import { MILAN_LOCATION, ROME_LOCATION } from "./testing/address";
import { errorsOn, mapFrom, nextTask, ROME } from "./testing/fake-maps";
import { PARK, stubFetch } from "./testing/fetch";

const ROME_FILE = [ROME_LOCATION];
const MILAN_FILE = [MILAN_LOCATION];

/**
 * `fetch` answering from `files` by path (404 for any other), at once, or held until the test
 * lets each go with `answer(path)`. Returns the paths asked for.
 */
function serve(files: Record<string, unknown>, { held = false } = {}) {
  const respond = (url: string) =>
    url in files ? Response.json(files[url]) : new Response("", { status: 404 });
  const requests = stubFetch(held ? undefined : respond);
  return {
    asked: () => requests.map(({ url }) => url),
    answer: (url: string) => requests.find((request) => request.url === url)?.answer(respond(url)),
  };
}

afterEach(() => vi.unstubAllGlobals());

/** Long enough for a served file to be fetched, read and applied. */
async function loaded(): Promise<void> {
  for (let task = 0; task < 3; task++) await nextTask();
}

const ids = (map: MaplaceMapElement) => map.locations.map(({ id }) => id);

describe("<maplace-map src>", () => {
  it("shows the locations src names, a list or a FeatureCollection", async () => {
    serve({ "/rome.json": ROME_FILE, "/park.json": PARK });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    await loaded();
    expect(ids(map)).toEqual(["rome"]);
    map.setAttribute("src", "/park.json");
    await loaded();
    expect(map.locations).toMatchObject([{ id: "gate", title: "Gate" }]);
  });

  it("loads again when src changes, the last one winning", async () => {
    const files = serve({ "/rome.json": ROME_FILE, "/milan.json": MILAN_FILE }, { held: true });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    map.setAttribute("src", "/milan.json");
    await nextTask();
    files.answer("/milan.json");
    files.answer("/rome.json");
    await loaded();
    expect(ids(map)).toEqual(["milan"]);
  });

  it("fetches nothing on a held map, until release", async () => {
    const files = serve({ "/rome.json": ROME_FILE });
    const map = await mapFrom('<maplace-map hold src="/rome.json"></maplace-map>');
    await loaded();
    expect([files.asked(), map.locations]).toEqual([[], []]);
    map.release();
    await loaded();
    expect(ids(map)).toEqual(["rome"]);
  });

  it("fetches at once on a lazy map off-screen", async () => {
    const files = serve({ "/rome.json": ROME_FILE });
    const map = await mapFrom(
      '<maplace-map loading="lazy" style="display: block; margin-top: 300vh" src="/rome.json"></maplace-map>',
    );
    await loaded();
    expect([files.asked(), ids(map)]).toEqual([["/rome.json"], ["rome"]]);
  });

  it("leaves the locations a page set on map.maplace while held, with no src, on release", async () => {
    const map = await mapFrom("<maplace-map hold></maplace-map>");
    map.maplace.setLocations(ROME_FILE);
    map.release();
    await nextTask();
    expect(ids(map)).toEqual(["rome"]);
  });

  it("draws a route given before the file lands once it does", async () => {
    const files = serve({ "/both.json": [...ROME_FILE, ...MILAN_FILE] }, { held: true });
    const map = await mapFrom('<maplace-map src="/both.json"></maplace-map>');
    const errors = errorsOn(map);
    map.route = { stops: ["rome", "milan"] };
    files.answer("/both.json");
    await loaded();
    expect([errors, map.route?.stops]).toEqual([[], ["rome", "milan"]]);
  });

  it("draws a route set in the same task as a new src once that file lands", async () => {
    serve({ "/rome.json": ROME_FILE, "/both.json": [...ROME_FILE, ...MILAN_FILE] });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    await loaded();
    const errors = errorsOn(map);
    map.setAttribute("src", "/both.json");
    map.route = { stops: ["rome", "milan"] };
    await loaded();
    expect([errors, map.route?.stops]).toEqual([[], ["rome", "milan"]]);
  });

  it("draws a route given while the file loads once the page sets locations instead", async () => {
    serve({ "/both.json": ROME_FILE }, { held: true });
    const map = await mapFrom('<maplace-map src="/both.json"></maplace-map>');
    const errors = errorsOn(map);
    map.route = { stops: ["rome", "milan"] };
    map.locations = [...ROME_FILE, ...MILAN_FILE];
    await loaded();
    expect([errors, map.route?.stops]).toEqual([[], ["rome", "milan"]]);
  });

  it("tries a failed load again when src is set to the same URL", async () => {
    const files = serve({});
    const map = await mapFrom('<maplace-map src="/late.json"></maplace-map>');
    await loaded();
    expect(map.locations).toEqual([]);
    vi.unstubAllGlobals();
    serve({ "/late.json": ROME_FILE });
    map.setAttribute("src", "/late.json");
    await loaded();
    expect([files.asked(), ids(map)]).toEqual([["/late.json"], ["rome"]]);
  });

  it("keeps a file loading through a move, fetching it once", async () => {
    const files = serve({ "/rome.json": ROME_FILE }, { held: true });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    document.body.append(document.createElement("div"), map);
    files.answer("/rome.json");
    await loaded();
    expect([files.asked(), ids(map)]).toEqual([["/rome.json"], ["rome"]]);
  });

  it("is misuse beside a JSON script too", async () => {
    const files = serve({ "/milan.json": MILAN_FILE });
    const errors = errorsOn(document);
    const map = await mapFrom(
      '<maplace-map src="/milan.json"><script type="application/json">[]</script></maplace-map>',
    );
    await loaded();
    expect([map.loadState, errors.map(({ field }) => field), files.asked()]).toEqual([
      "error",
      ["src"],
      [],
    ]);
  });

  it("is misuse beside location children, the locations staying", async () => {
    serve({ "/milan.json": MILAN_FILE });
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("src", "/milan.json");
    await loaded();
    expect([map.loadState, ids(map)]).toEqual(["error", ["rome"]]);
    expect(errors.map(({ message }) => message)).toEqual([
      "<maplace-map>: give locations through src or inside the element, not both",
    ]);
  });

  it("stops standing as misuse once the page corrects it, then loads", async () => {
    serve({ "/milan.json": MILAN_FILE });
    const map = await mapFrom(`<maplace-map src="/milan.json">${ROME}</maplace-map>`);
    expect(map.loadState).toBe("error");
    map.querySelector("maplace-location")?.remove();
    await loaded();
    expect([map.loadState, ids(map)]).toEqual(["loading", ["milan"]]);
  });

  it("says a blank src to a maplace-error listener added after the element", async () => {
    document.body.innerHTML = '<maplace-map src=" "></maplace-map>';
    const map = document.querySelector("maplace-map") as MaplaceMapElement;
    const errors = errorsOn(map);
    await nextTask();
    expect(errors.map(({ code, field }) => [code, field])).toEqual([["invalid-input", "src"]]);
    expect(map.loadState).toBe("error");
  });

  it("stands as misuse for a bad file through a reconnect, fetched once, until a good one loads", async () => {
    const files = serve({ "/bad.json": { not: "locations" }, "/rome.json": ROME_FILE });
    const map = await mapFrom('<maplace-map src="/bad.json"></maplace-map>');
    await loaded();
    expect(map.loadState).toBe("error");
    map.remove();
    await nextTask();
    document.body.append(map);
    await loaded();
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

  it("gives way to the locations property", async () => {
    const files = serve({ "/rome.json": ROME_FILE }, { held: true });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    map.locations = MILAN_FILE;
    files.answer("/rome.json");
    await loaded();
    expect(ids(map)).toEqual(["milan"]);
  });

  it("reads the element's inside again once src is removed", async () => {
    serve({ "/rome.json": ROME_FILE });
    const map = await mapFrom('<maplace-map src="/rome.json"></maplace-map>');
    await loaded();
    map.removeAttribute("src");
    await nextTask();
    expect(map.locations).toEqual([]);
  });

  it("refuses html in the file without sanitize", async () => {
    serve({ "/html.json": [{ id: "a", lat: 1, lng: 2, html: "<b>A</b>" }] });
    const map = await mapFrom('<maplace-map src="/html.json"></maplace-map>');
    const errors = errorsOn(map);
    await loaded();
    expect(errors.map(({ code }) => code)).toEqual(["missing-sanitizer"]);
  });
});
