import { describe, expect, it, vi } from "vitest";
import { createMaplace } from "../maplace/create";
import { queried } from "../testing/queried";
import { onMapLibre } from "./testing/control-site";
import { moveOverCanvas } from "./testing/pointer";
import { middleOf } from "./testing/user-drags";

const CENTRE = { lat: 0, lng: 0 };

/** An area round the map's centre, hovered there, its popup open on hover. */
async function hoverPopupOverArea() {
  const maplace = createMaplace({
    locations: [
      {
        id: "area",
        type: "polygon",
        title: "Area",
        content: "Its value",
        path: [
          { lat: -20, lng: -20 },
          { lat: -20, lng: 20 },
          { lat: 20, lng: 20 },
          { lat: 20, lng: -20 },
        ],
      },
    ],
    popup: { openOn: "hover" },
    view: { kind: "center", center: CENTRE, zoom: 3 },
  });
  const { map } = await onMapLibre(maplace);
  await vi.waitFor(() => {
    moveOverCanvas(map, { at: CENTRE });
    expect(maplace.getSnapshot().hoveredId).toBe("area");
  });
  const popup = await vi.waitFor(() => queried(map.getContainer(), ".maplibregl-popup"));
  return { maplace, map, content: queried(popup, ".maplibregl-popup-content") };
}

/** What the pointer reaches at the middle of `element`, as the browser hit-tests it. */
function pointerTargetAtMiddleOf(element: Element): Element | null {
  const { x, y } = middleOf(element);
  return document.elementFromPoint(x, y);
}

describe("a hover popup on MapLibre", () => {
  it("lets the pointer through to the map while it shows the hovered location alone", async () => {
    const { map, content } = await hoverPopupOverArea();
    await vi.waitFor(() => expect(pointerTargetAtMiddleOf(content)).toBe(map.getCanvas()));
  });

  it("takes the pointer once its location is selected, for its close button and links", async () => {
    const { maplace, content } = await hoverPopupOverArea();
    maplace.select("area");
    await vi.waitFor(() => expect(content.contains(pointerTargetAtMiddleOf(content))).toBe(true));
  });
});
