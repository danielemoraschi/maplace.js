import type { ControlPosition } from "../adapter";

/** The space MapLibre's stylesheet keeps around its corners' controls, kept between corners too. */
export const CORNER_MARGIN = 10;

/** Where something spans across the map, in px from its left edge. */
export interface Span {
  readonly left: number;
  readonly right: number;
}

/** An element a corner holds: its span, and how far its top rises above the corner's bottom edge. */
export interface Held extends Span {
  readonly rise: number;
}

/** What a corner holds, as laid out now. */
export interface CornerContent extends Span {
  /** The corner's box, its elements' margins included. */
  readonly height: number;
  /** Its shown elements. */
  readonly held: readonly Held[];
  /** Whether a shown maplace panel is among them. */
  readonly holdsPanel: boolean;
  /** Its maplace lists' heights now, summed. */
  readonly listHeight: number;
  /** Each of its lists' height with no limit. */
  readonly naturalListHeights: readonly number[];
}

export type Corners = Readonly<Record<ControlPosition, CornerContent>>;

/** The map's height and what its corners hold. */
export interface CornersOnMap {
  readonly height: number;
  readonly corners: Corners;
}

export interface CornerLayout {
  /** How far the bottom-left corner sits up, clear of what the bottom-right holds under it. */
  readonly lift: number;
  /** The height each of maplace's lists in a corner may take. */
  readonly listRoom: Readonly<Record<ControlPosition, number>>;
}

/** An element of a bottom corner, and where its top is from the map's top edge. */
interface Placed extends Span {
  readonly top: number;
}

/**
 * Where maplace's lists stop and how far the bottom-left corner sits up, for the corners as they
 * are now: lists sharing a column of the map share its height fairly (`fairRoom`), a top corner's
 * lists stop short of what the corners below it hold, and a bottom-left corner holding a maplace
 * panel sits above what the bottom-right holds in its column (a phone's attribution).
 */
export function layoutCorners({ height, corners }: CornersOnMap): CornerLayout {
  const lift = liftClearing(corners["bottom-left"], corners["bottom-right"]);
  const below = bottomRowTops(height, lift, corners);
  const topRoomOf = (corner: CornerContent) => topRoom(corner, floorUnder(corner, below, height));
  return {
    lift,
    listRoom: {
      "top-left": topRoomOf(corners["top-left"]),
      "top-right": topRoomOf(corners["top-right"]),
      "bottom-left": bottomRoom(corners["bottom-left"], corners, height),
      "bottom-right": bottomRoom(corners["bottom-right"], corners, height),
    },
  };
}

/** Whether two layouts differ by no more than half a pixel anywhere. */
export function sameLayout(a: CornerLayout, b: CornerLayout): boolean {
  const near = (x: number, y: number) => Math.abs(x - y) <= 0.5;
  const positions = Object.keys(a.listRoom) as ControlPosition[];
  return near(a.lift, b.lift) && positions.every((p) => near(a.listRoom[p], b.listRoom[p]));
}

/**
 * The height each list may take of `free`, the lists `naturals` tall without a limit: those that
 * fit in an even share keep their height, the rest share what is left evenly (max-min fairness).
 */
export function fairRoom(free: number, naturals: readonly number[]): number {
  if (free <= 0) return 0;
  let left = free;
  let count = naturals.length;
  for (const natural of [...naturals].sort((a, b) => a - b)) {
    if (natural > left / count) return left / count;
    left -= natural;
    count -= 1;
  }
  return free;
}

/** The highest element the bottom-right holds in the column of a bottom-left maplace panel. */
function liftClearing(bottomLeft: CornerContent, bottomRight: CornerContent): number {
  if (!bottomLeft.holdsPanel) return 0;
  const under = bottomRight.held.filter((held) => sharesColumn(held, bottomLeft));
  return Math.max(0, ...under.map((held) => held.rise));
}

/** The corners holding anything in `corner`'s column, `corner` included. */
function columnStack(corner: CornerContent, corners: Corners): readonly CornerContent[] {
  return Object.values(corners).filter(
    (other) => other === corner || (other.held.length > 0 && sharesColumn(other, corner)),
  );
}

/**
 * A bottom corner's list room: the column's height less everything fixed its corners hold and
 * one margin, the corners' own margins being in their heights, shared among all their lists.
 */
function bottomRoom(corner: CornerContent, corners: Corners, height: number): number {
  const stack = columnStack(corner, corners);
  const fixed = stack.reduce((sum, each) => sum + fixedHeightOf(each), 0);
  const naturals = stack.flatMap((each) => each.naturalListHeights);
  return fairRoom(height - fixed - CORNER_MARGIN, naturals);
}

/** Where each element of the bottom corners has its top, the bottom-left `lift` up. */
function bottomRowTops(height: number, lift: number, corners: Corners): readonly Placed[] {
  const placed = (base: number) => (held: Held) => ({ ...held, top: base - held.rise });
  return [
    ...corners["bottom-left"].held.map(placed(height - lift)),
    ...corners["bottom-right"].held.map(placed(height)),
  ];
}

/** How far down a top corner may reach: a margin above what is below it in its column. */
function floorUnder(corner: CornerContent, below: readonly Placed[], height: number): number {
  const tops = below.filter((placed) => sharesColumn(placed, corner)).map(({ top }) => top);
  return Math.min(height, ...tops) - CORNER_MARGIN;
}

/** A top corner's list room: down to `floor`, less what else it holds, shared among its lists. */
function topRoom(corner: CornerContent, floor: number): number {
  return fairRoom(floor - fixedHeightOf(corner), corner.naturalListHeights);
}

/** What a corner holds besides maplace's lists, margins included. */
function fixedHeightOf(corner: CornerContent): number {
  return corner.height - corner.listHeight;
}

/** Whether two spans come within a margin of each other across the map. */
function sharesColumn(a: Span, b: Span): boolean {
  return a.left < b.right + CORNER_MARGIN && b.left < a.right + CORNER_MARGIN;
}
