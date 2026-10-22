import Supercluster from "supercluster";
import type { LatLng } from "../geometry";

/** A marker as the index groups it: its id and where it is. */
export interface ClusterPoint {
  readonly id: string;
  readonly at: LatLng;
}

/** A cluster at one zoom: supercluster's id for it, where it is drawn, how many it holds. */
export interface ClusterGroup {
  readonly id: number;
  readonly at: LatLng;
  readonly count: number;
}

/** How the points group at one zoom: the clusters, and the ids drawn alone. */
export interface Grouping {
  readonly clusters: readonly ClusterGroup[];
  readonly alone: ReadonlySet<string>;
}

/** No point grouped: nothing clustered, nothing alone. */
export const NO_GROUPS: Grouping = { clusters: [], alone: new Set() };

export interface ClusterIndex {
  /** How the points group at maplace's whole `zoom` (`clusterZoomOf`), over the whole world. */
  groupsAt(zoom: number): Grouping;
  /** The maplace zoom at which cluster `id` of the last grouping splits. */
  expansionZoom(id: number): number;
}

/**
 * Google's clusterer's settings (`@googlemaps/markerclusterer`'s `SuperClusterAlgorithm`, its
 * defaults): on Google's zoom, which is maplace's, so the same clusters show at the same view on
 * either map.
 */
const GOOGLE_CLUSTERER_SETTINGS = { radius: 60, maxZoom: 16 } as const;

/** The whole world, where Google's clusterer groups too. */
const WORLD: GeoJSON.BBox = [-180, -90, 180, 90];

interface PointProperties {
  readonly id: string;
}

type IndexedFeature = Supercluster.ClusterFeature<Supercluster.AnyProps> | PointFeature;
type PointFeature = Supercluster.PointFeature<PointProperties>;

/** The points indexed for grouping at any zoom, as Google's clusterer groups them. */
export function indexClusters(points: readonly ClusterPoint[]): ClusterIndex {
  const index = new Supercluster<PointProperties>(GOOGLE_CLUSTERER_SETTINGS);
  index.load(points.map(pointFeature));
  return {
    groupsAt(zoom) {
      const clusters: ClusterGroup[] = [];
      const alone = new Set<string>();
      for (const feature of index.getClusters(WORLD, zoom) as IndexedFeature[]) {
        if ("cluster" in feature.properties) {
          const { cluster_id: id, point_count: count } = feature.properties;
          clusters.push({ id, at: latLngOf(feature), count });
        } else alone.add(feature.properties.id);
      }
      return { clusters, alone };
    },
    expansionZoom: (id) => index.getClusterExpansionZoom(id),
  };
}

function pointFeature({ id, at }: ClusterPoint): PointFeature {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [at.lng, at.lat] },
    properties: { id },
  };
}

function latLngOf({ geometry }: GeoJSON.Feature<GeoJSON.Point>): LatLng {
  const [lng = Number.NaN, lat = Number.NaN] = geometry.coordinates;
  return { lat, lng };
}
