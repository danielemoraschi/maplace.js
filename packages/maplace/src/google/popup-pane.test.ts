// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { layerPopupPane } from "./popup-pane";
import { StubMap, stubLibraries } from "./testing/stub-libraries";

/** A stub map whose popup pane had `willChange` set by the page, and the pane. */
function mapWithPane(willChange = "") {
  const stub = new StubMap(document.createElement("div"));
  stub.floatPane.style.willChange = willChange;
  return { map: stub as unknown as google.maps.Map, pane: stub.floatPane };
}

describe("layerPopupPane", () => {
  it("puts the popup pane on a compositing layer of its own once the overlay is added", () => {
    const { map, pane } = mapWithPane();
    layerPopupPane(map, stubLibraries().maps, () => {});
    expect(pane.style.willChange).toBe("transform");
  });

  it("gives the pane to whoever asked for it, once the overlay is added", () => {
    const { map, pane } = mapWithPane();
    let found: HTMLElement | undefined;
    layerPopupPane(map, stubLibraries().maps, (given) => {
      found = given;
    });
    expect(found).toBe(pane);
  });

  it("gives the pane back the will-change it had when the overlay is taken off", () => {
    const { map, pane } = mapWithPane("opacity");
    const takeOff = layerPopupPane(map, stubLibraries().maps, () => {});
    takeOff();
    expect(pane.style.willChange).toBe("opacity");
  });
});
