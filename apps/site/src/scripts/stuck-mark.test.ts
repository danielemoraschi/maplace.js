// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { markWhenStuck } from "./stuck-mark.ts";

/** A sticky row held 72px from the top, laid out with its top at `top`. */
function stickyRow(): { row: HTMLElement; layOutAt: (top: number) => void } {
  const row = document.createElement("div");
  row.style.position = "sticky";
  row.style.top = "72px";
  document.body.replaceChildren(row);
  return {
    row,
    layOutAt(top) {
      row.getBoundingClientRect = () => DOMRect.fromRect({ y: top, height: 0 });
      window.dispatchEvent(new Event("scroll"));
    },
  };
}

const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));

describe("markWhenStuck", () => {
  let sticky: ReturnType<typeof stickyRow>;
  beforeEach(() => {
    sticky = stickyRow();
  });

  it("leaves a row in its place unmarked", async () => {
    sticky.layOutAt(400);
    markWhenStuck(sticky.row);
    await frame();
    expect(sticky.row.hasAttribute("data-stuck")).toBe(false);
  });

  it("marks a row held at its sticky top, and unmarks it once it is back in its place", async () => {
    markWhenStuck(sticky.row);
    sticky.layOutAt(72);
    await frame();
    expect(sticky.row.hasAttribute("data-stuck")).toBe(true);
    sticky.layOutAt(300);
    await frame();
    expect(sticky.row.hasAttribute("data-stuck")).toBe(false);
  });
});
