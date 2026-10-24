// The provider types `cdp()`: a Playwright CDP session.
/// <reference types="@vitest/browser-playwright" />
import { onTestFinished } from "vitest";
import { cdp } from "vitest/browser";
import type { ViewportPoint } from "../../testing/mouse-commands";
import { frames } from "../frames";

/** A finger a test holds on the screen: moves drag with it, until the browser cancels it. */
export interface HeldTouch {
  /** Moves the finger to `point`, then waits a frame, as a finger moves about once a frame. */
  moveTo(point: ViewportPoint): Promise<void>;
  /** Cancels the touch, as the browser does when it takes the gesture; again, nothing. */
  cancel(): Promise<void>;
}

/**
 * Touches the screen at `point` and holds the finger there: real touch input through the DevTools
 * protocol. It is cancelled after the test whatever happens, and touch emulation turned off.
 */
export async function holdTouchAt(point: ViewportPoint): Promise<HeldTouch> {
  const session = cdp();
  let down = true;
  const cancel = async () => {
    if (!down) return;
    down = false;
    await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  };
  await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
  onTestFinished(async () => {
    await cancel();
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
  });
  const touch = (type: "touchStart" | "touchMove", at: ViewportPoint) =>
    session.send("Input.dispatchTouchEvent", { type, touchPoints: [onTopPage(at)] });
  await touch("touchStart", point);
  return {
    async moveTo(to) {
      await touch("touchMove", to);
      await frames(1);
    },
    cancel,
  };
}

/** `point` in the top-level page: tests run in a frame, the protocol doesn't. */
function onTopPage({ x, y }: ViewportPoint): ViewportPoint {
  const frame = window.frameElement?.getBoundingClientRect() ?? { left: 0, top: 0 };
  return { x: frame.left + x, y: frame.top + y };
}
