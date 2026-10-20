import { beforeEach, describe, expect, it, vi } from "vitest";
import { fadeIn } from "./fade-in.ts";
import { reveal } from "./reveal.ts";

vi.mock("./fade-in.ts", () => ({ fadeIn: vi.fn() }));

/** A stand-in for a panel: only `hidden` is read and written. */
const panel = (hidden: boolean) => ({ hidden }) as HTMLElement;

beforeEach(() => {
  vi.mocked(fadeIn).mockClear();
});

describe("reveal", () => {
  it("shows a hidden element, fading it in", () => {
    const element = panel(true);
    reveal(element, true);
    expect([element.hidden, vi.mocked(fadeIn).mock.calls]).toEqual([false, [[element]]]);
  });

  it("leaves an element already shown as it is", () => {
    const element = panel(false);
    reveal(element, true);
    expect([element.hidden, vi.mocked(fadeIn).mock.calls]).toEqual([false, []]);
  });

  it("hides an element at once", () => {
    const element = panel(false);
    reveal(element, false);
    expect([element.hidden, vi.mocked(fadeIn).mock.calls]).toEqual([true, []]);
  });
});
