import { createHoverReports } from "../../adapter-kit/hover-reports";
import type { Geometry, LatLng } from "../../geometry";
import { createRecordingHost } from "../../testing/conformance/recording-host";
import type { EditHandle } from "../edit-handles";
import { editShape } from "../edit-session";
import type { MountedMapLibre } from "../mounted-map";

type Listener = () => void;

/** MapLibre's marker as the handles use it, recording what they do to it. */
export class RecordingMarker {
  readonly element: HTMLElement;
  lngLat: LatLng = { lat: Number.NaN, lng: Number.NaN };
  moves = 0;
  removed = false;
  private readonly listeners = new Map<string, Listener[]>();

  constructor({ element }: { element: HTMLElement }) {
    this.element = element;
  }
  setLngLat([lng, lat]: [number, number]) {
    this.lngLat = { lat, lng };
    this.moves += 1;
    return this;
  }
  getLngLat = () => this.lngLat;
  getElement = () => this.element;
  addTo = () => this;
  remove() {
    this.removed = true;
    return this;
  }
  on(type: string, listener: Listener) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
    return this;
  }
  fire(type: string) {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

/** A shape's editing on a stub map, with what it reported and drew. */
export function editingOnStub(geometry: Geometry) {
  const host = createRecordingHost();
  const closed = { value: false };
  const hover = createHoverReports(() => (closed.value ? undefined : host));
  const container = document.createElement("div");
  const mounted = {
    map: { getContainer: () => container },
    maplibre: { Marker: RecordingMarker },
    live: () => (closed.value ? undefined : host),
  } as unknown as MountedMapLibre;
  const drawn: Geometry[] = [];
  const session = editShape(geometry, {
    mounted,
    id: "s",
    hover,
    onEdit: (edited) => drawn.push(edited),
  });
  const markers = () => session.handles().map(markerOf);
  return { session, host, hover, drawn, closed, markers };
}

export const markerOf = (handle: EditHandle) => handle.marker as unknown as RecordingMarker;

/** The handle with `role`'s fields. */
export function handleWith(handles: readonly EditHandle[], role: object): RecordingMarker {
  const found = handles.find((handle) =>
    Object.entries(role).every(
      ([key, value]) => handle.role[key as keyof typeof handle.role] === value,
    ),
  );
  if (found === undefined) throw new Error(`no handle ${JSON.stringify(role)}`);
  return markerOf(found);
}

/** Drags `marker` to `to` and holds it there, not let go. */
export function hold(marker: RecordingMarker, to: LatLng): void {
  marker.fire("dragstart");
  marker.setLngLat([to.lng, to.lat]);
  marker.fire("drag");
}

/** Drags `marker` through `points`, a `drag` at each, and lets go at the last. */
export function drag(marker: RecordingMarker, ...points: LatLng[]): void {
  marker.fire("dragstart");
  for (const { lat, lng } of points) {
    marker.setLngLat([lng, lat]);
    marker.fire("drag");
  }
  marker.fire("dragend");
}
