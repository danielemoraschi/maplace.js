// A file's tests run one after another, on one page and one mouse: this file checks where a file's
// own setup finds the pointer (T24), and what the first test leaves under the pointer for the
// second (T17).
import { beforeAll, describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { frames } from "../google/frames";
import { centreOf } from "../google/testing/page-input";
import { placedListbox, titled } from "./lists";

/** Well past the frame after layout in which Chromium hovers what lies under a resting pointer. */
const SETTLE_FRAMES = 10;

const option = (name: string) => page.getByRole("option", { name }).element();

let lastMove: MouseEvent | undefined;
addEventListener("mousemove", (move) => {
  lastMove = move;
});
// Away from the park before any hook runs, so parking before this file's own `beforeAll` is a
// move it sees, wherever the file before left the pointer.
await commands.moveMouse({ x: innerWidth / 2, y: innerHeight / 2 });

/** The pointer's last move when this file's own `beforeAll` ran. */
let moveAtFileSetup: MouseEvent | undefined;
beforeAll(() => {
  moveAtFileSetup = lastMove;
});

describe("the pointer before a file's own setup", () => {
  it("is parked before a file's beforeAll lays anything out", () => {
    expect(moveAtFileSetup?.clientX).toBeCloseTo(innerWidth - 1, 0);
    expect(moveAtFileSetup?.clientY).toBeCloseTo(innerHeight - 1, 0);
  });
});

describe("the pointer between tests", () => {
  it("leaves the pointer resting over a list's second option", async () => {
    const { calls } = placedListbox(titled("a", "b"));
    await commands.moveMouse(centreOf(option("B")));
    await expect.poll(() => calls.at(-1)).toBe("hover:b");
  });

  it("hovers nothing in the next test's list, laid out under that pointer", async () => {
    const { calls } = placedListbox(titled("a", "b"));
    await frames(SETTLE_FRAMES);
    expect(calls).toEqual([]);
  });
});
