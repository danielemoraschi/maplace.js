// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { heatmapOf } from "./heatmap-attributes";

function mapWith(attributes: Record<string, string>): HTMLElement {
  const map = document.createElement("div");
  for (const [name, value] of Object.entries(attributes)) map.setAttribute(name, value);
  return map;
}

describe("heatmapOf", () => {
  it("reads every marker into the heat from an empty or true heatmap, none from false or none", () => {
    expect(heatmapOf(mapWith({ heatmap: "" }))).toEqual({});
    expect(heatmapOf(mapWith({ heatmap: "true" }))).toEqual({});
    expect(heatmapOf(mapWith({ heatmap: "false" }))).toBeUndefined();
    expect(heatmapOf(mapWith({}))).toBeUndefined();
  });

  it("reads its groups, space-separated, and a max zoom", () => {
    expect(
      heatmapOf(mapWith({ heatmap: " quakes  aftershocks ", "heatmap-max-zoom": "7" })),
    ).toEqual({
      groups: ["quakes", "aftershocks"],
      maxZoom: 7,
    });
  });

  it.each([
    [{ heatmap: "", cluster: "" }, "heatmap", "heatmap can't be used with cluster"],
    [{ "heatmap-max-zoom": "7" }, "heatmap-max-zoom", "heatmap-max-zoom needs heatmap"],
    [{ heatmap: "", "heatmap-max-zoom": "far" }, "heatmap-max-zoom", "from 3 to 25"],
    [{ heatmap: "", "heatmap-max-zoom": "2" }, "heatmap-max-zoom", "from 3 to 25"],
  ])("stands %j as misuse on %s", (attributes, field, problem) => {
    expect(() => heatmapOf(mapWith(attributes))).toThrow(
      expect.objectContaining({ field, message: expect.stringContaining(problem) }),
    );
  });
});
