import type { Map as MapLibreMap } from "maplibre-gl";
import { isOwnSource, OWN_SOURCES } from "./layers";
import { hasMapSize } from "./map-size";
import type { MountedMapLibre } from "./mounted-map";

/** The longest an `apply` waits for MapLibre to render: a map repainting every frame never idles. */
const DRAW_WAIT_MS = 1000;

/** Resolves once `signal` is aborted: a closed map settles nothing, so every wait races it. */
export function whenAborted(signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) =>
    signal.addEventListener("abort", () => resolve(), { once: true }),
  );
}

/**
 * Resolves once MapLibre has rendered what was `sent`: it has the data, maplace's sources are loaded
 * and it has placed what they hold (its `idle`), so a click finds a pin added. At once when there
 * is nothing to draw on (no size, or a hidden page, where no frame renders), and at the latest
 * when the map closes, the page is hidden, or after `DRAW_WAIT_MS`. Whatever it listened to, it
 * stops listening to when it resolves.
 */
export async function untilRendered(mounted: MountedMapLibre, sent: Promise<void>): Promise<void> {
  const { map, closing } = mounted;
  const document = map.getContainer().ownerDocument;
  const done = new AbortController();
  const { signal } = done;
  const timer = setTimeout(() => done.abort(), DRAW_WAIT_MS);
  const hidden = () => {
    if (document.hidden) done.abort();
  };
  closing.addEventListener("abort", () => done.abort(), { signal });
  document.addEventListener("visibilitychange", hidden, { signal });
  try {
    await Promise.race([renderedOn(map, sent, { document, signal }), whenAborted(signal)]);
  } finally {
    clearTimeout(timer);
    done.abort();
  }
}

async function renderedOn(
  map: MapLibreMap,
  sent: Promise<void>,
  { document, signal }: { readonly document: Document; readonly signal: AbortSignal },
): Promise<void> {
  await sent;
  if (signal.aborted || !hasMapSize(map) || document.hidden) return;
  await ownSourcesLoaded(map, signal);
  await idle(map, signal);
}

/** Resolves once maplace's sources have loaded what they were given; a source gone counts. */
function ownSourcesLoaded(map: MapLibreMap, signal: AbortSignal): Promise<void> {
  const loaded = () =>
    OWN_SOURCES.every((id) => map.getSource(id) === undefined || map.isSourceLoaded(id));
  if (loaded()) return Promise.resolve();
  const ownLoaded = (event: object) =>
    "sourceId" in event &&
    typeof event.sourceId === "string" &&
    isOwnSource(event.sourceId) &&
    loaded();
  return nextEvent(map, "sourcedata", ownLoaded, signal);
}

/** Resolves at the map's next `idle`, a repaint asked for so one comes. */
function idle(map: MapLibreMap, signal: AbortSignal): Promise<void> {
  const settled = nextEvent(map, "idle", () => true, signal);
  map.triggerRepaint();
  return settled;
}

/** Resolves at the map's next `type` event `accepts`, or when `signal` aborts, then stops listening. */
function nextEvent(
  map: MapLibreMap,
  type: "sourcedata" | "idle",
  accepts: (event: object) => boolean,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) return Promise.resolve();
  return new Promise((resolve) => {
    const finish = () => {
      map.off(type, heard);
      resolve();
    };
    const heard = (event: object) => {
      if (accepts(event)) finish();
    };
    map.on(type, heard);
    signal.addEventListener("abort", finish, { once: true });
  });
}
