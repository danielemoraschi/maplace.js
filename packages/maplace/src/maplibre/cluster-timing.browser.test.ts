import { afterEach, describe, expect, it } from "vitest";
import { CLUSTER_RANK } from "../adapter-kit/stacking";
import { adding, LARGE_DIFF, manyMarkers, presented } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { longestTaskDuring } from "../testing/long-tasks";
import type { ResolvedView } from "../viewport";
import { clustersOn, shownTotal } from "./testing/clusters";
import { mountedMapLibre } from "./testing/mounted";

afterEach(unmountAll);

/**
 * Guards against gross regressions, not the RFC's figures, which are a dev machine's on a GPU: the
 * test prints what it measured. Both are Google's guard for clustering a large diff: in software
 * WebGL, with the whole suite's pages sharing the CPU, a selection's frame has taken 770 ms.
 */
const LONGEST_CLUSTERING_TASK_MS = 2_000;
const SELECTION_PAINTED_MS = 2_000;

/** The whole world, where `manyMarkers` are, at maplace's zoom 1. */
const WORLD: ResolvedView = { kind: "center", center: { lat: 0, lng: 0 }, zoom: 1 };

const LARGE_DIFF_IDS = manyMarkers(LARGE_DIFF).map(({ id }) => id);

describe("clustering a large diff on MapLibre, timed", () => {
  it("clusters a large diff into far fewer markers, within the accepted task", async () => {
    const { adapter, probe, container } = await mountedMapLibre(undefined, { cluster: true });
    adapter.setView(WORLD);
    await probe.settle();
    const longest = await longestTaskDuring(() =>
      adapter.apply(adding(...manyMarkers(LARGE_DIFF))),
    );
    const alone = LARGE_DIFF_IDS.filter((id) => probe.location(id)?.visible).length;
    const { counts } = clustersOn(container);
    console.info(
      `clustering ${LARGE_DIFF} on MapLibre: ${counts.length} clusters and ${alone} pins, longest task ${longest} ms`,
    );
    expect(counts.length + alone).toBeLessThan(1000);
    expect(shownTotal(container, probe, LARGE_DIFF_IDS)).toBe(LARGE_DIFF);
    expect(longest).toBeLessThanOrEqual(LONGEST_CLUSTERING_TASK_MS);
  });

  it("draws a location selected from a list on its own, in front, and times the selection", async () => {
    const { adapter, probe, state, container } = await mountedMapLibre(undefined, {
      cluster: true,
    });
    adapter.setView(WORLD);
    await adapter.apply(adding(...manyMarkers(LARGE_DIFF)));
    await probe.settle();
    expect(probe.location("m100")?.visible).toBe(false);
    let selection = 0;
    const longest = await longestTaskDuring(async () => {
      const started = performance.now();
      adapter.present(presented({ selectedId: "m100" }));
      await new Promise(requestAnimationFrame);
      selection = Math.round(performance.now() - started);
    });
    console.info(
      `selecting one of ${LARGE_DIFF} clustered on MapLibre: ${selection} ms to the next frame, longest task ${longest} ms`,
    );
    expect(probe.location("m100")?.visible).toBe(true);
    const selected = state.placed.get("m100");
    expect(selected?.geometryType === "marker" && selected.isInDom()).toBe(true);
    expect(selected?.rank()).toBeGreaterThan(CLUSTER_RANK);
    expect(shownTotal(container, probe, LARGE_DIFF_IDS)).toBe(LARGE_DIFF);
    // The selection's own time, to its frame: a long task may be another test page's, on a busy run.
    expect(selection).toBeLessThanOrEqual(SELECTION_PAINTED_MS);
  });
});
