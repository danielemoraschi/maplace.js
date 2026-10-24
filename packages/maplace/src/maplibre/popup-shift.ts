/** Space kept between a popup panned into view and the map's edge or a control, as Google keeps. */
export const MARGIN = 16;

/** A box on the page, as `getBoundingClientRect` gives one. */
export type Box = Pick<DOMRectReadOnly, "left" | "top" | "right" | "bottom">;
/** How far to pan the view: `panBy`'s offset. */
export type Shift = readonly [x: number, y: number];

type Axis = "x" | "y";
/** The shifts along one axis from `low` to `high`. */
interface ShiftRange {
  readonly low: number;
  readonly high: number;
}
type Ranges = Readonly<Record<Axis, ShiftRange>>;

const SIDES = { x: ["left", "right"], y: ["top", "bottom"] } as const;

/** A control a corner shows, and whether a popup may cover it when nothing else leaves room. */
export interface ShownControl {
  readonly box: Box;
  readonly coverable: boolean;
}

/**
 * The pan bringing `box` into `room` clear of `controls`; clear of all but the coverable ones when
 * no pan clears them all; inside `room` only, as a last resort. None for a room of no size.
 */
export function panShift(
  box: Box,
  room: Box,
  controls: readonly ShownControl[],
): Shift | undefined {
  if (room.right <= room.left || room.bottom <= room.top) return undefined;
  const needed = controls.filter((control) => !control.coverable);
  const clearOf = (shown: readonly ShownControl[]) =>
    shiftClear(
      box,
      room,
      shown.map((control) => control.box),
    );
  return (
    clearOf(controls) ??
    (needed.length < controls.length ? clearOf(needed) : undefined) ??
    shiftInside(box, room)
  );
}

/**
 * The least shift putting `box` inside `room` and clear of every one of `controls`, each by
 * MARGIN; none when no shift does.
 */
export function shiftClear(box: Box, room: Box, controls: readonly Box[]): Shift | undefined {
  const inside = insideShifts(box, room);
  const blocked = controls.map((control) => blockingShifts(box, control));
  let least: Shift | undefined;
  const ys = candidateShifts(inside, blocked, "y");
  for (const x of candidateShifts(inside, blocked, "x")) {
    for (const y of ys) {
      const shift = [x, y] as const;
      if (isClear(shift, inside, blocked) && (!least || Math.hypot(x, y) < Math.hypot(...least)))
        least = shift;
    }
  }
  return least;
}

/** The shifts worth trying along `axis`: none, then every range's ends, where the least lies. */
function candidateShifts(inside: Ranges, blocked: readonly Ranges[], axis: Axis): number[] {
  const ends = [inside, ...blocked].flatMap((ranges) => [ranges[axis].low, ranges[axis].high]);
  return [0, ...ends];
}

/** Whether `shift` keeps the box inside the room and, on one axis at least, off each control. */
function isClear([x, y]: Shift, inside: Ranges, blocked: readonly Ranges[]): boolean {
  const within = (shift: number, { low, high }: ShiftRange) => shift >= low && shift <= high;
  const off = (shift: number, { low, high }: ShiftRange) => shift <= low || shift >= high;
  return (
    within(x, inside.x) &&
    within(y, inside.y) &&
    blocked.every((ranges) => off(x, ranges.x) || off(y, ranges.y))
  );
}

/** The shifts keeping `box` inside `room` by MARGIN: the view moves, so the box goes the other way. */
function insideShifts(box: Box, room: Box): Ranges {
  return alongBoth(box, room, (start, end, min, max) => ({
    low: end - max + MARGIN,
    high: start - min - MARGIN,
  }));
}

/** The shifts putting `box` within MARGIN of `control`, open at both ends. */
function blockingShifts(box: Box, control: Box): Ranges {
  return alongBoth(box, control, (start, end, from, to) => ({
    low: start - to - MARGIN,
    high: end - from + MARGIN,
  }));
}

/** `range` of `box`'s sides against `other`'s, along each axis. */
function alongBoth(
  box: Box,
  other: Box,
  range: (start: number, end: number, from: number, to: number) => ShiftRange,
): Ranges {
  const along = (axis: Axis) => {
    const [start, end] = SIDES[axis];
    return range(box[start], box[end], other[start], other[end]);
  };
  return { x: along("x"), y: along("y") };
}

/** The shift putting `box` inside `room`, as far as it fits: its top and left edges first. */
function shiftInside(box: Box, room: Box): Shift {
  return [
    shiftInto(box.left, box.right, room.left, room.right),
    shiftInto(box.top, box.bottom, room.top, room.bottom),
  ];
}

/** How far to move the view along one axis so `[start, end]` sits inside `[min, max]`. */
function shiftInto(start: number, end: number, min: number, max: number): number {
  if (start < min + MARGIN) return start - min - MARGIN;
  if (end > max - MARGIN) return Math.min(end - max + MARGIN, start - min - MARGIN);
  return 0;
}
