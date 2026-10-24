import { onTestFinished } from "vitest";
import { commands } from "vitest/browser";
import type { ViewportPoint } from "../../testing/mouse-commands";

/** A mouse button a test holds down: moves drag with it, until let go. */
export interface HeldMouse<Point = ViewportPoint> {
  /** Moves the pointer to `point` in stepped moves, the button still down. */
  moveTo(point: Point): Promise<void>;
  /** Lets go of the button; again, nothing. */
  release(): Promise<void>;
}

/**
 * Presses the mouse at `point` and holds it. It is let go after the test whatever happens, or
 * the parked pointer of the next test would drag.
 */
export async function holdMouseAt(point: ViewportPoint): Promise<HeldMouse> {
  let held = true;
  const release = async () => {
    if (!held) return;
    held = false;
    await commands.releaseMouse();
  };
  onTestFinished(release);
  await commands.holdMouse(point);
  return { moveTo: (to) => commands.moveMouse(to), release };
}
