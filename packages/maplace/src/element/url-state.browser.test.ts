import { describe, expect, it, onTestFinished } from "vitest";
import { twoFrames } from "../testing/webgl-canvas";
import { historyWrites } from "./testing/address";
import { adaptersMade, MILAN, mapFrom, nextTask, ROME, styledPage } from "./testing/fake-maps";

/**
 * The frame's address with `parameters` added, until the test finishes: the runner may carry
 * parameters of its own there.
 */
function atAddress(parameters: Record<string, string>): void {
  const before = location.href;
  history.replaceState(history.state, "", withParameters(parameters));
  onTestFinished(() => history.replaceState(history.state, "", before));
}

function withParameters(parameters: Record<string, string>): URL {
  const address = new URL(location.href);
  for (const [name, value] of Object.entries(parameters)) address.searchParams.set(name, value);
  return address;
}

/** Back or forward to the frame's address with `parameters` added, as the browser does it. */
function popTo(parameters: Record<string, string>): void {
  history.replaceState(history.state, "", withParameters(parameters));
  dispatchEvent(new PopStateEvent("popstate"));
}

const parameter = (name = "location") => new URLSearchParams(location.search).get(name);

function popped(): Promise<void> {
  return new Promise((resolve) => addEventListener("popstate", () => resolve(), { once: true }));
}

describe("<maplace-map url-state>", () => {
  it("selects the location the address names on load, over selected-id, writing nothing", async () => {
    atAddress({ location: "milan" });
    const { pushes, replaces } = historyWrites();
    const map = await mapFrom(
      `<maplace-map url-state selected-id="rome">${ROME}${MILAN}</maplace-map>`,
    );
    expect(map.maplace.getSnapshot().selectedId).toBe("milan");
    expect([pushes.mock.calls, replaces.mock.calls]).toEqual([[], []]);
  });

  it("steps back through selections with the real back button", async () => {
    atAddress({ location: "rome" });
    const map = await mapFrom(`<maplace-map url-state>${ROME}${MILAN}</maplace-map>`);
    map.maplace.select("milan");
    map.maplace.select(undefined);
    expect(parameter()).toBeNull();
    history.back();
    await popped();
    expect([map.maplace.getSnapshot().selectedId, parameter()]).toEqual(["milan", "milan"]);
    history.back();
    await popped();
    expect(map.maplace.getSnapshot().selectedId).toBe("rome");
  });

  it("stops when removed: a selection while disconnected writes nothing, and back selects nothing", async () => {
    atAddress({ location: "rome" });
    const map = await mapFrom(`<maplace-map url-state>${ROME}${MILAN}</maplace-map>`);
    map.remove();
    await nextTask();
    const { pushes } = historyWrites();
    map.maplace.select("milan");
    popTo({ location: "rome" });
    expect([map.maplace.getSnapshot().selectedId, pushes.mock.calls]).toEqual(["milan", []]);
  });

  it("keeps syncing through a move within one task, without reading the address again", async () => {
    atAddress({ location: "rome" });
    const map = await mapFrom(
      `<maplace-map url-state>${ROME}${MILAN}</maplace-map><section></section>`,
    );
    history.replaceState(history.state, "", withParameters({ location: "milan" }));
    document.querySelector("section")?.append(map);
    await nextTask();
    expect(map.maplace.getSnapshot().selectedId).toBe("rome");
    const { pushes } = historyWrites();
    map.maplace.select(undefined);
    expect([pushes.mock.calls.length, parameter()]).toEqual([1, null]);
  });

  it("selects the address's location while held, before release", async () => {
    atAddress({ location: "milan" });
    const opened = adaptersMade.length;
    const map = await mapFrom(`<maplace-map url-state hold>${ROME}${MILAN}</maplace-map>`);
    expect(map.maplace.getSnapshot().selectedId).toBe("milan");
    expect(adaptersMade.length).toBe(opened);
  });

  it("selects the address's location while a lazy map waits, and its list shows it", async () => {
    atAddress({ location: "milan" });
    styledPage();
    onTestFinished(() => scrollTo(0, 0));
    const opened = adaptersMade.length;
    const map = await mapFrom(
      `<div style="height: 200vh"></div><maplace-map loading="lazy" url-state list>${ROME}${MILAN}</maplace-map>`,
    );
    await twoFrames();
    const selected = map.querySelector('[role="option"][aria-selected="true"]');
    expect([adaptersMade.length, map.maplace.getSnapshot().selectedId]).toEqual([opened, "milan"]);
    expect(selected?.textContent).toContain("Milan");
  });
});
