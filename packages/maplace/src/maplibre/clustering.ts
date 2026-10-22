import type { Map as MapLibreMap } from "maplibre-gl";
import type { Look } from "../adapter-kit/presentation-changes";
import { MaplaceError } from "../errors";
import type { LatLng } from "../geometry";
import type { MapLibre } from "./library";

/** A marker as clustering sees it: where it is, and how to draw it folded or alone. */
export interface ClusterMember {
  readonly id: string;
  at(): LatLng;
  /** Folded into a cluster: nothing of it is drawn. Returns whether it was drawn until now. */
  fold(): boolean;
  /** Drawn on its own again. Returns whether it was folded until now. */
  unfold(): boolean;
}

/** How a map groups its markers, fixed when it opens: not at all, or into clusters. */
export interface Clustering {
  /** Puts the member where its look says: in no cluster, alone, or clustered (RFC rules). */
  place(member: ClusterMember, look: Look): void;
  moved(member: ClusterMember): void;
  remove(member: ClusterMember): void;
  /** Regroups once what is clustered changed since the last flush: after a diff, or a presentation. */
  flush(): void;
  /**
   * The camera settled (`moveend`): regroups at a new rounded zoom, else re-shows the clusters in
   * view; nothing between a diff's chunks, whose flush regroups. Its folds and unfolds are only
   * recorded in the feature sets: the caller sends them.
   * Returns whether it folded or unfolded any marker, so the caller sends nothing otherwise.
   */
  cameraSettled(): boolean;
  /** Lets go of the map, its clusters and listeners: last, once the parts let go of their markers. */
  release(): void;
}

export type ClusteringFactory = (map: MapLibreMap, maplibre: MapLibre) => Clustering;

const NONE: Clustering = {
  place() {},
  moved() {},
  remove() {},
  flush() {},
  cameraSettled: () => false,
  release() {},
};

/** Every marker on its own: a map that doesn't cluster. */
export const noClustering: ClusteringFactory = () => NONE;

/** The clustering a store's `cluster` asks for: the clustered markers, and supercluster, loaded only then. */
export async function loadClustering(cluster: boolean): Promise<ClusteringFactory> {
  if (!cluster) return noClustering;
  const { clusteredMarkers } = await import("./clustered-markers").catch((cause: unknown) => {
    throw new MaplaceError("provider-load-failed", "mount: maplace's clustering failed to load", {
      cause,
    });
  });
  return clusteredMarkers;
}
