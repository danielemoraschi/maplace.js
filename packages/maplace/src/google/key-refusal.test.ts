// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRecordingHost } from "../testing/conformance/recording-host";
import { CONTAINER } from "../testing/container";
import type { MapPart } from "./mounted-map";
import { stubLibraries } from "./testing/stub-libraries";
import { heldMaps, lifecycle, mountContext, page } from "./testing/stub-lifecycle";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("the map lifecycle when Google refuses the page's key", () => {
  it("fails the mount, opening no map, when Google refused the page's key before", async () => {
    const { source, counts, finish } = heldMaps();
    const { keyRefusal, refuseKey } = page();
    refuseKey();
    finish();
    const mounting = lifecycle(source, { keyRefusal }).mount(mountContext());
    await expect(mounting).rejects.toMatchObject({ code: "provider-auth-failed" });
    expect(counts.opened).toBe(0);
  });

  it("reports Google refusing the key once the map is open, and lets go of the map", async () => {
    const { source, counts, finish } = heldMaps();
    const { keyRefusal, refuseKey } = page();
    const tornDown = vi.fn();
    const failing = () => {
      throw new TypeError("Google no longer serves this");
    };
    const parts: MapPart[] = [
      { open: (mounted) => mounted.onDestroy(tornDown) },
      { open: (mounted) => mounted.onDestroy(failing) },
    ];
    const { state, mount, destroy } = lifecycle(source, { parts, keyRefusal });
    const host = createRecordingHost();
    finish();
    await mount(mountContext(new AbortController(), host));
    refuseKey();
    refuseKey();
    expect(host.reportsOf("reportError")).toEqual([
      [expect.objectContaining({ code: "provider-auth-failed" })],
    ]);
    expect([state.mounted, tornDown.mock.calls.length, counts.released]).toEqual([undefined, 1, 0]);
    destroy();
    expect([tornDown.mock.calls.length, counts.released]).toEqual([1, 1]);
  });

  it("stops hearing refusals once destroyed", async () => {
    const { source, finish } = heldMaps();
    const stop = vi.fn();
    const keyRefusal = { refused: () => false, listen: () => stop };
    const { mount, destroy } = lifecycle(source, { keyRefusal });
    finish();
    await mount(mountContext());
    destroy();
    expect(stop).toHaveBeenCalledOnce();
  });

  it("fails the mount on a map Google disabled before maplace was there to hear it", async () => {
    const { source, counts, finish } = heldMaps();
    // Measured on Maps JS 3.66: a map made after Google refused the key has no element.
    const disabled = {
      ...source,
      open: () => ({
        ...source.open(CONTAINER, stubLibraries()),
        map: { getDiv: () => undefined } as unknown as google.maps.Map,
      }),
    };
    finish();
    const mounting = lifecycle(disabled).mount(mountContext());
    await expect(mounting).rejects.toMatchObject({ code: "provider-auth-failed" });
    expect(counts.released).toBe(1);
  });
});
