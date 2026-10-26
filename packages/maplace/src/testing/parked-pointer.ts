import { beforeAll, beforeEach, onTestFinished } from "vitest";
import { commands } from "vitest/browser";

/** One jump: a stepped path would cross what the test before left on the page. */
const IN_ONE_MOVE = 1;

const parkPointer = () =>
  commands.moveMouse({ x: innerWidth - 1, y: innerHeight - 1 }, IN_ONE_MOVE);

// The browser project's setup (T17, T24, T27). The mouse belongs to the page, which runs one test
// file after another: without this, a file's own `beforeAll`, a nested describe's and each test
// start wherever the test or file before left the pointer, and Chromium hovers whatever they lay
// out under it. Parked before the file's setup, and once each test is over: registered first, the
// park runs after everything the test registers itself (a held button let go, the viewport put
// back, its nodes removed), and before the next test or describe's `beforeAll`. The frame's
// bottom-right corner is clear of what a test lays out: the body's margin keeps content off its
// last pixels.
beforeAll(parkPointer);
beforeEach(() => {
  onTestFinished(parkPointer);
});
