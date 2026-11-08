// Compile-time checks of `@maplacejs/maplace/testing`: each @ts-expect-error must stay an error.
import type { Adapter } from "@maplacejs/maplace";
import type * as kit from "@maplacejs/maplace/testing";
import {
  type ConformanceGroup,
  type ConformanceSubject,
  describeConformance,
  frontFirst,
  HOVERED_LOOK,
  type LocationOnMap,
  type MapProbe,
  ORIGIN_DOT_CLASS,
  SELECTED_LINE_LOOK,
  SELECTED_LOOK,
  type ShownPopup,
  type StackedLocation,
} from "@maplacejs/maplace/testing";
import { expectTypeOf } from "vitest";

declare const adapter: Adapter;
declare const probe: MapProbe;

const subject: ConformanceSubject = {
  name: "mine",
  groups: ["declarations", "lifecycle"],
  create: () => ({ adapter, probe }),
};
describeConformance(subject);

export const order: string[] = frontFirst([{ id: "a", isMarker: true, stack: 0 }]);
export const looks = [SELECTED_LOOK, SELECTED_LINE_LOOK, HOVERED_LOOK];
export const dotClass: string = ORIGIN_DOT_CLASS;
export const seen: LocationOnMap | undefined = probe.location("a");
export const popup: ShownPopup | undefined = probe.shownPopup();

// @ts-expect-error a group the suite doesn't have
export const unknownGroup: ConformanceSubject = { ...subject, groups: ["everything"] };

// @ts-expect-error a probe must see and drive the whole map
export const partialProbe: MapProbe = { locationIds: () => [] };

// What it exports at run time, and nothing else: the fake, fixtures and harness stay private.
expectTypeOf<keyof typeof kit>().toEqualTypeOf<
  | "describeConformance"
  | "frontFirst"
  | "HOVERED_LOOK"
  | "ORIGIN_DOT_CLASS"
  | "SELECTED_LINE_LOOK"
  | "SELECTED_LOOK"
>();

export const group: ConformanceGroup = "origin";
export const stacked: StackedLocation = { id: "a", isMarker: false, stack: 1 };
