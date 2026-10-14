// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { ResolvedView } from "../viewport";
import { frames } from "./frames";
import { createStandingView } from "./standing-view";
import { StubMap } from "./testing/stub-libraries";

const FIT: ResolvedView = {
  kind: "fit-bounds",
  bounds: { south: 10, west: 20, north: 20, east: 35 },
  padding: 40,
};

function standingOn() {
  const map = new StubMap(document.createElement("div"));
  const view = createStandingView(map as unknown as google.maps.Map);
  return { map, view };
}

describe("the standing view", () => {
  it("is the view shown last, through the move that shows it", () => {
    const { map, view } = standingOn();
    expect(view.standing()).toBeUndefined();
    view.shown(FIT);
    map.trigger("center_changed");
    map.trigger("zoom_changed");
    map.trigger("idle");
    expect(view.standing()).toBe(FIT);
  });

  it("stands down when the map moves after that move, as the user moves it", () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    map.trigger("center_changed");
    map.trigger("idle");
    map.trigger("zoom_changed");
    expect(view.standing()).toBeUndefined();
    view.shown(FIT);
    expect(view.standing()).toBe(FIT);
  });

  it("keeps standing when only the bounds change, as when the map is resized", () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    map.trigger("idle");
    map.trigger("bounds_changed");
    map.trigger("idle");
    expect(view.standing()).toBe(FIT);
  });

  it("stands down when the user drags during the move", () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    map.trigger("center_changed");
    map.trigger("dragstart");
    expect(view.standing()).toBeUndefined();
  });

  it("ends a move to where the camera is, which no idle follows, after two frames", async () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    await frames(3);
    map.trigger("center_changed");
    expect(view.standing()).toBeUndefined();
  });

  it("stands down for a zoom the user makes while maplace's move is still settling", () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    map.trigger("center_changed");
    map.getDiv().dispatchEvent(new WheelEvent("wheel"));
    map.trigger("zoom_changed");
    expect(view.standing()).toBeUndefined();
  });

  it("keeps standing a view shown after the user's input, as a click on a marker selects", () => {
    const { map, view } = standingOn();
    map.getDiv().dispatchEvent(new Event("pointerdown"));
    view.shown(FIT);
    map.trigger("center_changed");
    expect(view.standing()).toBe(FIT);
  });

  it("stops listening when stopped", () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    map.trigger("idle");
    view.stop();
    map.getDiv().dispatchEvent(new Event("keydown"));
    map.trigger("center_changed");
    expect(view.standing()).toBe(FIT);
  });
});
