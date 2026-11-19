import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { listed } from "../testing/listed";
import { optionsIn } from "../testing/lists";
import { unstyledPage } from "../testing/unstyled-page";

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

  it("round each option and the search box at 0.5rem", async () => {
    const { list } = await listed({ locations }, { search: true, searchLabel: "Find" });
    const search = list.element.querySelector(".maplace-search");
    expect(search).not.toBeNull();
    expect(getComputedStyle(optionTitled(list.element, "Alpha")).borderRadius).toBe("8px");
    expect(getComputedStyle(search as Element).borderRadius).toBe("8px");
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

  it("indent a subgroup's heading and options under its parent's", async () => {
    const at = { lat: 0, lng: 0 };
    const { list } = await listed({
      locations: [
        { id: "hq", title: "HQ", group: "Europe", ...at },
        { id: "milan", title: "Milan", group: ["Europe", "Italy"], ...at },
      ],
    });
    const left = (node: Element) => node.getBoundingClientRect().left;
    const [europe, italy] = Array.from(list.element.querySelectorAll(".maplace-group-heading"));
    expect(italy && europe && left(italy) > left(europe)).toBe(true);
    expect(left(optionTitled(list.element, "Milan"))).toBeGreaterThan(
      left(optionTitled(list.element, "HQ")),
    );
  });

  it("keep the group filter's boxes behind its button, a row each, subgroups indented", async () => {
    const at = { lat: 0, lng: 0 };
    const { list } = await listed(
      {
        locations: [
          { id: "milan", group: ["Europe", "Italy"], ...at },
          { id: "paris", group: ["Europe", "France"], ...at },
          { id: "tokyo", group: ["Asia", "Japan"], ...at },
        ],
      },
      { groupFilter: true },
    );
    const opener = list.element.querySelector(".maplace-group-filter button") as HTMLElement;
    expect(labelNamed(list.element, "Europe").checkVisibility()).toBe(false);
    opener.click();
    const box = (name: string) => labelNamed(list.element, name).getBoundingClientRect();
    expect(box("Italy").top).toBeGreaterThan(box("Europe").top);
    expect(box("France").top).toBeGreaterThan(box("Italy").top);
    expect(box("Italy").left).toBeGreaterThan(box("Europe").left);
    expect(box("Asia").left).toBe(box("Europe").left);
    const leafLists = list.element.querySelectorAll(".maplace-group-filter ul[hidden]");
    expect(Array.from(leafLists, (leaf) => getComputedStyle(leaf).display)).toEqual(
      Array.from(leafLists, () => "none"),
    );
    expect(leafLists.length).toBeGreaterThan(0);
  });

  it("scroll a long group filter's boxes within their own height", async () => {
    const at = { lat: 0, lng: 0 };
    const locations = Array.from({ length: 40 }, (_, index) => ({
      id: `p${index}`,
      group: [`Region ${index}`, `Country ${index}`],
      ...at,
    }));
    const { list } = await listed({ locations }, { groupFilter: true });
    const filter = list.element.querySelector(".maplace-group-filter") as HTMLElement;
    (filter.querySelector("button") as HTMLElement).click();
    const boxes = filter.querySelector("[role=group]") as HTMLElement;
    expect(boxes.scrollHeight).toBeGreaterThan(boxes.clientHeight);
    expect(boxes.getBoundingClientRect().height).toBeLessThanOrEqual(13 * 16);
  });

  it("turn off inside the opt-out, and come back when it goes", async () => {
    const styledAgain = unstyledPage();
    onTestFinished(styledAgain);
    const { list } = await listed({ locations });
    const option = optionTitled(list.element, "Alpha");
    expect([getComputedStyle(option).paddingTop, getComputedStyle(option).cursor]).toEqual([
      "0px",
      "auto",
    ]);
    styledAgain();
    expect(getComputedStyle(option).cursor).toBe("pointer");
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

function labelNamed(list: Element, name: string): HTMLElement {
  const labels = Array.from(list.querySelectorAll<HTMLElement>(".maplace-group-filter label"));
  return labels.find((label) => label.textContent === name) as HTMLElement;
}
