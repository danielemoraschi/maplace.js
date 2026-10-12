import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdapterHost } from "../adapter";
import { MaplaceError } from "../errors";
import { createHost } from "./host";

afterEach(() => {
  vi.unstubAllGlobals();
});

function recordingReports(): AdapterHost {
  return {
    reportSelect: vi.fn(),
    reportHover: vi.fn(),
    reportChange: vi.fn(),
    reportPopupOpen: vi.fn(),
    reportPopupClose: vi.fn(),
    reportViewport: vi.fn(),
    reportRoute: vi.fn(),
    reportError: vi.fn(),
  };
}

describe("createHost", () => {
  it("passes every report on while attached, and none once detached", () => {
    const controller = new AbortController();
    const reports = recordingReports();
    const host = createHost(controller.signal, reports);
    host.reportSelect("a");
    host.reportError(new MaplaceError("route-failed", "no route"));
    controller.abort();
    host.reportSelect("b");
    host.reportHover("b");
    expect(reports.reportSelect).toHaveBeenCalledTimes(1);
    expect(reports.reportSelect).toHaveBeenCalledWith("a");
    expect(reports.reportError).toHaveBeenCalledTimes(1);
    expect(reports.reportHover).not.toHaveBeenCalled();
  });

  it("rethrows a failing report in a microtask instead of into the adapter", () => {
    const queued: (() => void)[] = [];
    vi.stubGlobal("queueMicrotask", (task: () => void) => queued.push(task));
    const bug = new Error("bad report");
    const reports = {
      ...recordingReports(),
      reportChange: () => {
        throw bug;
      },
    };
    const host = createHost(new AbortController().signal, reports);
    expect(() => host.reportChange("a", { type: "marker", lat: 0, lng: 0 })).not.toThrow();
    expect(() => queued[0]?.()).toThrow(bug);
  });
});
