import { isInBox } from "../adapter-kit/cluster-box";
import { type Placement, placementOf } from "../adapter-kit/placement";
import {
  type ClusterGroup,
  type ClusterIndex,
  type ClusterPoint,
  type Grouping,
  indexClusters,
  NO_GROUPS,
} from "./cluster-index";
import { createClusterMarkers } from "./cluster-markers";
import { clusterBoxOf, clusterZoomOf } from "./cluster-view";
import type { ClusteringFactory, ClusterMember } from "./clustering";
import { lngLatOf, toMapLibreZoom } from "./conversions";

/**
 * Markers grouped by supercluster as Google's clusterer groups them (`cluster-index`): a hidden
 * one in no cluster, the selected one alone (`placementOf`). The index is built again at most once
 * per diff or presentation, when what it clusters changed (`flush`), and grouped again when the
 * camera settles at another rounded zoom. A member folded into a cluster draws nothing; the
 * clusters are maplace's DOM markers, only those in and around the view on the page.
 */
export const clusteredMarkers: ClusteringFactory = (map, maplibre) => {
  const placements = new Map<ClusterMember, Placement>();
  const clustered = new Set<ClusterMember>();
  /** What is clustered, or where, changed since the index was built. */
  let stale = false;
  let index: ClusterIndex = indexClusters([]);
  let grouping: Grouping = NO_GROUPS;
  let groupedAt: number | undefined;
  const markers = createClusterMarkers({ map, maplibre }, zoomInto);

  function zoomInto(group: ClusterGroup, event: Event): void {
    const zoom = toMapLibreZoom(index.expansionZoom(group.id));
    map.easeTo({ center: lngLatOf(group.at), zoom }, { originalEvent: event });
  }

  /** Groups the clustered members at the camera's zoom; whether any was folded or unfolded. */
  function regroup(): boolean {
    if (stale) {
      index = indexClusters([...clustered].map(pointOf));
      stale = false;
    }
    groupedAt = clusterZoomOf(map);
    grouping = index.groupsAt(groupedAt);
    let changed = false;
    for (const member of clustered) {
      changed = (grouping.alone.has(member.id) ? member.unfold() : member.fold()) || changed;
    }
    showClustersInView();
    return changed;
  }

  function leaveClusters(member: ClusterMember): void {
    clustered.delete(member);
    stale = true;
    member.unfold();
  }

  function joinClusters(member: ClusterMember, previous: Placement | undefined): void {
    clustered.add(member);
    stale = true;
    if (joinsFolded(previous)) member.fold();
  }

  function showClustersInView(): void {
    const box = clusterBoxOf(map);
    markers.show(grouping.clusters.filter((group) => isInBox(group.at, box)));
  }

  return {
    place(member, { visible, state }) {
      const placement = placementOf(visible, state);
      const previous = placements.get(member);
      if (previous === placement) return;
      placements.set(member, placement);
      if (previous === "clustered") leaveClusters(member);
      if (placement === "clustered") joinClusters(member, previous);
    },
    moved(member) {
      stale = clustered.has(member) || stale;
    },
    remove(member) {
      placements.delete(member);
      stale = clustered.delete(member) || stale;
    },
    flush() {
      if (stale) regroup();
    },
    cameraSettled() {
      // Stale only between a diff's chunks: its flush regroups at the camera's zoom then.
      if (stale) return false;
      if (clusterZoomOf(map) !== groupedAt) return regroup();
      showClustersInView();
      return false;
    },
    release() {
      markers.release();
      placements.clear();
      clustered.clear();
      grouping = NO_GROUPS;
    },
  };
};

/**
 * A member joining the clusters from anything but standing alone (new, or hidden before) is folded
 * at once: thousands of new markers are never drawn only to be folded at the flush. One standing
 * alone (deselected) stays drawn until the flush groups it.
 */
function joinsFolded(previous: Placement | undefined): boolean {
  return previous !== "alone";
}

function pointOf(member: ClusterMember): ClusterPoint {
  return { id: member.id, at: member.at() };
}
