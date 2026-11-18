// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { GoogleShape } from "../placed-location";
import { styleValues } from "../shape-style";
import { dashedStyleOf } from "./dashed-style";
import { StubPolyline } from "./stub-shapes";

/** A stub polyline drawn as the adapter draws a line in `style`. */
function lineIn(style: Parameters<typeof styleValues>[0]): GoogleShape {
  const line = new StubPolyline();
  line.setValues(styleValues(style));
  return line as unknown as GoogleShape;
}

describe("a Google line's dash as the probe reads it", () => {
  it("reads dashes and dots back with the line's opacity", () => {
    expect(dashedStyleOf(lineIn({ strokeDash: "dashed", strokeOpacity: 0.5 }))).toEqual({
      strokeDash: "dashed",
      strokeOpacity: 0.5,
    });
    expect(dashedStyleOf(lineIn({ strokeDash: "dotted", strokeOpacity: 0.25 }))).toEqual({
      strokeDash: "dotted",
      strokeOpacity: 0.25,
    });
  });

  it("reads nothing from a solid line, whose stroke is read as it is", () => {
    expect(dashedStyleOf(lineIn({ strokeDash: "solid" }))).toEqual({});
    expect(dashedStyleOf(lineIn(undefined))).toEqual({});
  });
});
