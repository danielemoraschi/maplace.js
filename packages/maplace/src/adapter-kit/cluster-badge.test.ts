// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { clusterLabel, countBadge } from "./cluster-badge";

describe("the cluster badge", () => {
  it("labels and badges a count", () => {
    expect(clusterLabel(12)).toBe("Cluster of 12 locations");
    const badge = countBadge(document, 12);
    expect(badge.ownerDocument).toBe(document);
    expect(badge.textContent).toBe("12");
    expect(badge.style.borderRadius).toBe("16px");
  });
});
