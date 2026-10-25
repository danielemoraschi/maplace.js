// @vitest-environment happy-dom
import type { Maplace } from "maplace";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { API_LISTS } from "../../../../packages/maplace/src/__typetests__/api-lists.ts";
import { createMaplace, MaplaceError } from "../../../../packages/maplace/src/index.ts";
import type { FakeAdapter } from "../../../../packages/maplace/src/testing/fake/types.ts";
import { createFakeAdapter } from "../../../../packages/maplace/src/testing/fake-adapter.ts";
import { notingAdapterFailures, notingMapFailures } from "./version-map-failures.ts";

const NOT_LOADED_NOTE =
  "The map couldn't load: OpenFreeMap's map didn't load. A blocker, or the network?";

beforeEach(() => {
  document.body.innerHTML = `<div class="map-frame">
    <div data-live-version="vanilla" data-provider="maplibre"><div id="version-map"></div></div>
    <p data-map-failure></p>
  </div>`;
});

const version = () => document.querySelector<HTMLElement>("[data-live-version]") as HTMLElement;
const container = () => document.querySelector<HTMLElement>("#version-map") as HTMLElement;
const note = () => document.querySelector("[data-map-failure]")?.textContent;
/** Lets the notes queued after the store's turn be written. */
const flushed = () => new Promise((resolve) => setTimeout(resolve));
const loadFailure = () => new MaplaceError("provider-load-failed", "the style didn't load");

/** A `createMap` that attaches `fake` to a new store in `container`, as the providers' do. */
function createMapOn(fake: FakeAdapter) {
  return (where: HTMLElement | string): Maplace => {
    const maplace = createMaplace();
    maplace.attach(fake, where);
    return maplace;
  };
}

/** A store with `fake`, made by `notingAdapterFailures(() => fake)`, attached to the version. */
function attachNoted(fake: FakeAdapter) {
  const maplace = createMaplace();
  const detach = maplace.attach(notingAdapterFailures(() => fake)(), container());
  return { maplace, detach };
}

describe("notingMapFailures", () => {
  it("notes the version of a map made in one call that failed to load, found from its selector", async () => {
    const fake = createFakeAdapter();
    const maplace = notingMapFailures(createMapOn(fake))("#version-map");
    await fake.failMount(loadFailure());
    await flushed();
    expect(maplace.getSnapshot().loadState).toBe("error");
    expect(version().dataset.failed).toBe("provider-load-failed");
    expect(note()).toBe(NOT_LOADED_NOTE);
  });

  it("leaves the note alone for an error that doesn't fail the load", async () => {
    const fake = createFakeAdapter();
    notingMapFailures(createMapOn(fake))(container());
    await fake.finishMount();
    fake.host().reportError(new MaplaceError("route-failed", "no route"));
    expect(version().dataset.failed).toBeUndefined();
    expect(note()).toBe("");
  });
});

describe("notingAdapterFailures", () => {
  it("notes an adapter's rejected mount, the store failing the load as before", async () => {
    const fake = createFakeAdapter();
    const { maplace } = attachNoted(fake);
    await fake.failMount(loadFailure());
    await flushed();
    expect(maplace.getSnapshot().loadState).toBe("error");
    expect(version().dataset.failed).toBe("provider-load-failed");
    expect(note()).toBe(NOT_LOADED_NOTE);
  });

  it("notes a load or auth failure the adapter reports later, the store hearing it first", async () => {
    const fake = createFakeAdapter();
    const { maplace } = attachNoted(fake);
    await fake.finishMount();
    const heard = vi.fn(() => expect(version().dataset.failed).toBeUndefined());
    maplace.on("error", heard);
    fake.host().reportError(new MaplaceError("provider-auth-failed", "refused"));
    await flushed();
    expect(heard).toHaveBeenCalledOnce();
    expect(version().dataset.failed).toBe("provider-auth-failed");
    expect(note()).toBe("The map couldn't load: OpenFreeMap refused the map's style.");
  });

  it("notes a report that isn't a MaplaceError, which the store fails the load with", async () => {
    const fake = createFakeAdapter();
    const { maplace } = attachNoted(fake);
    await fake.finishMount();
    fake.host().reportError(new Error("an adapter's bug") as MaplaceError);
    await flushed();
    expect(maplace.getSnapshot().loadState).toBe("error");
    expect(version().dataset.failed).toBe("provider-load-failed");
  });

  it("never throws back into the adapter, its container outside any version", async () => {
    const fake = createFakeAdapter();
    const outside = document.createElement("div");
    document.body.append(outside);
    createMaplace().attach(notingAdapterFailures(() => fake)(), outside);
    await fake.finishMount();
    const queued: VoidFunction[] = [];
    const queue = vi.spyOn(globalThis, "queueMicrotask").mockImplementation((task) => {
      queued.push(task);
    });
    const report = () => fake.host().reportError(new MaplaceError("provider-load-failed", "lost"));
    expect(report).not.toThrow();
    queue.mockRestore();
    expect(queued.at(-1)).toThrow(/isn't in a version/);
  });

  it("notes nothing once the adapter is detached, as React's first StrictMode mount is", async () => {
    const fake = createFakeAdapter();
    const { detach } = attachNoted(fake);
    detach();
    await fake.failMount(loadFailure());
    await flushed();
    expect(version().dataset.failed).toBeUndefined();
    expect(note()).toBe("");
  });

  it("notes a mount that fails with anything but a MaplaceError as the provider's map not loading", async () => {
    const fake = createFakeAdapter();
    attachNoted(fake);
    await fake.failMount(new Error("an adapter's bug"));
    await flushed();
    expect(version().dataset.failed).toBe("provider-load-failed");
    expect(note()).toBe(NOT_LOADED_NOTE);
  });

  // W35: the site keeps its own copy of the store's rule (`LOAD_FAILURES`), held to the store
  // here, for every code the RFC lists.
  it.each([...API_LISTS.runtimeCodes, ...API_LISTS.misuseCodes])(
    "notes a reported %s only when the store fails the load with it",
    async (code) => {
      const fake = createFakeAdapter();
      const { maplace } = attachNoted(fake);
      await fake.finishMount();
      fake.host().reportError(new MaplaceError(code, "reported"));
      await flushed();
      const failedLoad = maplace.getSnapshot().loadState === "error";
      expect(version().dataset.failed !== undefined, "noted").toBe(failedLoad);
    },
  );
});
