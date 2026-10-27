import {
  type AlgorithmInput,
  SuperClusterViewportAlgorithm,
  type SuperClusterViewportOptions,
  type SuperClusterViewportState,
} from "@googlemaps/markerclusterer";
import { isInside, isWholeWorld, paddedView, WHOLE_WORLD } from "./cluster-view";

/**
 * The last list read, while none is: the library reads a list again only when it differs from the
 * last (`deepEqual`), and no list equals `null`, not even an empty one, which `[]` would (M38).
 * Only the library's `calculate` reads it, comparing before it copies: nothing else may.
 */
const NO_LIST_READ = null as never;

/**
 * Google's clustering of the view and half a view around it, so markers off screen stay off the
 * map; it reads the markers' positions again only when its list changes, or after a move.
 */
export class ClusteringAlgorithm extends SuperClusterViewportAlgorithm {
  /** Read nothing yet: the first render loads its list, an empty one too, and clusters it. */
  constructor(options: SuperClusterViewportOptions) {
    super(options);
    this.forgetPositions();
  }

  /**
   * A marker moved: the next render reads every position again and draws, whatever its list.
   * Otherwise an empty list after the move would keep the old clusters on the map.
   */
  forgetPositions(): void {
    this.markers = NO_LIST_READ;
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
