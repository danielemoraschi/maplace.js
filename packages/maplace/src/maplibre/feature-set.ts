import type {
  GeoJSONFeatureDiff,
  GeoJSONSource,
  GeoJSONSourceDiff,
  Map as MapLibreMap,
} from "maplibre-gl";
import type { ShapeStyle } from "../style";

/**
 * What a location's feature carries: its id (the source's `promoteId`), where it stacks, and a
 * shape's style in its state.
 */
export interface LocationProperties extends ShapeStyle {
  readonly id: string;
  readonly rank: number;
}

export type LocationFeature = GeoJSON.Feature<GeoJSON.Geometry, LocationProperties>;

/** The features of one of maplace's GeoJSON sources, sent to MapLibre in batches. */
export interface FeatureSet {
  /** Shows `feature`, in place of the one with its id. */
  put(feature: LocationFeature): void;
  /** New properties for a feature shown, its geometry as it is: MapLibre isn't sent it again. */
  restyle(properties: LocationProperties): void;
  remove(id: string): void;
  /** The feature shown for `id`, as MapLibre was given it or is about to be. */
  featureOf(id: string): LocationFeature | undefined;
  /**
   * Sends what changed since the last flush, as one diff; resolves once MapLibre has it. None
   * when nothing changed, or the source is gone with a restyle (it takes every feature again
   * once back, `resendIfReplaced`). Never rejects: MapLibre reports a failure as an error event.
   */
  flush(): Promise<void> | undefined;
  /** Whether the source isn't the one this set last sent to: gone, or put back by a restyle. */
  isReplaced(): boolean;
  /** Sends every feature to a source put back by a restyle; none when it is still the same. */
  resendIfReplaced(): Promise<void> | undefined;
}

/**
 * The features of the source `sourceId`, kept here as well, so a source put back gets them all,
 * and the adapter reads what it shows without waiting for MapLibre's worker. What MapLibre was
 * sent is kept too: each flush sends what changed since, however often a feature changed between.
 */
export function createFeatureSet(map: MapLibreMap, sourceId: string): FeatureSet {
  const shown = new Map<string, LocationFeature>();
  const sent = new Map<string, LocationFeature>();
  const changed = new Set<string>();
  const source = () => map.getSource<GeoJSONSource>(sourceId);
  let sentTo = source();

  /** What changed since the last flush, as one diff; from now on, sent. */
  function takeChanges(): GeoJSONSourceDiff {
    const diff = {
      add: [] as LocationFeature[],
      update: [] as GeoJSONFeatureDiff[],
      remove: [] as string[],
    };
    for (const id of changed) {
      const now = shown.get(id);
      const before = sent.get(id);
      if (now === undefined) {
        if (before !== undefined) diff.remove.push(id);
        sent.delete(id);
      } else {
        if (before === undefined) diff.add.push(now);
        else diff.update.push(featureDiff(before, now));
        sent.set(id, now);
      }
    }
    changed.clear();
    return diff;
  }

  return {
    put(feature) {
      shown.set(feature.properties.id, feature);
      changed.add(feature.properties.id);
    },
    restyle(properties) {
      const feature = shown.get(properties.id);
      if (feature === undefined) return;
      shown.set(properties.id, { ...feature, properties });
      changed.add(properties.id);
    },
    remove(id) {
      if (shown.delete(id)) changed.add(id);
    },
    featureOf: (id) => shown.get(id),
    flush() {
      if (changed.size === 0) return undefined;
      const diff = takeChanges();
      const target = source();
      return target === sentTo ? target?.updateData(diff) : undefined;
    },
    isReplaced: () => source() !== sentTo,
    resendIfReplaced() {
      const target = source();
      if (target === sentTo || target === undefined) return undefined;
      sentTo = target;
      changed.clear();
      sent.clear();
      for (const [id, feature] of shown) sent.set(id, feature);
      return target.setData({ type: "FeatureCollection", features: [...shown.values()] });
    },
  };
}

/**
 * A feature MapLibre has going from `before` to `after`: its geometry when it is another, and its
 * properties, a style field left out dropped. An update, which MapLibre applies in order with the
 * others; not `removeAllProperties`, which its worker applies alone, dropping what the diff adds.
 */
function featureDiff(before: LocationFeature, after: LocationFeature): GeoJSONFeatureDiff {
  const removeProperties = Object.keys(before.properties).filter(
    (key) => !(key in after.properties),
  );
  const addOrUpdateProperties = Object.entries(after.properties).map(([key, value]) => ({
    key,
    value,
  }));
  const diff = { id: after.properties.id, removeProperties, addOrUpdateProperties };
  return after.geometry === before.geometry ? diff : { ...diff, newGeometry: after.geometry };
}

/** The features maplace sends MapLibre, by source. */
export interface FeatureSets {
  readonly pins: FeatureSet;
  readonly shapes: FeatureSet;
}

/** Sends every set's changes; resolves once MapLibre has them, none when nothing was sent. */
export function flushAll(features: FeatureSets): Promise<void> | undefined {
  return settledAll(eachSet(features).map((set) => set.flush()));
}

/** Whether a restyle took a source of maplace's away, or put one back. */
export function anyReplaced(features: FeatureSets): boolean {
  return eachSet(features).some((set) => set.isReplaced());
}

/** After a restyle: every set whose source was put back gets all its features again. */
export function resendReplaced(features: FeatureSets): Promise<void> | undefined {
  return settledAll(eachSet(features).map((set) => set.resendIfReplaced()));
}

function eachSet({ pins, shapes }: FeatureSets): FeatureSet[] {
  return [pins, shapes];
}

function settledAll(sending: readonly (Promise<void> | undefined)[]): Promise<void> | undefined {
  const sent = sending.filter((promise) => promise !== undefined);
  return sent.length === 0 ? undefined : Promise.all(sent).then(() => {});
}
