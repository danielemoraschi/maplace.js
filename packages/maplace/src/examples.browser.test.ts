import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { byId } from "../examples/page";
import type * as Core from "./index";
import { EXAMPLE_SCRIPTS } from "./testing/examples/example-files";
import { recordErrors } from "./testing/examples/example-page";
import { containersFor, serveExampleData } from "./testing/examples/example-surroundings";
import {
  lastStore,
  recordingCreateMaplace,
  shownIds,
  sortedIds,
} from "./testing/examples/recorded-stores";
import { createFakeAdapter, type FakeAdapter } from "./testing/fake-adapter";

// The vanilla examples, run as written, on the fake adapter instead of Google's.
const adapters: FakeAdapter[] = [];
vi.mock("maplace/google", () => ({
  createGoogleAdapter: () => {
    const adapter = createFakeAdapter();
    adapters.push(adapter);
    return adapter;
  },
}));
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

/** What a page around one example sees it do, beyond drawing its locations. */
const BEHAVIOURS: Readonly<Record<string, () => Promise<void>>> = {
  circles: async () => {
    lastStore().select("near");
    expect(adapters.at(-1)?.probe().location("near")?.style).toMatchObject({
      stroke: "#c2410c",
      fill: "#f97316",
    });
  },
  tabs: async () => {
    lastStore().select("milan");
    expect(byId("details").textContent).toBe("Finance and fashion.");
  },
  menu: async () => {
    Object.assign(byId("north-only"), { checked: true }).dispatchEvent(new Event("change"));
    expect(lastStore().getSnapshot().filter).toEqual(["North"]);
  },
  route: async () => {
    await expect.poll(() => byId("distance").textContent).toMatch(/^\d+ km$/);
  },
};

beforeEach(() => serveExampleData());
afterEach(() => vi.unstubAllGlobals());

describe.each(EXAMPLE_SCRIPTS)("the $name script", ({ name, source, run }) => {
  it("draws its locations on the map it was given, with its list, and does what it says", async () => {
    containersFor(source);
    const errors = recordErrors();
    const made = adapters.length;
    await run();
    const adapter = adapters[made] as FakeAdapter;
    await adapter.finishMount();
    await adapter.probe().settle();

    expect(adapter.mounted?.container).toBe(byId("map"));
    // Large diffs are drawn in chunks, a task each.
    await expect
      .poll(() => sortedIds(adapter.probe().locationIds()))
      .toEqual(shownIds(lastStore()));
    expect(shownIds(lastStore()).length).toBeGreaterThan(0);
    if (source.includes("createListView")) {
      expect(document.querySelector("[role=listbox], select")).not.toBeNull();
    }
    await BEHAVIOURS[name]?.();
    expect(errors).toEqual([]);
  });
});
