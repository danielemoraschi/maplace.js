// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { MaplaceError } from "../errors";
import type { Location } from "../location";
import { createFakeAdapter } from "../testing/fake-adapter";
import { mounted } from "../testing/mounted";
import { createMaplace } from "./create";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0 },
  { id: "b", lat: 1, lng: 1 },
];
const circle: Location = { id: "c", type: "circle", center: { lat: 0, lng: 0 }, radius: 5 };
const container = () => document.createElement("div");

function attached() {
  const maplace = createMaplace({ locations });
  const adapter = createFakeAdapter();
  const detach = maplace.attach(adapter, container());
  return { maplace, adapter, detach };
}

describe("attach", () => {
  it("changes nothing when it refuses, and refuses after destroy", () => {
    const maplace = createMaplace({ locations: [circle] });
    expect(() => maplace.attach(createFakeAdapter({ capabilities: [] }), container())).toThrow(
      expect.objectContaining({ code: "unsupported-capability" }),
    );
    expect(maplace.getSnapshot().loadState).toBe("idle");
    maplace.destroy();
    expect(() => maplace.attach(createFakeAdapter(), container())).toThrow(
      expect.objectContaining({ code: "destroyed" }),
    );
  });

  it("mounts with the container, popup defaults and clustering", () => {
    const element = container();
    const maplace = createMaplace({ cluster: true, popup: { maxWidth: 300 } });
    const adapter = createFakeAdapter();
    maplace.attach(adapter, element);
    expect(adapter.mounted).toMatchObject({
      container: element,
      cluster: true,
      popup: { maxWidth: 300, offset: [0, 0], openOn: "click" },
    });
    const offset: [number, number] = [4, 8];
    const offsetAdapter = createFakeAdapter();
    createMaplace({ popup: { offset } }).attach(offsetAdapter, container());
    offset[1] = 20;
    expect(offsetAdapter.mounted?.popup.offset).toEqual([4, 8]);
    expect(Object.isFrozen(offsetAdapter.mounted?.popup.offset)).toBe(true);
  });

  it("moves idle → loading → ready once mounted and the first locations are drawn", async () => {
    const maplace = createMaplace({ locations });
    const adapter = createFakeAdapter({ holdApplies: true });
    const states: string[] = [];
    maplace.subscribe(() => states.push(maplace.getSnapshot().loadState));
    const ready = maplace.whenReady();
    maplace.attach(adapter, container());
    await adapter.finishMount();
    expect(adapter.callsOf("apply")).toHaveLength(1);
    expect(maplace.getSnapshot().loadState).toBe("loading");
    await adapter.finishApplies();
    await expect(ready).resolves.toBeUndefined();
    expect(states).toEqual(["loading", "ready"]);
  });

  it("fails the load when mounting fails: error state, error event, whenReady rejects", async () => {
    const { maplace, adapter } = attached();
    const onError = vi.fn();
    maplace.on("error", onError);
    const outcome = maplace.whenReady().catch((reason: unknown) => reason);
    await adapter.failMount(new Error("script blocked"));
    const error = onError.mock.calls[0]?.[0].error;
    expect(error).toMatchObject({
      code: "provider-load-failed",
      cause: new Error("script blocked"),
    });
    expect(maplace.getSnapshot().loadState).toBe("error");
    expect(await outcome).toBe(error);
  });

  it("keeps an adapter's own load error from a failed mount", async () => {
    const { maplace, adapter } = attached();
    const outcome = maplace.whenReady().catch((reason: unknown) => reason);
    const denied = new MaplaceError("provider-auth-failed", "bad key");
    await adapter.failMount(denied);
    expect(await outcome).toBe(denied);
  });

  it("checks each later call against the adapter before changing anything", async () => {
    const maplace = createMaplace({ locations });
    maplace.attach(createFakeAdapter({ capabilities: [], routeStopLimit: 2 }), container());
    const before = maplace.getSnapshot();
    expect(() => maplace.setLocations([...locations, circle])).toThrow(
      expect.objectContaining({ code: "unsupported-capability" }),
    );
    expect(() => maplace.setRoute({ stops: ["a", "b"] })).toThrow(
      "setRoute: route needs the route capability, which this map's adapter lacks",
    );
    expect(maplace.getSnapshot()).toBe(before);
  });

  it("checks nothing against an adapter before attach", () => {
    expect(() => createMaplace().setLocations([circle])).not.toThrow();
  });
});

describe("detach", () => {
  it("destroys the adapter and returns the store to idle; only once", async () => {
    const { maplace, adapter, detach } = await mounted();
    detach();
    expect(adapter.destroyed).toBe(true);
    expect(maplace.getSnapshot()).toMatchObject({ loadState: "idle", viewport: undefined });
    const second = createFakeAdapter();
    maplace.attach(second, container());
    detach();
    expect(second.destroyed).toBe(false);
    expect(maplace.getSnapshot().loadState).toBe("loading");
  });

  it("ignores what the detached adapter does later", async () => {
    const { maplace, adapter, detach } = attached();
    detach();
    await adapter.finishMount();
    adapter.host().reportError(new MaplaceError("provider-auth-failed", "late"));
    expect(adapter.calls).toEqual([]);
    expect(maplace.getSnapshot().loadState).toBe("idle");
  });

  it("keeps whenReady waiting for the next attach", async () => {
    const { maplace, detach } = attached();
    const ready = maplace.whenReady();
    detach();
    const next = createFakeAdapter();
    maplace.attach(next, container());
    await next.finishMount();
    await expect(ready).resolves.toBeUndefined();
  });

  it("re-applies the last requested view on a new attach", async () => {
    const { maplace, detach } = await mounted();
    maplace.setView({ lat: 5, lng: 6 }, 7);
    detach();
    const next = createFakeAdapter();
    maplace.attach(next, container());
    await next.finishMount();
    expect(next.callsOf("setView")[0]?.view).toMatchObject({ kind: "center", zoom: 7 });
  });
});
