/// <reference types="google.maps" preserve="true" />
import {
  drawableParts,
  isSplitLine,
  type LinePart,
  type LineParts,
} from "../adapter-kit/line-parts";
import type { Look } from "../adapter-kit/presentation-changes";
import { styleInState } from "../adapter-kit/shape-looks";
import { frontRank } from "../adapter-kit/stacking";
import type { Drawable } from "../drawable";
import { GOOGLE_LINE } from "./dash-icons";
import type { MountedMap } from "./mounted-map";
import { styleValues } from "./shape-style";

/** Two polylines drawing a line's parts at its progress: a split polyline's, or the route's. */
export interface PartLines {
  /** Draws `parts` at `zIndex`, moving the lines already drawn; none takes them off. */
  show(parts: LineParts | undefined, zIndex: number): void;
  /** The line a user sees drawing the line, while on the map: the part ahead, else the part travelled. */
  shown(): google.maps.Polyline | undefined;
  remove(): void;
}

/**
 * Two polylines taking no input, made the first time there are parts and then moved: a slider
 * driving a progress costs no new lines, and a part's style is written again only when it
 * changes. The part travelled first, then the part ahead.
 */
export function partLines({ map, libraries }: MountedMap): PartLines {
  let lines: Readonly<Record<keyof LineParts, DrawnPart>> | undefined;
  const newPart = (): DrawnPart => ({
    line: new libraries.maps.Polyline(),
    writtenLook: undefined,
    writtenPath: undefined,
  });
  return {
    show(parts, zIndex) {
      if (parts === undefined && lines === undefined) return;
      lines ??= { travelled: newPart(), ahead: newPart() };
      showPart(lines.travelled, parts?.travelled, { map, zIndex });
      showPart(lines.ahead, parts?.ahead, { map, zIndex });
    },
    shown: () => [lines?.ahead.line, lines?.travelled.line].find((line) => line?.getMap() != null),
    remove() {
      for (const drawn of Object.values(lines ?? {})) drawn.line.setMap(null);
    },
  };
}

/** A split polyline's parts, drawn over it while it hides its own stroke (`own-stroke.ts`). */
export interface GoogleLineParts {
  /** Draws the parts for the line as it is now, at `rank` at rest, or takes them off. */
  draw(drawable: Drawable, look: Look, rank: number): void;
  /** The part ahead, else the part travelled, while drawn: the line's stroke as a user sees it. */
  shown(): google.maps.Polyline | undefined;
  remove(): void;
}

/**
 * A polyline with a progress, shown, drawn in two parts: its travelled part in its travelled look
 * and the part ahead in its look, both taking no input, so the line itself, its stroke hidden but
 * its width kept, takes the pointer. They stack where it does, and in front while it is hovered or
 * selected (`frontRank`), where Google draws no outline copy for a split line.
 */
export function googleLineParts(mounted: MountedMap): GoogleLineParts {
  const lines = partLines(mounted);
  return {
    draw(drawable, look, rank) {
      if (!look.visible || !isSplitLine(drawable)) {
        lines.show(undefined, rank);
        return;
      }
      const style = styleInState(drawable, look.state);
      const parts = drawableParts(drawable, style, GOOGLE_LINE.strokeOpacity);
      lines.show(parts, frontRank(look.state) ?? rank);
    },
    shown: lines.shown,
    remove: lines.remove,
  };
}

/** A part's polyline, and the look and path last written to it. */
interface DrawnPart {
  readonly line: google.maps.Polyline;
  writtenLook: string | undefined;
  writtenPath: LinePart["path"] | undefined;
}

/** `drawn` drawing `part` at `zIndex` on `map`, its look written only when it changed; off the map with no part. */
function showPart(
  drawn: DrawnPart,
  part: LineParts["ahead"],
  { map, zIndex }: { readonly map: google.maps.Map; readonly zIndex: number },
): void {
  if (part === undefined) {
    if (drawn.line.getMap()) drawn.line.setMap(null);
    return;
  }
  const look = `${zIndex} ${JSON.stringify(part.style)}`;
  if (look !== drawn.writtenLook) {
    drawn.line.setValues({ ...styleValues(part.style), clickable: false, zIndex });
    drawn.writtenLook = look;
  }
  // A split keeps its paths while the progress does (`splitAtFraction`): a hover sets none again.
  if (part.path !== drawn.writtenPath) {
    drawn.line.setPath(part.path as google.maps.LatLngLiteral[]);
    drawn.writtenPath = part.path;
  }
  if (drawn.line.getMap() !== map) drawn.line.setMap(map);
}
