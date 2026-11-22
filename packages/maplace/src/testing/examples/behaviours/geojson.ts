import { expect } from "vitest";
import { controlPositions, type ExampleBehaviour, headingsIn } from "./reading";

/**
 * The GeoJSON file's six features as locations, each by its geometry (the park an area, its
 * avenue a line, four places markers), listed under their groups beside the map; a click on one
 * opens its `about` property in the popup.
 */
export const geojson: ExampleBehaviour = async ({ store, adapter, root }) => {
  await expect.poll(() => store.getSnapshot().locations.length).toBe(6);
  const probe = adapter.probe();
  expect(probe.location("regents-park")?.geometry.type).toBe("polygon");
  expect(probe.location("broad-walk")?.geometry.type).toBe("polyline");
  expect(probe.location("london-zoo")?.geometry.type).toBe("marker");
  expect(controlPositions(adapter)).toEqual([]);
  await expect.poll(() => headingsIn(root)).toEqual(["Area", "Path", "Places"]);

  probe.click("london-zoo");
  await probe.settle();
  await expect.poll(() => probe.shownPopup()?.heading).toBe("London Zoo");
  expect(probe.shownPopup()?.element.textContent).toBe(
    "The world's oldest scientific zoo, opened in 1828.",
  );
};
