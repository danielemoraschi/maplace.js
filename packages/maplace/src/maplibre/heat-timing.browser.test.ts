import { afterEach, describe, expect, it } from "vitest";
import { adding, LARGE_DIFF, manyMarkers, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { longestTaskDuring } from "../testing/long-tasks";
import type { ResolvedView } from "../viewport";
import { mountedMapLibre } from "./testing/mounted";

afterEach(unmountAll);

/**
 * Guards against gross regressions, not the RFC's figures, which are a dev machine's on a GPU: the
 * test prints what it measured. The same guards as clustering's (`cluster-timing.browser.test.ts`).
 */
const LONGEST_HEAT_TASK_MS = 2_000;
const SELECTION_PAINTED_MS = 2_000;

/** The whole world, where `manyMarkers` are, at maplace's zoom 1: all heat. */
const WORLD: ResolvedView = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 1 };

/** `LARGE_DIFF` markers in the heat, weighing 1 to 5. */
const heatMarkers = () =>
  manyMarkers(LARGE_DIFF).map((drawable, index) => ({ ...drawable, heatWeight: 1 + (index % 5) }));

describe("a heatmap of a large diff on MapLibre, timed", () => {
  it("draws a large diff as heat within the accepted task", async () => {
    const { adapter, probe } = await mountedMapLibre(undefined, { heatmap: { maxZoom: 9 } });
    adapter.setView(WORLD);
    await probe.settle();
    const longest = await longestTaskDuring(() => adapter.apply(adding(...heatMarkers())));
    console.info(`a heatmap of ${LARGE_DIFF} on MapLibre: longest task ${longest} ms`);
    expect(probe.location("m100")?.visible).toBe(true);
    expect(longest).toBeLessThanOrEqual(LONGEST_HEAT_TASK_MS);
  });

  it("draws a heat marker selected from a list as a pin in front, and times the selection", async () => {
    const { adapter, probe, state } = await mountedMapLibre(undefined, {
      heatmap: { maxZoom: 9 },
    });
    adapter.setView(WORLD);
    await adapter.apply(adding(...heatMarkers()));
    await probe.settle();
    let selection = 0;
    const longest = await longestTaskDuring(async () => {
      const started = performance.now();
      adapter.present(presented({ selectedId: "m100" }));
      await new Promise(requestAnimationFrame);
      selection = Math.round(performance.now() - started);
    });
    console.info(
      `selecting one of ${LARGE_DIFF} heat markers on MapLibre: ${selection} ms to the next frame, longest task ${longest} ms`,
    );
    expect(state.features?.pins.featureOf("m100")?.properties).toMatchObject({ front: true });
    expect(selection).toBeLessThanOrEqual(SELECTION_PAINTED_MS);
  });
});
