// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { createTeardowns } from "../adapter-kit/teardowns";
import { clusterRegrouping } from "./cluster-regrouping";
import { type Clustering, noClustering } from "./clustering";
import type { FeatureSet, FeatureSets } from "./feature-set";
import { createMapState } from "./map-state";
import type { MountedMapLibre } from "./mounted-map";
import { StubMapLibreMap } from "./testing/stub-maplibre";

/** A feature set recording its flushes. */
const recordingSet = () => ({ flush: vi.fn(() => undefined) }) as unknown as FeatureSet;

/** The part opened on a stub map with `clustering`, sending to recording feature sets. */
function regroupingOn(clustering: Clustering) {
  const stub = new StubMapLibreMap();
  const teardowns = createTeardowns();
  const { map } = stub.asMapLibre();
  const mounted = { map, clustering, onDestroy: teardowns.add } as unknown as MountedMapLibre;
  const state = createMapState();
  const features: FeatureSets = { pins: recordingSet(), shapes: recordingSet() };
  state.mounted = mounted;
  state.features = features;
  clusterRegrouping(state).open(mounted);
  return { stub, features, destroy: teardowns.runAll };
}

const NOT_CLUSTERING = noClustering(undefined as never, undefined as never);

const regroupChanging = (changed: boolean): Clustering => ({
  ...NOT_CLUSTERING,
  cameraSettled: () => changed,
});

describe("clusterRegrouping", () => {
  it("sends what a camera regroup changed", () => {
    const { stub, features } = regroupingOn(regroupChanging(true));
    stub.fire("moveend");
    expect(features.pins.flush).toHaveBeenCalledOnce();
    expect(features.shapes.flush).toHaveBeenCalledOnce();
  });

  it("sends nothing when the regroup changed nothing, nor on a map that doesn't cluster", () => {
    for (const clustering of [regroupChanging(false), NOT_CLUSTERING]) {
      const { stub, features } = regroupingOn(clustering);
      stub.fire("moveend");
      expect(features.pins.flush).not.toHaveBeenCalled();
    }
  });

  it("stops on destroy", () => {
    const { stub, destroy } = regroupingOn(regroupChanging(true));
    destroy();
    expect(stub.listening("moveend")).toBe(0);
  });
});
