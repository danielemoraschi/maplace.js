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
  return { map, view, userInput: (type?: string) => map.userInput(type) };
}

describe("the standing view", () => {
  it("is the view shown last, through any move with no input, however late Google makes it", async () => {
    const { map, view } = standingOn();
    expect(view.standing()).toBeUndefined();
    view.shown(FIT);
    // A move Google held back lands frames later, after any window maplace could wait.
    await frames(3);
    map.trigger("center_changed");
    map.trigger("zoom_changed");
    expect(view.standing()).toBe(FIT);
  });

  it.each(["pointerdown", "wheel", "keydown"])(
    "stands down when the map moves after the user's %s on it",
    (input) => {
      const { map, view, userInput } = standingOn();
      view.shown(FIT);
      userInput(input);
      map.trigger("zoom_changed");
      expect(view.standing()).toBeUndefined();
    },
  );

  it("keeps standing when only the bounds change, as when the map is resized", () => {
    const { map, view, userInput } = standingOn();
    view.shown(FIT);
    userInput("pointerdown");
    map.trigger("bounds_changed");
    expect(view.standing()).toBe(FIT);
  });

  it("stands down when the user drags", () => {
    const { map, view } = standingOn();
    view.shown(FIT);
    map.trigger("dragstart");
    expect(view.standing()).toBeUndefined();
  });

  it("keeps standing a view shown after the user's input, as a click on a marker selects", () => {
    const { map, view, userInput } = standingOn();
    userInput("pointerdown");
    view.shown(FIT);
    map.trigger("center_changed");
    expect(view.standing()).toBe(FIT);
  });

  it("stops listening when stopped", () => {
    const { map, view, userInput } = standingOn();
    view.shown(FIT);
    view.stop();
    userInput("keydown");
    map.trigger("center_changed");
    map.trigger("dragstart");
    expect(view.standing()).toBe(FIT);
  });
});
