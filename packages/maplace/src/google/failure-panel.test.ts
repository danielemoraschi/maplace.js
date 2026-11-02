// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Adapter } from "../adapter";
import { MAP_FAILURE_CLASS } from "../map-failure-words";
import { createMaplace } from "../maplace/create";
import { startMount, unmountAll } from "../testing/conformance/harness";
import { sizedContainer } from "../testing/container";
import type { MapProbe } from "../testing/map-probe";
import { createMapState } from "./map-state";
import { mountAfter } from "./mount-after";
import { attachedToGoogle } from "./testing/store-on-google";
import { StubMap, stubMapsJs } from "./testing/stub-libraries";
import { TEST_OPTIONS } from "./testing/subject";

type Hooked = { gm_authFailure?: () => void };

afterEach(() => {
  unmountAll();
  vi.unstubAllGlobals();
  delete (globalThis as Hooked).gm_authFailure;
  document.body.replaceChildren();
});

/**
 * A new adapter on a page Google hasn't refused yet: the page's hook is one per module and a
 * refusal stands, so each comes from the module afresh.
 */
async function adapterOnFreshPage(
  options: Parameters<typeof import("./assemble").assembleGoogleAdapter>[0] = TEST_OPTIONS,
) {
  vi.resetModules();
  const { assembleGoogleAdapter } = await import("./assemble");
  return assembleGoogleAdapter(options, createMapState());
}

/** `adapter` mounting in a container on the page, as the store would. */
const mountOf = (adapter: Adapter) =>
  startMount({ name: "google", create: () => ({ adapter, probe: {} as MapProbe }) });

/** Maps JS on the page whose libraries fail. */
const stubFailingLibraries = () =>
  vi.stubGlobal("google", {
    maps: { importLibrary: () => Promise.reject(new Error("no network")) },
  });

const panelsIn = (container: Element) => container.querySelectorAll(`.${MAP_FAILURE_CLASS}`);

/** Google refusing the page's key. */
const refuseKey = () => (globalThis as Hooked).gm_authFailure?.();

describe("the failure panel on a Google map maplace creates", () => {
  it("shows when the libraries fail", async () => {
    stubFailingLibraries();
    const { container, mounting } = mountOf(await adapterOnFreshPage());
    await expect(mounting).rejects.toThrow("no network");
    expect(panelsIn(container)).toHaveLength(1);
  });

  it("shows when the key was refused before the map opens, as no message of Google's is there", async () => {
    stubMapsJs();
    const adapter = await adapterOnFreshPage();
    refuseKey();
    const { container, mounting } = mountOf(adapter);
    await expect(mounting).rejects.toMatchObject({ code: "provider-auth-failed" });
    expect(panelsIn(container)).toHaveLength(1);
  });

  it("shows none when the key is refused with the map open, as Google's message stays on it", async () => {
    stubMapsJs();
    const { container, host, mounting } = mountOf(await adapterOnFreshPage());
    await mounting;
    refuseKey();
    expect(host.reportsOf("reportError")[0]?.[0]).toMatchObject({ code: "provider-auth-failed" });
    expect(panelsIn(container)).toHaveLength(0);
  });

  it("shows none for a failed draw: the map still works", async () => {
    stubMapsJs().marker.AdvancedMarkerElement = class {
      constructor() {
        throw new Error("no marker");
      }
    } as unknown as typeof google.maps.marker.AdvancedMarkerElement;
    const locations = [{ id: "a", lat: 44.5, lng: 11.3 }];
    const { container, errors, outcome } = attachedToGoogle(createMaplace({ locations }));
    await outcome;
    await vi.waitFor(() => expect(errors).toHaveLength(1));
    expect(panelsIn(container)).toHaveLength(0);
  });

  it("shows when what a mount waits for first fails: Maps JS the adapter adds, blocked", async () => {
    const adapter = mountAfter(await adapterOnFreshPage(), () =>
      Promise.reject(new Error("blocked")),
    );
    const { container, mounting, destroy } = mountOf(adapter);
    await expect(mounting).rejects.toThrow("blocked");
    expect(panelsIn(container)).toHaveLength(1);
    destroy();
    expect(panelsIn(container)).toHaveLength(0);
  });

  it("destroy takes it off", async () => {
    stubFailingLibraries();
    const adapter = await adapterOnFreshPage();
    const { container, mounting } = mountOf(adapter);
    await expect(mounting).rejects.toThrow("no network");
    adapter.destroy();
    expect(panelsIn(container)).toHaveLength(0);
  });
});

describe("the failure panel on a page's own Google map", () => {
  it("shows none when what a mount waits for first fails", async () => {
    const options = { ...TEST_OPTIONS, map: new StubMap(sizedContainer()) as never };
    const adapter = mountAfter(await adapterOnFreshPage(options), () =>
      Promise.reject(new Error("blocked")),
    );
    const { container, mounting } = mountOf(adapter);
    await expect(mounting).rejects.toThrow("blocked");
    expect(panelsIn(container)).toHaveLength(0);
  });

  it("shows none, whatever fails", async () => {
    stubMapsJs();
    const own = sizedContainer();
    const map = new StubMap(own) as unknown as google.maps.Map;
    const options = { ...TEST_OPTIONS, map };
    const adapter = await adapterOnFreshPage(options);
    refuseKey();
    const { container, mounting } = mountOf(adapter);
    await expect(mounting).rejects.toMatchObject({ code: "provider-auth-failed" });
    expect(panelsIn(container)).toHaveLength(0);
  });
});
