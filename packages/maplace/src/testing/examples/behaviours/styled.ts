import { expect, vi } from "vitest";
import { clickButton, type ExampleBehaviour } from "./reading";

const MOVED = { center: { lat: 40, lng: -8.5 }, zoom: 9 };

/**
 * "Dark" opens the map again, as a map's colour scheme is set when it opens: on a new adapter,
 * with the same locations and selection, where the map was. The fake draws no colours: the
 * real-Maps test checks the new map is dark.
 */
export const styled: ExampleBehaviour = async (run) => {
  const { store, adapter, root } = run;
  store.select("porto");
  // Moved by hand, as a user would: the camera a map opened again keeps.
  store.setView(MOVED.center, MOVED.zoom);
  await adapter.probe().settle();
  const before = store.getSnapshot();
  clickButton(root, "Dark");
  const reopened = await vi.waitFor(() => {
    const live = run.liveAdapter();
    if (live === adapter) throw new Error("the map wasn't opened again");
    return live;
  });
  await reopened.finishMount();
  await reopened.probe().settle();
  expect(root.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
  expect(store.getSnapshot()).toMatchObject({
    locations: before.locations,
    selectedId: "porto",
  });
  expect(reopened.callsOf("setView").at(-1)?.view).toEqual({ kind: "center", ...MOVED });
  expect(adapter.destroyed).toBe(true);
};
