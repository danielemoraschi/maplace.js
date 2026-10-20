// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { fadeIn } from "./fade-in.ts";

function panelWithAnimate() {
  const panel = document.createElement("div");
  const animate = vi.fn();
  panel.animate = animate;
  return { panel, animate };
}

function prefersReducedMotion(reduce: boolean): void {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({ matches: reduce && query === "(prefers-reduced-motion: reduce)", media: query }) as never,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("fadeIn", () => {
  it("fades the element in from transparent over 0.2's slow 600 ms", () => {
    prefersReducedMotion(false);
    const { panel, animate } = panelWithAnimate();
    fadeIn(panel);
    expect(animate).toHaveBeenCalledWith([{ opacity: 0 }, { opacity: 1 }], {
      duration: 600,
      easing: "ease-out",
    });
  });

  it("leaves the element as it is when the visitor asks for less motion", () => {
    prefersReducedMotion(true);
    const { panel, animate } = panelWithAnimate();
    fadeIn(panel);
    expect(animate).not.toHaveBeenCalled();
  });
});
