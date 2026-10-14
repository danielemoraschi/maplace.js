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
    });
  });

  it("unsets every field the style leaves out, so a removed one gets Google's default back", () => {
    const values = styleValues({ stroke: "red" });
    expect(Object.keys(values)).toHaveLength(5);
    expect(values).toEqual({ strokeColor: "red" });
    expect(Object.values(styleValues(undefined))).toEqual(Array(5).fill(undefined));
  });
});
