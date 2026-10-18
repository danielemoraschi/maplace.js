import { describe, expect, it } from "vitest";
import { HOVERED_LOOK, SELECTED_LOOK } from "../adapter-kit/shape-looks";
import { mounted } from "../testing/mounted";

const center = { lat: 0, lng: 0 };

async function storeWithStyles() {
  const { maplace, adapter } = await mounted({
    locations: [
      { id: "own", type: "circle", center, radius: 5, selectedStyle: { fill: "#ff0000" } },
      { id: "plain", type: "circle", center, radius: 5 },
    ],
    style: { stroke: "#0000ff" },
    selectedStyle: { stroke: "#00ff00", fill: "#ffff00" },
    hoveredStyle: { strokeWidth: 3 },
  });
  const styleOf = (id: string) => adapter.probe().location(id)?.style;
  return { maplace, styleOf };
}

describe("the store's shape styles reach the map", () => {
  it("draws a shape at rest in the store's style", async () => {
    const { styleOf } = await storeWithStyles();
    expect(styleOf("plain")).toEqual({ stroke: "#0000ff" });
  });

  it("draws a selected shape in its own selected style over the store's", async () => {
    const { maplace, styleOf } = await storeWithStyles();
    maplace.select("own");
    expect(styleOf("own")).toEqual({ ...SELECTED_LOOK, stroke: "#00ff00", fill: "#ff0000" });
  });

  it("draws a hovered shape in the store's hovered style", async () => {
    const { maplace, styleOf } = await storeWithStyles();
    maplace.hover("plain");
    expect(styleOf("plain")).toEqual({ ...HOVERED_LOOK, stroke: "#0000ff", strokeWidth: 3 });
  });
});
