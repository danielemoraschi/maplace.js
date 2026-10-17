import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdapterHost } from "../adapter";
import { MaplaceError } from "../errors";
import { createHost } from "./host";

afterEach(() => {
  vi.unstubAllGlobals();
});

function recordingReports(): AdapterHost {
  return {
    reportSelectionChange: vi.fn(),
    reportHoverChange: vi.fn(),
    reportLocationChange: vi.fn(),
    reportPopupOpen: vi.fn(),
    reportPopupClose: vi.fn(),
    reportViewportChange: vi.fn(),
    reportRouteChange: vi.fn(),
    reportError: vi.fn(),
  };
}

describe("createHost", () => {
  it("passes every report on while attached, and none once detached", () => {
    const controller = new AbortController();
    const reports = recordingReports();
    const host = createHost(controller.signal, reports);
    host.reportSelectionChange("a");
    host.reportError(new MaplaceError("route-failed", "no route"));
    controller.abort();
    host.reportSelectionChange("b");
    host.reportHoverChange("b");
    expect(reports.reportSelectionChange).toHaveBeenCalledTimes(1);
    expect(reports.reportSelectionChange).toHaveBeenCalledWith("a");
    expect(reports.reportError).toHaveBeenCalledTimes(1);
    expect(reports.reportHoverChange).not.toHaveBeenCalled();
  });

  it("rethrows a failing report in a microtask instead of into the adapter", () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const bug = new Error("bad report");
    const reports = {
      ...recordingReports(),
      reportLocationChange: () => {
        throw bug;
      },
    };
    const host = createHost(new AbortController().signal, reports);
    expect(() => host.reportLocationChange("a", { type: "marker", lat: 0, lng: 0 })).not.toThrow();
    expect(() => queued[0]?.()).toThrow(bug);
  });
});
