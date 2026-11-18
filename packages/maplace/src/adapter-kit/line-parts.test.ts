import { describe, expect, it } from "vitest";
import { lineParts } from "./line-parts";

const PATH = [
  { lat: 0, lng: 0 },
  { lat: 0, lng: 4 },
];

const travelledStyleOf = (
  style: Parameters<typeof lineParts>[1]["style"],
  travelledStyle?: Parameters<typeof lineParts>[1]["travelledStyle"],
  restOpacity = 1,
) => lineParts(PATH, { style, progress: 0.5, travelledStyle }, restOpacity).travelled?.style;

describe("a line's travelled look", () => {
  it("is the line's look at 40% of its opacity, the travelled style over it", () => {
    expect(travelledStyleOf({ stroke: "red", strokeOpacity: 0.5 })).toEqual({
      stroke: "red",
      strokeOpacity: 0.2,
    });
    expect(travelledStyleOf({ stroke: "red" }, { stroke: "grey" })).toEqual({
      stroke: "grey",
      strokeOpacity: 0.4,
    });
  });

  it("fades the provider's opacity at rest where the line sets none", () => {
    expect(travelledStyleOf(undefined, undefined, 0.85)?.strokeOpacity).toBeCloseTo(0.34);
  });

  it("takes the travelled style's own opacity as it is", () => {
    expect(travelledStyleOf({ strokeOpacity: 1 }, { strokeOpacity: 0.7 })?.strokeOpacity).toBe(0.7);
  });
});

describe("a line split at its progress", () => {
  const look = { style: { stroke: "red" }, travelledStyle: { stroke: "grey" } };

  it("gives the travelled part and the part ahead, each in its look", () => {
    expect(lineParts(PATH, { ...look, progress: 0.25 }, 1)).toEqual({
      travelled: {
        path: [PATH[0], { lat: 0, lng: 1 }],
        style: { stroke: "grey", strokeOpacity: 0.4 },
      },
      ahead: { path: [{ lat: 0, lng: 1 }, PATH[1]], style: look.style },
    });
  });

  it("draws no travelled part at 0, and no part ahead at 1: neither would have a length", () => {
    expect(lineParts(PATH, { ...look, progress: 0 }, 1).travelled).toBeUndefined();
    expect(lineParts(PATH, { ...look, progress: 0 }, 1).ahead?.path).toEqual(PATH);
    expect(lineParts(PATH, { ...look, progress: 1 }, 1).ahead).toBeUndefined();
    expect(lineParts(PATH, { ...look, progress: 1 }, 1).travelled?.path).toEqual(PATH);
  });
});
