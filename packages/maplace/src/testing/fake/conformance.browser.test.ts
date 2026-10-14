import { describe, expect, it } from "vitest";
import { sizeOf } from "../../adapter-kit/map-size";
import { describeConformance } from "../conformance/describe-conformance";
import { adding, markerDrawable, presented, withContent } from "../conformance/fixtures";
import { createRecordingHost } from "../conformance/recording-host";
import type { ConformanceSubject } from "../conformance/subject";
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
    expect(host.reports.map(({ method }) => method)).toEqual(["reportViewport", "reportPopupOpen"]);
  });
});
