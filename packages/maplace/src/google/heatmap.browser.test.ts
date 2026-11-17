import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { adding, markerDrawable, presented, TOWNS } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import type { GoogleMapState } from "./map-state";
import { drawnMarker, idle } from "./testing/map-waits";
import { mountedGoogle, TEST_OPTIONS } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

const QUAKES = [
  markerDrawable("a", TOWNS.bologna, { heatWeight: 4 }),
  markerDrawable("b", TOWNS.modena, { heatWeight: 2 }),
];

/** A real Google map with heat below zoom 9, the quakes on it, at `zoom` over Bologna. */
async function heatedAt(zoom: number) {
  const mounted = await mountedGoogle(TEST_OPTIONS, { heatmap: { maxZoom: 9 } });
  mounted.adapter.setView({ kind: "center", center: TOWNS.bologna, zoom });
  await mounted.adapter.apply(adding(...QUAKES));
  await idle(mounted.state.mounted?.map as google.maps.Map);
  return mounted;
}

/** The heat canvas's pixels that aren't clear. */
function heatedPixels(container: HTMLElement): number {
  const canvas = container.querySelector("canvas[style*='pointer-events: none']");
  const context = (canvas as HTMLCanvasElement | null)?.getContext("2d");
  if (!context) return 0;
  const { data } = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
  let heated = 0;
  for (let at = 3; at < data.length; at += 4) if ((data[at] ?? 0) > 0) heated++;
  return heated;
}

/**
 * Whether the marker's dot is drawn: shown, not hidden under the heat by its CSS. Once the marker
 * is on the page, not once it has a size, which a marker hidden under the heat never has.
 */
async function dotShown(state: GoogleMapState, id: string): Promise<boolean> {
  const marker = () => {
    const placed = state.placed.get(id);
    return placed && "marker" in placed ? placed.marker : undefined;
  };
  await expect.poll(() => marker()?.isConnected).toBe(true);
  return getComputedStyle(marker() as HTMLElement).display !== "none";
}

describeWithMaps("a heatmap on real Google Maps", () => {
  afterEach(unmountAll);

  it("draws the heat markers as heat at a far zoom, their dots hidden under it", async () => {
    const { container, state } = await heatedAt(3);
    await expect.poll(() => heatedPixels(container)).toBeGreaterThan(0);
    expect(await dotShown(state, "a")).toBe(false);
  });

  it("shows the dots, and no heat, from maxZoom on", async () => {
    const { container, state } = await heatedAt(10);
    await expect.poll(() => dotShown(state, "a")).toBe(true);
    expect(heatedPixels(container)).toBe(0);
  });

  it("keeps a dot hovered once its pin shows over it, and lets it go as the pointer leaves", async () => {
    const { adapter, state, host } = await heatedAt(12);
    const marker = await drawnMarker(state, "a");
    await userEvent.hover(marker);
    await expect.poll(() => host.reportsOf("reportHoverChange")).toEqual([["a"]]);
    adapter.present(presented({ hoveredId: "a" }));
    await userEvent.hover(marker);
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"]]);
    await userEvent.unhover(marker);
    expect(host.reportsOf("reportHoverChange")).toEqual([["a"], [undefined]]);
  });

  it("reports a click on a dot as its location's", async () => {
    const { state, host } = await heatedAt(12);
    await userEvent.click(await drawnMarker(state, "a"));
    expect(host.reportsOf("reportSelectionChange")).toEqual([["a"]]);
  });
});
