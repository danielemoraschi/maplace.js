import { describe, expect, it } from "vitest";
import { styleValues } from "./shape-style";

describe("styleValues", () => {
  it("gives the style in Google's names", () => {
    const style = {
      stroke: "red",
      strokeOpacity: 0.5,
      strokeWidth: 3,
      fill: "blue",
      fillOpacity: 0.2,
    };
    expect(styleValues(style)).toEqual({
      strokeColor: "red",
      strokeOpacity: 0.5,
      strokeWeight: 3,
      fillColor: "blue",
      fillOpacity: 0.2,
      icons: undefined,
    });
  });

  it("unsets every field the style leaves out, so a removed one gets Google's default back", () => {
    const values = styleValues({ stroke: "red" });
    expect(Object.keys(values)).toHaveLength(6);
    expect(values).toEqual({ strokeColor: "red" });
    expect(Object.values(styleValues(undefined))).toEqual(Array(6).fill(undefined));
  });

  it("draws a dashed or dotted line with icons in the line's opacity, its own stroke see-through", () => {
    const dashed = styleValues({ strokeDash: "dashed", strokeWidth: 4, strokeOpacity: 0.5 });
    expect(dashed.strokeOpacity).toBe(0);
    expect(dashed.icons).toEqual([
      { icon: { path: "M 0,-1 0,1", strokeOpacity: 0.5, scale: 4 }, offset: "0", repeat: "16px" },
    ]);
    const dotted = styleValues({ strokeDash: "dotted", strokeWidth: 4 });
    expect(dotted.icons?.[0]).toMatchObject({
      icon: { fillOpacity: 1, strokeOpacity: 0, scale: 2 },
      repeat: "8px",
    });
  });

  it("draws a solid line with its own stroke and no icons", () => {
    expect(styleValues({ strokeDash: "solid", strokeOpacity: 0.5 })).toMatchObject({
      strokeOpacity: 0.5,
      icons: undefined,
    });
  });
});
