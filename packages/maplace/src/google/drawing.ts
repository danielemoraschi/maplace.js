import type { LocationDiff } from "../adapter";
import { inChunks } from "../adapter-kit/chunks";
import { createDiffQueue, type DiffQueue } from "../adapter-kit/diff-queue";
import type { Drawable } from "../drawable";
import { MaplaceError } from "../errors";
import type { GoogleMapState } from "./map-state";
import type { MapPart } from "./mounted-map";
import type { Placers, PlacingSite } from "./placed-location";
import { createPlacingSite } from "./placing-site";

/** Locations placed between yields to the event loop. */
const CHUNK_SIZE = 250;

/** The adapter's `apply`, and the part that readies placing on the open map. */
export interface Drawing extends DiffQueue {
  readonly part: MapPart;
}

/**
 * Places each location with the placer for its type, in chunks, one diff after another however
 * long one takes. Nothing is placed before the map opens or after it closes.
 */
export function createDrawing(state: GoogleMapState, placers: Placers): Drawing {
  let site: PlacingSite | undefined;

  async function draw({ added, updated, removed }: LocationDiff): Promise<void> {
    const drawingOn = site;
    if (drawingOn === undefined) return;
    const stopped = () => site !== drawingOn;
    // Removals first, in chunks too: Google takes a clickable marker off a crowded map slowly.
    await inChunks(removed, { size: CHUNK_SIZE, each: remove, stopped });
    await inChunks([...added, ...updated], {
      size: CHUNK_SIZE,
      each: (drawable) => place(drawable, drawingOn),
      stopped,
    });
    // Once per diff: clustering every marker again is one pass, however many changed.
    if (!stopped()) drawingOn.mounted.markers.flush();
  }

  function place(drawable: Drawable, on: PlacingSite): void {
    const placed = state.placed.get(drawable.id);
    if (placed) {
      placed.update(drawable);
      return;
    }
    state.placed.set(drawable.id, placers[drawable.geometry.type](drawable, on));
  }

  function remove(id: string): void {
    state.placed.get(id)?.remove();
    state.placed.delete(id);
  }

  function removeAll(): void {
    const all = [...state.placed.values()];
    state.placed.clear();
    for (const placed of all) placed.remove();
  }

  function reportFailure(cause: unknown): void {
    const message = "apply: Google Maps failed to draw the locations";
    site?.mounted.live()?.reportError(new MaplaceError("provider-load-failed", message, { cause }));
  }

  return {
    ...createDiffQueue(draw, reportFailure),
    part: {
      open(mounted) {
        site = createPlacingSite(mounted, state);
        mounted.onDestroy(() => {
          site = undefined;
          removeAll();
        });
      },
    },
  };
}
