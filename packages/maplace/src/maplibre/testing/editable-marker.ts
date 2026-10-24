import { expect } from "vitest";
import type { Drawable } from "../../drawable";
import type { Geometry } from "../../geometry";
import { adding, markerDrawable, ORIGIN } from "../../testing/conformance/fixtures";
import type { RecordingHost } from "../../testing/conformance/recording-host";
import { mountedMapLibre } from "./mounted";
import { domMarkerOf, placedMarker } from "./placed-markers";

/** An editable marker `a` at the origin, on a map zoomed in on it. */
export async function withEditableMarker(overrides?: Partial<Drawable>) {
  const mounted = await mountedMapLibre();
  mounted.adapter.setView({ kind: "center", center: ORIGIN, zoom: 6 });
  await mounted.adapter.apply(
    adding(markerDrawable("a", ORIGIN, { editable: true, ...overrides })),
  );
  await mounted.probe.settle();
  return mounted;
}

/** `withEditableMarker` drawn in the DOM, with its marker and the drawable it shows now. */
export async function editingMarker(overrides?: Partial<Drawable>) {
  const mounted = await withEditableMarker(overrides);
  const marker = domMarkerOf(mounted.state, "a");
  const drawn = () => placedMarker(mounted.state, "a").drawable();
  return { ...mounted, marker, drawn };
}

/** The change reported once, and the last edit where it ended. */
export function expectOneChangeEndingTheEdits(host: RecordingHost): void {
  const changes = host.reportsOf("reportLocationChange");
  expect(changes).toHaveLength(1);
  const lastEdit = host.reportsOf("reportLocationEdit").at(-1);
  expect(lastEdit?.[1] as Geometry).toEqual(changes[0]?.[1]);
}
