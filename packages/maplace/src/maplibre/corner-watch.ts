import type { Map as MapLibreMap } from "maplibre-gl";
import type { ControlPosition } from "../adapter";
import { LIFT_PROPERTY, LIST_ROOM_PROPERTY } from "./control-styles";
import { type CornerLayout, type CornersOnMap, layoutCorners } from "./corner-layout";
import { type CornerElements, cornerElementsIn, measureCorners } from "./corner-measure";

/** The corners' layout kept on a map: laid out again by `settle`, taken off by `stop`. */
export interface CornerWatch {
  settle(): void;
  stop(): void;
}

/**
 * The most measure-and-apply rounds one settle takes. The layout's inputs never depend on a list
 * room it gives, but the lift does on the bottom-right's, and a top corner's room on both: the
 * second round gives the final layout and the third writes nothing; the fourth leaves room for a
 * list's scrollbar coming or going, which changes its corner's width.
 */
const SETTLE_ROUNDS = 4;

const INERT: CornerWatch = { settle() {}, stop() {} };

/**
 * The layout of `map`'s corners (`corner-layout.ts`) written on MapLibre's corner elements as two
 * custom properties the panel's stylesheet reads (`control-styles.ts`), only while a corner holds a
 * shown maplace panel, and laid out again on the frame after the map or a corner is resized (the
 * attribution folding) or what a corner holds changes (a list's entries). A map without MapLibre's
 * corners gets a watch that does nothing.
 */
export function watchCorners(map: MapLibreMap): CornerWatch {
  const container = map.getContainer();
  const corners = cornerElementsIn(container);
  return corners === undefined ? INERT : cornerWatchOn(container, corners);
}

function cornerWatchOn(container: HTMLElement, corners: CornerElements): CornerWatch {
  let pendingFrame: number | undefined;

  function cancelPendingFrame(): void {
    if (pendingFrame !== undefined) cancelAnimationFrame(pendingFrame);
    pendingFrame = undefined;
  }

  function settle(): void {
    cancelPendingFrame();
    for (let round = 0; round < SETTLE_ROUNDS; round += 1) {
      const measured = measureCorners(container, corners);
      if (!holdsAnyPanel(measured)) {
        clearLayout(corners);
        return;
      }
      if (!applyLayout(corners, layoutCorners(measured))) return;
    }
  }

  // On the next frame, never in the observer's callback: laying out there would resize what it
  // observes, which Chromium reports as "ResizeObserver loop completed with undelivered
  // notifications". A settle that changes nothing resizes nothing, so the chain ends.
  const settleOnNextFrame = () => {
    pendingFrame ??= requestAnimationFrame(settle);
  };
  const resizes = new ResizeObserver(settleOnNextFrame);
  for (const element of [container, ...Object.values(corners)]) resizes.observe(element);
  // A list held at its room resizes nothing as its entries change, overlay scrollbars included.
  const entries = new MutationObserver(settleOnNextFrame);
  for (const corner of Object.values(corners)) {
    entries.observe(corner, { childList: true, characterData: true, subtree: true });
  }

  return {
    settle,
    stop() {
      resizes.disconnect();
      entries.disconnect();
      cancelPendingFrame();
      clearLayout(corners);
    },
  };
}

function holdsAnyPanel({ corners }: CornersOnMap): boolean {
  return Object.values(corners).some((corner) => corner.holdsPanel);
}

/**
 * Writes `layout` on the corners in whole pixels, rooms rounded down and the lift up, so what is
 * rounded never closes a gap; and whether that changed any.
 */
function applyLayout(corners: CornerElements, { lift, listRoom }: CornerLayout): boolean {
  const positions = Object.keys(corners) as ControlPosition[];
  const writes = [
    setIfChanged(corners["bottom-left"], LIFT_PROPERTY, Math.ceil(lift)),
    ...positions.map((position) =>
      setIfChanged(corners[position], LIST_ROOM_PROPERTY, Math.floor(listRoom[position])),
    ),
  ];
  return writes.includes(true);
}

/** Writes `px` only if that changes it, so a settled layout resizes nothing; and whether it did. */
function setIfChanged(element: HTMLElement, property: string, px: number): boolean {
  const value = `${px}px`;
  if (element.style.getPropertyValue(property) === value) return false;
  element.style.setProperty(property, value);
  return true;
}

function clearLayout(corners: CornerElements): void {
  for (const corner of Object.values(corners)) {
    corner.style.removeProperty(LIST_ROOM_PROPERTY);
    corner.style.removeProperty(LIFT_PROPERTY);
  }
}
