// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { scrollOptionIntoList } from "./scroll";

function boxAt(element: Element, top: number, bottom: number): void {
  element.getBoundingClientRect = () => ({ top, bottom }) as DOMRect;
}

describe("scrollOptionIntoList", () => {
  it("scrolls the list just enough, up or down, and not when the option shows", () => {
    const list = document.createElement("div");
    const option = document.createElement("div");
    boxAt(list, 100, 200);
    boxAt(option, 220, 240);
    scrollOptionIntoList(list, option);
    expect(list.scrollTop).toBe(40);
    boxAt(option, 80, 100);
    scrollOptionIntoList(list, option);
    expect(list.scrollTop).toBe(20);
    boxAt(option, 120, 140);
    scrollOptionIntoList(list, option);
    expect(list.scrollTop).toBe(20);
  });
});
