import { describe, expect, it } from "vitest";
import { errorsOn, lastAdapter, mapFrom, nextTask } from "./testing/fake-maps";

const CIRCLE = `<maplace-location location-id="c" type="circle" lat="45" lng="9" radius="500" selected-style='{"fill":"#ff0000"}'></maplace-location>`;

async function circleMap() {
  const map = await mapFrom(`<maplace-map>${CIRCLE}</maplace-map>`);
  const adapter = lastAdapter();
  await adapter.finishMount();
  await map.maplace.whenReady();
  const circle = map.querySelector("maplace-location");
  if (circle === null) throw new Error("no circle");
  const drawnStyle = () => adapter.probe().location("c")?.style;
  return { map, circle, drawnStyle };
}

describe("<maplace-location> shape styles", () => {
  it("draws a circle in its selected-style once selected", async () => {
    const { map, drawnStyle } = await circleMap();
    expect(drawnStyle()?.fill).toBeUndefined();
    map.maplace.select("c");
    expect(drawnStyle()?.fill).toBe("#ff0000");
  });

  it("redraws a hovered circle when its hovered-style changes", async () => {
    const { map, circle, drawnStyle } = await circleMap();
    map.maplace.hover("c");
    circle.setAttribute("hovered-style", '{"fill":"#00ff00"}');
    await nextTask();
    expect(drawnStyle()?.fill).toBe("#00ff00");
  });

  it("puts the map in error for a style that isn't JSON, keeping its locations", async () => {
    const { map, circle } = await circleMap();
    const errors = errorsOn(map);
    circle.setAttribute("selected-style", "red");
    await nextTask();
    expect(errors).toEqual([
      expect.objectContaining({ code: "invalid-input", field: "selectedStyle" }),
    ]);
    expect(map.loadState).toBe("error");
    expect(map.locations).toEqual([
      expect.objectContaining({ selectedStyle: { fill: "#ff0000" } }),
    ]);
  });
});
