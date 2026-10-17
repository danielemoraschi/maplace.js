import { describe, expect, it } from "vitest";
import type { Capability } from "../../adapter";
import type { Drawable } from "../../drawable";
import type { Geometry } from "../../geometry";
import {
  adding,
  circleDrawable,
  holeCornerMoved,
  markerDrawable,
  ORIGIN,
  polygonDrawable,
  reshaped,
  updating,
} from "./fixtures";
import { mountSubject } from "./harness";
import type { ConformanceSubject, Supports } from "./subject";

/** A location type a user can edit, and one edit a user could make to it. */
interface EditCase {
  readonly name: string;
  /** What the type needs besides `edit`. */
  readonly needs?: Capability;
  readonly drawable: Drawable;
  readonly edited: Geometry;
}

const CASES: readonly EditCase[] = [
  { name: "marker", drawable: markerDrawable("e"), edited: { type: "marker", lat: 3, lng: 4 } },
  {
    name: "circle",
    needs: "circle",
    drawable: circleDrawable("e"),
    edited: { type: "circle", center: ORIGIN, radius: 2000 },
  },
  {
    name: "polygon",
    drawable: polygonDrawable("e"),
    edited: holeCornerMoved(),
  },
];

/** Drags and edits on the map, reported for the store to write back (G3). */
export function editingChecks(subject: ConformanceSubject, supports: Supports): void {
  describe("editing", () => {
    for (const edit of CASES) {
      const drawn = edit.needs === undefined || supports.has(edit.needs);
      describe.runIf(drawn)(`a ${edit.name}`, () =>
        caseChecks(subject, { edit, editable: supports.has("edit") }),
      );
    }
  });
}

function caseChecks(
  subject: ConformanceSubject,
  { edit, editable }: { readonly edit: EditCase; readonly editable: boolean },
): void {
  const { name, edited } = edit;
  const drawable = { ...edit.drawable, editable: true };
  const { id } = drawable;

  it.runIf(editable)(`reports where an edit left an editable ${name}`, async () => {
    const { adapter, probe, host } = await mountSubject(subject);
    await adapter.apply(adding(drawable));
    probe.drag(id, edited);
    expect(host.reportsOf("reportLocationChange")).toEqual([[id, edited]]);
  });

  it.runIf(editable)(
    `takes the store's write-back of an edited ${name} without moving it or reporting again`,
    async () => {
      const { adapter, probe, host } = await mountSubject(subject);
      await adapter.apply(adding(drawable));
      probe.drag(id, edited);
      // The store writes back a copy, as it freezes what it keeps.
      await adapter.apply(updating(reshaped(drawable, structuredClone(edited))));
      await probe.settle();
      expect(host.reportsOf("reportLocationChange")).toEqual([[id, edited]]);
      expect(probe.location(id)?.geometry).toEqual(edited);
    },
  );

  it(`doesn't let a ${name} that isn't editable be changed`, async () => {
    const { adapter, probe, host } = await mountSubject(subject);
    await adapter.apply(adding(edit.drawable));
    probe.drag(id, edited);
    expect(host.reportsOf("reportLocationChange")).toEqual([]);
    expect(probe.location(id)?.geometry).toEqual(edit.drawable.geometry);
  });
}
