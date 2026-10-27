// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { selectorsOf, unguardedSelectorsOf, weighsNothing } from "../testing/selectors";
import { CLUSTER_CLASS, CLUSTER_STYLES, clusterLabel, countBadge } from "./cluster-badge";

describe("the cluster badge", () => {
  it("labels and badges a count with the cluster class, its look left to the sheet", () => {
    expect(clusterLabel(12)).toBe("Cluster of 12 locations");
    const badge = countBadge(document, 12);
    expect(badge.ownerDocument).toBe(document);
    expect(badge.textContent).toBe("12");
    expect(badge.className).toBe(CLUSTER_CLASS);
    expect(badge.getAttribute("style")).toBeNull();
  });
});

describe("CLUSTER_STYLES", () => {
  it("weighs nothing, so any rule of the page wins, and turns off inside the opt-out", () => {
    const selectors = selectorsOf(CLUSTER_STYLES);
    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !weighsNothing(selector))).toEqual([]);
    expect(unguardedSelectorsOf(CLUSTER_STYLES)).toEqual([]);
  });
});
