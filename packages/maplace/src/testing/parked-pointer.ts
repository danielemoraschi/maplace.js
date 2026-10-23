import { beforeEach } from "vitest";
import { commands } from "vitest/browser";

/** One jump: a stepped path would cross what the test before left on the page. */
const IN_ONE_MOVE = 1;

// The browser project's setup (T17). The mouse belongs to the page, which runs one test file after
// another: without this, a test starts wherever the test or file before left the pointer, and
// Chromium hovers whatever the new test lays out under it. The frame's bottom-right corner is
// clear of what a test lays out: the body's margin keeps content off its last pixels.
beforeEach(() => commands.moveMouse({ x: innerWidth - 1, y: innerHeight - 1 }, IN_ONE_MOVE));
