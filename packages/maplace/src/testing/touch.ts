// The provider types `cdp()`: a Playwright CDP session.
/// <reference types="@vitest/browser-playwright" />
import { onTestFinished } from "vitest";
import { cdp } from "vitest/browser";
import type { ViewportPoint } from "./mouse-commands";

/** A finger a test holds on the screen. */
export interface Finger {
  /** Moves the finger to `point`, then waits a frame, as a finger moves about once a frame. */
  moveTo(point: ViewportPoint): Promise<void>;
  /** Lifts the finger, then waits a frame; called again, it does nothing. */
  lift(): Promise<void>;
  /**
   * Cancels the touch, as the browser does when it takes the gesture, then waits a frame; called
   * again, it does nothing.
   */
  cancel(): Promise<void>;
}

/**
 * Touches the screen at `point` (in the test frame's viewport) and holds the finger there: real
 * touch input through the DevTools protocol. After the test a finger still down is cancelled, and
 * touch emulation turned off.
 */
export async function holdTouchAt(point: ViewportPoint): Promise<Finger> {
  const session = cdp();
  let down = false;
  const send = (type: "touchStart" | "touchMove", at: ViewportPoint) =>
    session.send("Input.dispatchTouchEvent", { type, touchPoints: [onTopPage(at)] });
  const endAs = async (type: "touchEnd" | "touchCancel") => {
    if (!down) return;
    down = false;
    await session.send("Input.dispatchTouchEvent", { type, touchPoints: [] });
    await nextFrame();
  };
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  onTestFinished(async () => {
    await endAs("touchCancel");
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  });
  await send("touchStart", point);
  down = true;
  return {
    async moveTo(to) {
      await send("touchMove", to);
      await nextFrame();
    },
    lift: () => endAs("touchEnd"),
    cancel: () => endAs("touchCancel"),
  };
}

/** `point` in the top-level page: tests run in a frame, the protocol doesn't. */
function onTopPage({ x, y }: ViewportPoint): ViewportPoint {
  const frame = window.frameElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: frame.left + x, y: frame.top + y };
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
