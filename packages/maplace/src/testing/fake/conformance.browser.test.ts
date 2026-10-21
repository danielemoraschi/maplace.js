import { describe, expect, it } from "vitest";
import type { LocationDiff } from "../../adapter";
import { sizeOf } from "../../adapter-kit/map-size";
import { describeConformance } from "../conformance/describe-conformance";
import { adding, markerDrawable, presented, withContent } from "../conformance/fixtures";
import { createRecordingHost } from "../conformance/recording-host";
import type { ConformanceSubject } from "../conformance/subject";
import { EVERY_CAPABILITY } from "../contract-values";
import { createFakeAdapter } from "../fake-adapter";

const fake: ConformanceSubject = {
  name: "fake",
  create() {
    const adapter = createFakeAdapter({ sizeOf });
    // The suite mounts as a page would: the fake's load finishes without a test holding it.
    void adapter.finishMount();
    return { adapter, probe: adapter.probe() };
  },
};

describeConformance(fake);

/**
 * The fake as an adapter that can't draw circles: it declares none, and fails to apply one, which
 * the fake would draw anyway. The checks open to every adapter must pass on it.
 */
const withoutCircles: ConformanceSubject = {
  name: "fake without circles",
  groups: ["presentation"],
  create() {
    const capabilities = EVERY_CAPABILITY.filter((capability) => capability !== "circle");
    const adapter = createFakeAdapter({ sizeOf, capabilities });
    void adapter.finishMount();
    const apply = (diff: LocationDiff) =>
      hasCircle(diff)
        ? Promise.reject(new Error("a circle drawn, though circle isn't declared"))
        : adapter.apply(diff);
    return { adapter: { ...adapter, apply }, probe: adapter.probe() };
  },
};

function hasCircle({ added, updated }: LocationDiff): boolean {
  return [...added, ...updated].some(({ geometry }) => geometry.type === "circle");
}

describeConformance(withoutCircles);

describe("the fake beyond the contract", () => {
  it("reports nothing it does by itself until settled, so store tests see only their own reports", async () => {
    const adapter = createFakeAdapter();
    const host = createRecordingHost();
    void adapter.finishMount();
    await adapter.mount({
      container: document.createElement("div"),
      host,
      signal: new AbortController().signal,
      cluster: false,
      popup: { maxWidth: undefined, offset: [0, 0], openOn: "click" },
    });
    await adapter.apply(adding(withContent(markerDrawable("a"), "A")));
    adapter.present(presented({ selectedId: "a" }));
    adapter.setView({ kind: "location", id: "a", zoom: 3 });
    expect(host.reports).toEqual([]);
    await adapter.probe().settle();
    expect(host.reports.map(({ method }) => method)).toEqual([
      "reportViewportChange",
      "reportPopupOpen",
    ]);
  });
});
