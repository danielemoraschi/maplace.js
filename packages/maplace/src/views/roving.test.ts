// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { focusableList } from "../testing/lists";
import { createRoving } from "./roving";

describe("createRoving", () => {
  it("keeps exactly one tab stop", () => {
    const { container, options } = focusableList(3);
    const roving = createRoving();
    roving.stopAt(options[0]);
    roving.stopAt(options[2]);
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(options[2]?.getAttribute("tabindex")).toBe("0");
  });

  it("tells its own focus moves apart from the user's", () => {
    const { options } = focusableList(1);
    const roving = createRoving();
    let seen: boolean | undefined;
    options[0]?.addEventListener("focus", () => {
      seen = roving.isRefocusing();
    });
    roving.refocus(options[0] as HTMLElement);
    expect(seen).toBe(true);
    expect(roving.isRefocusing()).toBe(false);
  });

  it("refocuses without scrolling the page", () => {
    const { options } = focusableList(1);
    const option = options[0] as HTMLElement;
    const focus = vi.spyOn(option, "focus");
    createRoving().refocus(option);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
