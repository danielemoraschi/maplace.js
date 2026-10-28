import { expect, vi } from "vitest";
import { chooseOption, chosenOption, type ExampleBehaviour, optionsOf } from "./reading";

const MOVED = { center: { lat: 40, lng: -8.5 }, zoom: 9 };

/**
 * Choosing Dark opens the map again, as a map's style or scheme is set when it opens: on a new
 * adapter, with the same locations and selection, where the map was. The fake draws no colours:
 * the real-Maps test checks the new map is dark.
 */
const reopensOnDark: ExampleBehaviour = async (run) => {
  const { store, adapter, root } = run;
  store.select("porto");
  // Moved by hand, as a user would: the camera a map opened again keeps.
  store.setView(MOVED.center, MOVED.zoom);
  await adapter.probe().settle();
  const before = store.getSnapshot();
  chooseOption(root, "Map style", "Dark");
  const reopened = await vi.waitFor(() => {
    const live = run.liveAdapter();
    if (live === adapter) throw new Error("the map wasn't opened again");
    return live;
  });
  await reopened.finishMount();
  await reopened.probe().settle();
  // React's select is controlled: its state, not the DOM, must still say Dark.
  await expect.poll(() => chosenOption(root, "Map style")).toBe("Dark");
  expect(store.getSnapshot()).toMatchObject({
    locations: before.locations,
    selectedId: "porto",
  });
  expect(reopened.callsOf("setView").at(-1)?.view).toEqual({ kind: "center", ...MOVED });
  expect(adapter.destroyed).toBe(true);
};

/** Basemaps offering `options`, the same in every version on a provider, then reopening on Dark. */
const offering =
  (options: readonly string[]): ExampleBehaviour =>
  async (run) => {
    expect(optionsOf(run.root, "Map style")).toEqual(options);
    await reopensOnDark(run);
  };

/** On Google, a colour scheme for each of Google's: light, dark and the reader's system's. */
export const styledOnGoogle = offering(["Light", "Dark", "Follow the system"]);

/** On MapLibre, four of OpenFreeMap's styles. */
export const styledOnMapLibre = offering(["Liberty", "Bright", "Positron", "Dark"]);
