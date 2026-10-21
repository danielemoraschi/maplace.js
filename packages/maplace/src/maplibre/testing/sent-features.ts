import type {
  GeoJSONFeatureDiff,
  GeoJSONSource,
  GeoJSONSourceDiff,
  Map as MapLibreMap,
} from "maplibre-gl";
import type { LocationFeature, LocationProperties } from "../feature-set";
import { isOwnSource } from "../layers";

/** One of maplace's sources as MapLibre was sent it: each feature by its id. */
type SentSource = Map<string, LocationFeature>;

/**
 * What MapLibre was sent for maplace's sources, recorded as it is sent (each source's `setData`
 * and `updateData`, its diffs applied here as MapLibre applies them), never read from the
 * adapter's own record: a change it kept but never sent, sent wrong, or sent to a source a
 * restyle replaced shows.
 */
export interface SentFeatures {
  /** The feature MapLibre was sent for `id`, in the source `sourceId` on the map now. */
  featureOf(sourceId: string, id: string): LocationFeature | undefined;
  /** Gives the map its own `getSource` back: a source looked up from now on isn't recorded. */
  stop(): void;
}

/** Records what `map`'s sources of maplace's are sent, each from when it is first looked up. */
export function recordSentFeatures(map: MapLibreMap): SentFeatures {
  const sent = new WeakMap<GeoJSONSource, SentSource>();
  const getSource = map.getSource.bind(map);
  const recordingGetSource = (sourceId: string) => {
    const source = getSource<GeoJSONSource>(sourceId);
    if (source !== undefined && isOwnSource(sourceId) && !sent.has(source)) {
      sent.set(source, record(source));
    }
    return source;
  };
  map.getSource = recordingGetSource as MapLibreMap["getSource"];
  return {
    featureOf(sourceId, id) {
      const source = getSource<GeoJSONSource>(sourceId);
      return source && sent.get(source)?.get(id);
    },
    stop() {
      if (map.getSource === recordingGetSource) Reflect.deleteProperty(map, "getSource");
    },
  };
}

/** Starts from what the source has now, then follows what it is sent. */
function record(source: GeoJSONSource): SentSource {
  const features = featuresIn(source.serialize().data);
  const setData = source.setData.bind(source);
  const updateData = source.updateData.bind(source);
  source.setData = (data) => {
    features.clear();
    for (const [id, feature] of featuresIn(data)) features.set(id, feature);
    return setData(data);
  };
  source.updateData = (diff) => {
    applyDiff(features, diff);
    return updateData(diff);
  };
  return features;
}

function featuresIn(data: GeoJSON.GeoJSON | string): SentSource {
  const features: SentSource = new Map();
  if (typeof data === "string" || data.type !== "FeatureCollection") return features;
  for (const feature of data.features as LocationFeature[]) {
    features.set(feature.properties.id, feature);
  }
  return features;
}

/** A diff applied as MapLibre's `applySourceDiff` does: removals, additions, then updates. */
function applyDiff(features: SentSource, diff: GeoJSONSourceDiff): void {
  if (diff.removeAll) features.clear();
  else for (const id of diff.remove ?? []) features.delete(String(id));
  for (const feature of (diff.add ?? []) as LocationFeature[]) {
    features.set(feature.properties.id, feature);
  }
  for (const change of diff.update ?? []) {
    const before = features.get(String(change.id));
    if (before !== undefined) features.set(String(change.id), updated(before, change));
  }
}

function updated(before: LocationFeature, change: GeoJSONFeatureDiff): LocationFeature {
  const properties: Record<string, unknown> = change.removeAllProperties
    ? {}
    : { ...before.properties };
  for (const key of change.removeProperties ?? []) delete properties[key];
  for (const { key, value } of change.addOrUpdateProperties ?? []) properties[key] = value;
  return {
    ...before,
    geometry: change.newGeometry ?? before.geometry,
    properties: properties as unknown as LocationProperties,
  };
}
