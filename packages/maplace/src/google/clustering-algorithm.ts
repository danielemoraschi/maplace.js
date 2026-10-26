import {
  type AlgorithmInput,
  SuperClusterViewportAlgorithm,
  type SuperClusterViewportState,
} from "@googlemaps/markerclusterer";
import { isInside, isWholeWorld, paddedView, WHOLE_WORLD } from "./cluster-view";

/**
 * Google's clustering of the view and half a view around it, so markers off screen stay off the
 * map; it reads the markers' positions again only when its list changes.
 */
export class ClusteringAlgorithm extends SuperClusterViewportAlgorithm {
  /** A marker moved: the next render reads every position again. */
  forgetPositions(): void {
    this.markers = [];
  }

  /**
   * The view and half a view around it (`paddedView`), kept while the view stays inside it at the
   * same zoom, so a short pan clusters and draws nothing again. The whole world is never kept: it
   * may stand for a map with no view yet, and computed again it is the same box anyway. Never the
   * overlay's projection: Google may not have set it yet, and the library's own padding wraps a
   * view showing the world more than once into a box across the antimeridian, losing most markers.
   */
  protected override getViewportState({ map }: AlgorithmInput): SuperClusterViewportState {
    const zoom = Math.round(map.getZoom() ?? 0);
    const bounds = map.getBounds()?.toJSON();
    if (bounds === undefined) return { zoom, view: WHOLE_WORLD };
    if (this.holds(zoom, bounds)) return this.state;
    return { zoom, view: paddedView(bounds) };
  }

  /** Whether the box last clustered, the view's own, still holds `bounds` at `zoom`. */
  private holds(zoom: number, bounds: google.maps.LatLngBoundsLiteral): boolean {
    const { state } = this;
    return state.zoom === zoom && !isWholeWorld(state.view) && isInside(bounds, state.view);
  }
}
