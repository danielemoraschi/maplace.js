import { describe, expect, it, vi } from "vitest";
import { MaplaceError } from "../errors";
import { createHost } from "./host";

const failure = new MaplaceError("route-failed", "no route");

describe("createHost", () => {
  it("passes errors on while attached, and drops them once detached", () => {
    const controller = new AbortController();
    const reportError = vi.fn();
    const host = createHost(controller.signal, reportError);
    host.reportError(failure);
    controller.abort();
    host.reportError(failure);
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it("takes the other reports without effect until they are wired", () => {
    const host = createHost(new AbortController().signal, vi.fn());
    expect(() => {
      host.reportSelect("a");
      host.reportHover(undefined);
      host.reportViewport({
        center: { lat: 0, lng: 0 },
        zoom: 1,
        bounds: { south: 0, west: 0, north: 0, east: 0 },
      });
    }).not.toThrow();
  });
});
