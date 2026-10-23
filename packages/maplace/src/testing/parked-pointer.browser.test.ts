// A file's tests run one after another, on one page and one mouse: this file checks what the
// first test leaves under the pointer for the second (T17).
import { describe, expect, it } from "vitest";
import { commands, page } from "vitest/browser";
import { frames } from "../google/frames";
import { centreOf } from "../google/testing/page-input";
import { placedListbox, titled } from "./lists";

/** Well past the frame after layout in which Chromium hovers what lies under a resting pointer. */
const SETTLE_FRAMES = 10;

const option = (name: string) => page.getByRole("option", { name }).element();

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
