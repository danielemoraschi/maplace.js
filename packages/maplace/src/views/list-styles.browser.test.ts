import { afterEach, describe, expect, it } from "vitest";
import { listed } from "../testing/listed";
import { optionsIn } from "../testing/lists";

// The list's default styles as Chromium computes them: buttons on a light page and a dark one,
// and a page's own rule winning.

const locations = [
  { id: "a", lat: 0, lng: 0, title: "Alpha" },
  { id: "b", lat: 1, lng: 1, title: "Beta" },
];

afterEach(() => {
  document.body.style.color = "";
  document.querySelector("#page-rule")?.remove();
});

describe("the list's default styles", () => {
  it("make each option a padded button with a pointer", async () => {
    const { list } = await listed({ locations });
    const style = getComputedStyle(optionTitled(list.element, "Alpha"));
    expect(style.paddingTop).not.toBe("0px");
    expect(style.cursor).toBe("pointer");
  });

  it.each(["black", "white"])("show the selection on a page whose text is %s", async (color) => {
    document.body.style.color = color;
    const { maplace, list } = await listed({ locations });
    maplace.select("a");
    const background = (title: string) =>
      getComputedStyle(optionTitled(list.element, title)).backgroundColor;
    await expect.poll(() => background("Alpha")).not.toBe(background("Beta"));
  });

  it("set the heading apart from the entries", async () => {
    const { list } = await listed({ locations }, { heading: "Choose a location:" });
    const style = getComputedStyle(headingIn(list.element));
    expect(Number(style.fontWeight)).toBeGreaterThanOrEqual(600);
    expect(style.paddingTop).not.toBe("0px");
  });

  it("give way to any rule of the page", async () => {
    const rule = Object.assign(document.createElement("style"), { id: "page-rule" });
    rule.textContent = ".maplace-option, .maplace-list-heading { padding: 0; }";
    document.head.append(rule);
    const { list } = await listed({ locations }, { heading: "Choose a location:" });
    expect(getComputedStyle(optionTitled(list.element, "Alpha")).paddingTop).toBe("0px");
    expect(getComputedStyle(headingIn(list.element)).paddingTop).toBe("0px");
  });
});

function headingIn(list: Element): HTMLElement {
  return list.querySelector(".maplace-list-heading") as HTMLElement;
}

function optionTitled(list: Element, title: string): HTMLElement {
  return optionsIn(list).find((option) => option.textContent === title) as HTMLElement;
}
