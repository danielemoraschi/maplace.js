import type { ControlPosition } from "../adapter";

/** The space MapLibre's stylesheet keeps around its corners' controls, kept between corners too. */
const CORNER_MARGIN = 10;

/** Where something spans across the map, in px from its left edge. */
export interface Span {
  readonly left: number;
  readonly right: number;
}

/** An element a corner holds: its span, and how far its top rises above the corner's foot. */
export interface Held extends Span {
  readonly rise: number;
}

/** What a corner holds, as laid out now. */
export interface CornerContent extends Span {
  /** What the corner's box holds besides maplace's lists, its elements' margins included. */
  readonly fixedHeight: number;
  /** Its shown elements. */
  readonly held: readonly Held[];
  /** Whether a shown maplace panel is among them. */
  readonly holdsPanel: boolean;
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

/**
 * Where maplace's lists stop and how far the bottom-left corner sits up, for the corners as they
 * are now: lists sharing a column of the map share its height fairly (`fairRoom`), a top corner's
 * lists stop short of what the corners below it hold, and a bottom-left corner holding a maplace
 * panel sits above what the bottom-right holds in its column (a phone's attribution).
 */
export function layoutCorners({ height, corners }: CornersOnMap): CornerLayout {
  const lift = liftClearing(corners["bottom-left"], corners["bottom-right"]);
  const topRoomOf = (corner: CornerContent) =>
    fairRoom(
      floorUnder(corner, corners, height, lift) - corner.fixedHeight,
      corner.naturalListHeights,
    );
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

/**
 * How far the bottom-left corner sits up: as high as the bottom-right's highest element in its
 * column, when it holds a maplace panel.
 */
function liftClearing(bottomLeft: CornerContent, bottomRight: CornerContent): number {
  return bottomLeft.holdsPanel ? Math.max(0, highestIn(bottomRight, bottomLeft)) : 0;
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
  const fixed = stack.reduce((sum, each) => sum + each.fixedHeight, 0);
  const naturals = stack.flatMap((each) => each.naturalListHeights);
  return fairRoom(height - fixed - CORNER_MARGIN, naturals);
}

/**
 * How far down a top corner may reach: a margin above the highest element of the bottom corners
 * in its column, the bottom-left one `lift` up.
 */
function floorUnder(corner: CornerContent, corners: Corners, height: number, lift: number): number {
  const highest = Math.max(
    0,
    lift + highestIn(corners["bottom-left"], corner),
    highestIn(corners["bottom-right"], corner),
  );
  return height - highest - CORNER_MARGIN;
}

/** How far the highest element `corner` holds in `span`'s column rises; -Infinity for none. */
function highestIn({ held }: CornerContent, span: Span): number {
  return Math.max(...held.filter((each) => sharesColumn(each, span)).map(({ rise }) => rise));
}

/** Whether two spans come within a margin of each other across the map. */
function sharesColumn(a: Span, b: Span): boolean {
  return a.left < b.right + CORNER_MARGIN && b.left < a.right + CORNER_MARGIN;
}
