/// <reference types="@vitest/browser-playwright" />
import type { BrowserCommand } from "vitest/node";

/** A point in the test page's viewport, in CSS pixels. */
export interface ViewportPoint {
  readonly x: number;
  readonly y: number;
}

declare module "vitest/browser" {
  interface BrowserCommands {
    /** Presses the mouse at the first point, moves through the rest, and lets go. */
    pressMouse(path: readonly ViewportPoint[]): Promise<void>;
    moveMouse(point: ViewportPoint): Promise<void>;
    /** Clicks `count` times at a point, as one gesture: from 2, a `dblclick` too. */
    multiClickMouse(point: ViewportPoint, count: number): Promise<void>;
    /** Turns the wheel over a point, by `deltaY` pixels (down is positive). */
    wheelMouse(point: ViewportPoint, deltaY: number): Promise<void>;
  }
}

/** Steps per move: Google's handles follow a drag only through several moves, not one jump. */
const MOVE_STEPS = 10;

/**
 * Real mouse input, run by Playwright outside the page, for what Google answers only to trusted,
 * stepped moves: dragging its handles. Registered in `vitest.config.ts`.
 */
export const MOUSE_COMMANDS = {
  pressMouse: (async (context, path) => {
    const [start, ...rest] = await onPage(context, path);
    if (start === undefined) return;
    await context.page.mouse.move(start.x, start.y);
    await context.page.mouse.down();
    for (const point of rest)
      await context.page.mouse.move(point.x, point.y, { steps: MOVE_STEPS });
    await context.page.mouse.up();
  }) satisfies BrowserCommand<[readonly ViewportPoint[]]>,
  moveMouse: (async (context, point) => {
    const [onScreen] = await onPage(context, [point]);
    if (onScreen) await context.page.mouse.move(onScreen.x, onScreen.y, { steps: MOVE_STEPS });
  }) satisfies BrowserCommand<[ViewportPoint]>,
  multiClickMouse: (async (context, point, count) => {
    const [onScreen] = await onPage(context, [point]);
    if (onScreen) await context.page.mouse.click(onScreen.x, onScreen.y, { clickCount: count });
  }) satisfies BrowserCommand<[ViewportPoint, number]>,
  wheelMouse: (async (context, point, deltaY) => {
    const [onScreen] = await onPage(context, [point]);
    if (onScreen === undefined) return;
    await context.page.mouse.move(onScreen.x, onScreen.y);
    await context.page.mouse.wheel(0, deltaY);
  }) satisfies BrowserCommand<[ViewportPoint, number]>,
};

type CommandContext = Parameters<BrowserCommand<[]>>[0];

/** The points on the whole page: the tests run in a frame, offset within it. */
async function onPage(context: CommandContext, points: readonly ViewportPoint[]) {
  const frame = await (await context.frame()).frameElement();
  const box = await frame.boundingBox();
  const [left, top] = [box?.x ?? 0, box?.y ?? 0];
  return points.map(({ x, y }) => ({ x: left + x, y: top + y }));
}
