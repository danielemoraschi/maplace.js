import { describe, expect, it, vi } from "vitest";
import { pinLiftOf } from "../adapter-kit/pin-image";
import { pinLooksOf } from "../adapter-kit/pin-looks";
import type { LatLng } from "../geometry";
import { createMaplace } from "../maplace/create";
import { queried } from "../testing/queried";
import { onMapLibre } from "./testing/control-site";
import { pagePointOf } from "./testing/user-drags";

const AT: LatLng = { lat: 0, lng: 0 };

/** A marker with a popup at `AT`, selected, and how far above its point the popup's tip ends. */
async function selectedPopupLift(editable: boolean): Promise<number> {
  const maplace = createMaplace({
    locations: [{ id: "a", ...AT, title: "A", content: "Its value", editable }],
    view: { kind: "center", center: AT, zoom: 5 },
  });
  const { map } = await onMapLibre(maplace);
  maplace.select("a");
  const tip = await vi.waitFor(() => queried(map.getContainer(), ".maplibregl-popup-tip"));
  await vi.waitFor(() => expect(tip.getBoundingClientRect().height).toBeGreaterThan(0));
  return pagePointOf(map, AT).y - tip.getBoundingClientRect().bottom;
}

describe("a MapLibre pin's popup", () => {
  it.each([
    ["in the pin layer", false],
    ["dragged in the DOM", true],
  ])("opens with its tip on the selected dot's halo, %s", async (_, editable) => {
    const lift = await selectedPopupLift(editable);
    expect(lift).toBeCloseTo(pinLiftOf(pinLooksOf(document.body)), 0);
  });
});
