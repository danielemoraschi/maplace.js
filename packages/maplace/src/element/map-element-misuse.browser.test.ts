import { describe, expect, it } from "vitest";
import {
  adaptersMade,
  connect,
  errorsOn,
  lastAdapter,
  mapFrom,
  nextTask,
  ROME,
  unconnectedMap,
} from "./testing/fake-maps";

const HELD_BLANK_LABEL = `<maplace-map selected-label=" " hold>${ROME}</maplace-map>`;

describe("<maplace-map> misuse, never silent, standing until corrected", () => {
  it("keeps its locations through bad ones, in error until good ones come", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.locations = [{ id: "a", lat: "1" } as never];
    expect(errors.map(({ code }) => code)).toEqual(["invalid-input"]);
    expect([map.loadState, map.matches(":state(error)")]).toEqual(["error", true]);
    expect(map.locations.map(({ id }) => id)).toEqual(["rome"]);
    map.locations = [{ id: "a", lat: 1, lng: 2 }];
    expect(map.loadState).toBe("loading");
  });

  it("reports each bad assignment, the same one again too", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    const bad = [{ id: "a", lat: "1" } as never];
    map.locations = bad;
    map.locations = bad;
    map.route = { stops: ["rome", "nowhere"] };
    map.route = { stops: ["rome", "nowhere"] };
    expect(errors.map(({ code }) => code)).toEqual([
      "invalid-input",
      "invalid-input",
      "unknown-id",
      "unknown-id",
    ]);
  });

  it("reports locations set before it connected that aren't locations", async () => {
    const map = document.createElement("maplace-map");
    const errors = errorsOn(map);
    map.locations = undefined as never;
    map.innerHTML = ROME;
    document.body.replaceChildren(map);
    await nextTask();
    expect(errors.map(({ code }) => code)).toEqual(["invalid-input"]);
    expect(map.locations).toEqual([]);
  });

  it("starts with bad children in error, with a store and no locations", async () => {
    const errors = errorsOn(document);
    const map = await mapFrom(
      '<maplace-map><maplace-location location-id="a" lat="x" lng="1"></maplace-location></maplace-map>',
    );
    expect([map.loadState, map.locations]).toEqual(["error", []]);
    expect(errors).toHaveLength(1);
    map.querySelector("maplace-location")?.setAttribute("lat", "1");
    await nextTask();
    expect(map.loadState).toBe("loading");
  });

  it("starts in error for a child's group that starts with [ but isn't a JSON path", async () => {
    const errors = errorsOn(document);
    const map = await mapFrom(
      '<maplace-map><maplace-location location-id="a" lat="1" lng="1" group="[Draft] Rome"></maplace-location></maplace-map>',
    );
    expect([map.loadState, errors.map(({ field }) => field)]).toEqual(["error", ["group"]]);
    map.querySelector("maplace-location")?.setAttribute("group", '["Europe","Italy"]');
    await nextTask();
    expect(map.loadState).toBe("loading");
    expect(map.locations[0]?.group).toEqual(["Europe", "Italy"]);
  });

  it("starts without the selection an unknown selected-id names, in error until one is made", async () => {
    const map = await mapFrom(`<maplace-map selected-id="milan">${ROME}</maplace-map>`);
    expect(map.maplace.getSnapshot()).toMatchObject({
      selectedId: undefined,
      locations: [{ id: "rome" }],
    });
    expect(map.loadState).toBe("error");
    map.maplace.select("rome");
    expect(map.loadState).toBe("loading");
  });

  it("opens no map for a provider that isn't registered, and opens one once it is named right", async () => {
    const before = adaptersMade.length;
    const map = document.createElement("maplace-map");
    map.setAttribute("provider", "google");
    const errors = errorsOn(map);
    document.body.replaceChildren(map);
    await nextTask();
    expect(errors.map(({ field }) => field)).toEqual(["provider"]);
    expect([adaptersMade.length, map.loadState]).toEqual([before, "error"]);
    map.setAttribute("class", "retried");
    await nextTask();
    expect(errors).toHaveLength(1);
    map.setAttribute("provider", "fake");
    await nextTask();
    expect(adaptersMade).toHaveLength(before + 1);
    expect(map.loadState).toBe("loading");
  });

  it("refuses a cluster attribute changed once the map is created, until put back", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("cluster", "");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/\bcluster\b.* can't change/),
    ]);
    map.removeAttribute("cluster");
    expect(map.loadState).toBe("loading");
    expect(lastAdapter().mounted?.cluster).toBe(false);
  });

  it("reads the labels when the store is created", async () => {
    const map = await mapFrom(
      `<maplace-map skip-map-label="Oltre" selected-label="Scelto">${ROME}</maplace-map>`,
    );
    lastAdapter().finishMount();
    await map.maplace.whenReady();
    expect(map.querySelector(".maplace-skip-map")?.textContent).toBe("Oltre");
    map.maplace.select("rome");
    expect(map.querySelector("[aria-live]")?.textContent).toMatch(/^Scelto: /);
  });

  it("a blank label stands as misuse, keeping the other label and a valid sanitize", async () => {
    const map = unconnectedMap(
      `<maplace-map selected-label=" " skip-map-label="Oltre" hold>${ROME}</maplace-map>`,
    );
    const sanitize = (html: string) => html;
    map.sanitize = sanitize;
    const errors = errorsOn(map);
    await connect(map);
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/selected-label must not be blank/),
    ]);
    expect(map.sanitize).toBe(sanitize);
    expect(map.loadState).toBe("error");
    map.removeAttribute("selected-label");
    expect(map.loadState).toBe("idle");
  });

  it("reports a held map's blank label once, through release and a reconnect", async () => {
    const map = unconnectedMap(HELD_BLANK_LABEL);
    const errors = errorsOn(map);
    await connect(map);
    map.release();
    map.remove();
    await nextTask();
    await connect(map);
    expect(errors.map(({ field }) => field)).toEqual(["selected-label"]);
  });

  it("reports a store attribute changed after its maplace was read, before it connected", () => {
    const map = document.createElement("maplace-map");
    const errors = errorsOn(map);
    expect(map.maplace).toBeDefined();
    map.setAttribute("cluster", "");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/can't change once the map is created/),
    ]);
  });

  it("keeps a store attribute changed after its maplace was read standing as misuse once it connects held", async () => {
    const map = unconnectedMap(`<maplace-map hold>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    expect(map.maplace).toBeDefined();
    map.setAttribute("cluster", "");
    await connect(map);
    expect([map.loadState, errors.map(({ field }) => field)]).toEqual(["error", [undefined]]);
  });

  it("says a held map's unknown selected-id on release, as its store is made then", async () => {
    const map = await mapFrom(`<maplace-map hold selected-id="milan">${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    expect(map.loadState).toBe("idle");
    map.release();
    expect([map.loadState, errors.map(({ code }) => code)]).toEqual(["error", ["unknown-id"]]);
  });

  it("doesn't say a held map's standing blank label again when another store attribute changes", async () => {
    const map = unconnectedMap(HELD_BLANK_LABEL);
    const errors = errorsOn(map);
    await connect(map);
    map.setAttribute("cluster", "");
    expect(errors.map(({ field }) => field)).toEqual(["selected-label"]);
  });

  it("gives a listener hearing of a blank label the one store", async () => {
    const map = unconnectedMap(HELD_BLANK_LABEL);
    const stores: unknown[] = [];
    map.addEventListener("maplace-error", () => stores.push(map.maplace));
    await connect(map);
    expect(stores).toEqual([map.maplace]);
  });

  it("refuses a label changed once the map is created, until put back", async () => {
    const map = await mapFrom(`<maplace-map selected-label="Scelto">${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("selected-label", "Altro");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/can't change once the map is created/),
    ]);
    expect(map.loadState).toBe("error");
    map.setAttribute("selected-label", "Scelto");
    expect(map.loadState).toBe("loading");
  });

  it("counts a map icon template added later as no store-attribute change", async () => {
    const map = await mapFrom(`<maplace-map selected-label="Scelto">${ROME}</maplace-map>`);
    const icon = document.createElement("template");
    icon.setAttribute("data-icon", "");
    icon.innerHTML = "<b>pin</b>";
    map.prepend(icon);
    map.setAttribute("selected-label", "Altro");
    map.setAttribute("selected-label", "Scelto");
    expect(map.loadState).toBe("loading");
  });

  it("a blank link label stands as misuse, naming it", async () => {
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("directions-label", " ");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/directions-label must not be blank/),
    ]);
    expect(map.loadState).toBe("error");
    map.removeAttribute("directions-label");
    expect(map.loadState).toBe("idle");
  });

  it("refuses a link label changed once the map is created, until put back", async () => {
    const map = await mapFrom(`<maplace-map open-in-maps-label="Apri">${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("open-in-maps-label", "Altro");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/open-in-maps-label.* can't change once the map is created/),
    ]);
    expect(map.loadState).toBe("error");
    map.setAttribute("open-in-maps-label", "Apri");
    expect(map.loadState).toBe("loading");
  });

  it("refuses a route the store refuses, keeping the one before", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.route = { stops: ["rome", "nowhere"] };
    expect(errors).toHaveLength(1);
    expect([map.route, map.loadState]).toEqual([undefined, "error"]);
    map.route = undefined;
    expect(map.loadState).toBe("loading");
  });
});
