import { beforeAll, beforeEach } from "vitest";
import { commands } from "vitest/browser";

/** One jump: a stepped path would cross what the test before left on the page. */
const IN_ONE_MOVE = 1;

const parkPointer = () =>
  commands.moveMouse({ x: innerWidth - 1, y: innerHeight - 1 }, IN_ONE_MOVE);

// The browser project's setup (T17, T24). The mouse belongs to the page, which runs one test file
// after another: without this, a file's own `beforeAll` and each test start wherever the test or
// file before left the pointer, and Chromium hovers whatever they lay out under it. The frame's
// bottom-right corner is clear of what a test lays out: the body's margin keeps content off its
// last pixels.
beforeAll(parkPointer);
beforeEach(parkPointer);
