import type { LocationDiff } from "../adapter";
import { inChunks } from "../adapter-kit/chunks";
import { createDiffQueue, type DiffQueue } from "../adapter-kit/diff-queue";
import type { HoverReports } from "../adapter-kit/hover-reports";
import type { Drawable } from "../drawable";
import {
  anyReplaced,
  createFeatureSet,
  type FeatureSets,
  flushAll,
  resendReplaced,
} from "./feature-set";
import { addLayers, PIN_SOURCE, removeLayers, SHAPE_SOURCE } from "./layers";
import { drawFailure } from "./map-errors";
import type { MapLibreState } from "./map-state";
import { untilRendered } from "./map-waits";
import type { MapPart, MountedMapLibre } from "./mounted-map";
import type { Placer, Placers, PlacingSite } from "./placed-location";
import { createPlacingSite } from "./placing-site";

/** Locations placed between yields to the event loop. */
const CHUNK_SIZE = 250;

/** The adapter's `apply`, and the part that readies placing on the open map. */
export interface Drawing extends DiffQueue {
  readonly part: MapPart;
  /** Resolves once MapLibre has rendered the last batch the diffs sent, or can't. */
  rendered(): Promise<void>;
  /** The open map's one hover, which every location reports through; none while it's closed. */
  hover(): HoverReports | undefined;
}

/**
 * Places each location with the placer for its type, in chunks, one diff after another however
 * long one takes, and sends MapLibre each diff's features in one batch. A diff counts as drawn
 * (`drawnThrough`) once placed, so what waits on it never waits on MapLibre; `rendered()` waits
 * for MapLibre to render the last batch sent. Nothing is placed before the map opens or after it
 * closes.
 */
export function createDrawing(state: MapLibreState, placers: Placers): Drawing {
  let site: PlacingSite | undefined;
  /** MapLibre taking the last batch sent, until an `apply` has waited for it to be rendered. */
  let unrendered: Promise<void> | undefined;

  async function draw({ added, updated, removed }: LocationDiff): Promise<void> {
    const drawingOn = site;
    if (drawingOn === undefined) return;
    const stopped = () => site !== drawingOn;
    await inChunks(removed, { size: CHUNK_SIZE, each: remove, stopped });
    await inChunks([...added, ...updated], {
      size: CHUNK_SIZE,
      each: (drawable) => place(drawable, drawingOn),
      stopped,
    });
    if (!stopped()) unrendered = flushAll(drawingOn.features) ?? unrendered;
  }

  function place(drawable: Drawable, on: PlacingSite): void {
    const placed = state.placed.get(drawable.id);
    if (placed) placed.update(drawable);
    else state.placed.set(drawable.id, placerFor(drawable, placers)(drawable, on));
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
    site?.mounted.live()?.reportError(drawFailure(cause));
  }

  /** Waits for the batch sent last to be rendered, once; at once when nothing was sent since. */
  function rendered(): Promise<void> {
    const batch = unrendered;
    unrendered = undefined;
    if (batch === undefined || state.mounted === undefined) return Promise.resolve();
    return untilRendered(state.mounted, batch);
  }

  function open(mounted: MountedMapLibre): void {
    const { map } = mounted;
    addLayers(map);
    const features: FeatureSets = {
      pins: createFeatureSet(map, PIN_SOURCE),
      shapes: createFeatureSet(map, SHAPE_SOURCE),
    };
    state.features = features;
    site = createPlacingSite(mounted, state, features);
    // A page restyling its own map takes maplace's sources off with its old style, or puts back
    // copies kept from it (`transformStyle`): once the new style is in (`styledata`, for a style
    // loaded anew or applied as a diff), the layers go back on and the sources get every feature.
    const restyled = () => {
      if (!anyReplaced(features) || map.getStyle() === undefined) return;
      addLayers(map);
      unrendered = resendReplaced(features) ?? unrendered;
    };
    map.on("styledata", restyled);
    mounted.onDestroy(() => {
      map.off("styledata", restyled);
      site = undefined;
      removeAll();
      state.features = undefined;
      removeLayers(map);
    });
  }

  return {
    ...createDiffQueue(draw, reportFailure),
    part: { open },
    rendered,
    hover: () => site?.hover,
  };
}

/** The placer for the drawable's type: the store never sends a type the adapter doesn't declare. */
function placerFor({ geometry }: Drawable, placers: Placers): Placer {
  return placers[geometry.type];
}
