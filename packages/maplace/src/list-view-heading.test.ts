// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { listed } from "./testing/listed";
import { optionsIn, titled } from "./testing/lists";

const locations = titled("a", "b");
const HEADING = "Choose a location:";

describe("createListView with a heading", () => {
  it("is the listbox itself without one", async () => {
    const { list } = await listed({ locations });
    expect(list.element.getAttribute("role")).toBe("listbox");
  });

  it("shows the heading above the entries, naming the list", async () => {
    const { list } = await listed({ locations }, { heading: HEADING });
    const heading = list.element.querySelector(".maplace-list-heading");
    const listbox = list.element.querySelector('[role="listbox"]');
    expect(heading?.textContent).toBe(HEADING);
    expect(heading?.nextElementSibling).toBe(listbox);
    expect(heading?.getAttribute("aria-hidden")).toBe("true");
    expect(listbox?.getAttribute("aria-label")).toBe(HEADING);
  });

  it("leaves the name to label when both are given, and the heading to be read", async () => {
    const { list } = await listed({ locations }, { heading: HEADING, label: "Cities" });
    const heading = list.element.querySelector(".maplace-list-heading");
    expect(list.element.querySelector('[role="listbox"]')?.getAttribute("aria-label")).toBe(
      "Cities",
    );
    expect(heading?.hasAttribute("aria-hidden")).toBe(false);
  });

  it("heads a native select the same way", async () => {
    const { list } = await listed({ locations }, { heading: HEADING, as: "select" });
    const select = list.element.querySelector("select");
    expect(select?.getAttribute("aria-label")).toBe(HEADING);
    expect(select?.previousElementSibling?.textContent).toBe(HEADING);
  });

  it("still selects from an entry clicked under the heading", async () => {
    const { list, maplace } = await listed({ locations }, { heading: HEADING });
    optionsIn(list.element)[1]?.click();
    expect(maplace.getSnapshot().selectedId).toBe("b");
  });

  it("takes the whole block off the page when destroyed", async () => {
    const { list } = await listed({ locations }, { heading: HEADING });
    list.destroy();
    expect(list.element.isConnected).toBe(false);
  });
});
