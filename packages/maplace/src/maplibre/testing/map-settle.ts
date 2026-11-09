import type { Map as MapLibreMap } from "maplibre-gl";
import { hasSize, sizeOf } from "../../adapter-kit/map-size";
import { hasMapSize, sizeTakenIn } from "../map-size";
import { RENDER_WAIT } from "./rendered";

/**
 * The longest the probe waits for the map to settle, so a check fails rather than hangs: half the
 * tests' budget for a busy run (a cold map can take seconds to load, T32), so a check polling a
 * settle that waits for the map's idle within that budget still gets a second try and fails on its
 * own assertion.
 */
const SETTLE_WAIT_MS = RENDER_WAIT.timeout / 2;

/**
 * The map watched for moves and resizes: `settled` waits out any since it last settled, and data
 * the map is still loading.
 */
export interface MapWatch {
  settled(): Promise<void>;
  stop(): void;
}

/**
 * Watches the map from the probe's side: a move or a resize leaves it unsettled until its next
 * `idle`, as does data it is still loading (T26). A container resized but not yet taken in
 * (MapLibre observes it at the next frame, then throttles) is waited for first, as the resize it
 * brings is a move too.
 */
export function watchMap(map: MapLibreMap): MapWatch {
  let unsettled = false;
  const moved = () => {
    unsettled = true;
  };
  const idle = () => {
    unsettled = false;
  };
  map.on("moveend", moved);
  map.on("resize", moved);
  map.on("idle", idle);
  return {
    async settled() {
      // A frame first: a container resized just now is observed at the next one.
      await nextFrame();
      await untilSizeTakenIn(map);
      if (!unsettled && !map.isMoving() && !stillLoading(map)) return;
      await idleOrTimeout(map);
      unsettled = false;
    },
    stop() {
      map.off("moveend", moved);
      map.off("resize", moved);
      map.off("idle", idle);
    },
  };
}

/** Resolves once MapLibre's canvas is the container's size, or the container has none. */
async function untilSizeTakenIn(map: MapLibreMap): Promise<void> {
  const started = performance.now();
  while (!sizeMatches(map) && performance.now() - started < SETTLE_WAIT_MS) await nextFrame();
}

/**
 * Whether MapLibre is still loading what it was sent (data a restyle or a selection sent without a
 * wait), so a rendered read now would miss it. A map with no size draws nothing to wait for.
 */
function stillLoading(map: MapLibreMap): boolean {
  return !map.loaded() && hasMapSize(map);
}

function sizeMatches(map: MapLibreMap): boolean {
  return !hasSize(sizeOf(map.getContainer())) || sizeTakenIn(map);
}

/** The map's next `idle`, or `SETTLE_WAIT_MS`: whichever comes first, the other then dropped. */
function idleOrTimeout(map: MapLibreMap): Promise<void> {
  return new Promise((resolve) => {
    const settle = () => {
      clearTimeout(timer);
      map.off("idle", settle);
      resolve();
    };
    const timer = setTimeout(settle, SETTLE_WAIT_MS);
    map.on("idle", settle);
  });
}

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
