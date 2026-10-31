import { describe, expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import { SHARED_CONTROL_STYLES } from "./adapter-kit/control-styles";
import { listed } from "./testing/listed";
import { titled } from "./testing/lists";
import { LIST_STYLES } from "./views/list-styles";
import { createSearchBox } from "./views/search-box";

const CONTROL_PANEL = "maplace-control";

describe("a list view's search box in a browser", () => {
  it.each([
    ["the list's sheet first", [LIST_STYLES, SHARED_CONTROL_STYLES]],
    ["the panel's sheet first", [SHARED_CONTROL_STYLES, LIST_STYLES]],
  ])("is 16px on a touch screen in a panel, with %s", (_, sheets) => {
    const adopted = sheets.map((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css.replaceAll("(pointer:coarse)", "(min-width:0)"));
      return sheet;
    });
    const before = document.adoptedStyleSheets;
    document.adoptedStyleSheets = adopted;
    onTestFinished(() => {
      document.adoptedStyleSheets = before;
    });
    const panel = document.createElement("div");
    panel.className = CONTROL_PANEL;
    panel.style.fontSize = "13px";
    const box = createSearchBox({ label: "Find", noMatches: "None", matches: "Found" });
    panel.append(box.input);
    document.body.append(panel);
    onTestFinished(() => panel.remove());
    expect(getComputedStyle(box.input).fontSize).toBe("16px");
  });

  it("keeps focus through trusted typing, and narrows as it goes", async () => {
    const { list } = await listed({ locations: titled("ab", "ac", "d") }, { searchLabel: "Find" });
    const box = page.getByRole("searchbox", { name: "Find" });
    await box.click();
    await userEvent.keyboard("a");
    await expect.element(page.getByRole("option", { name: "D" })).not.toBeInTheDocument();
    await userEvent.keyboard("b");
    await expect.element(box).toHaveFocus();
    await expect.element(box).toHaveValue("ab");
    await expect.poll(() => list.element.querySelectorAll('[role="option"]')).toHaveLength(1);
  });

  it("gets as wide as the list, never wider", async () => {
    const { list } = await listed({ locations: titled("a") }, { searchLabel: "Find" });
    list.element.style.width = "120px";
    const input = list.element.querySelector("input") as HTMLInputElement;
    const { width } = input.getBoundingClientRect();
    expect(width).toBeLessThanOrEqual(120);
    expect(width).toBeGreaterThan(100);
    expect(list.element.scrollWidth).toBeLessThanOrEqual(120);
  });
});
