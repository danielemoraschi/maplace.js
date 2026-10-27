import { describe, expect, it, onTestFinished } from "vitest";
import { page, userEvent } from "vitest/browser";
import type { Location } from "./location";
import { listed } from "./testing/listed";
import { optionsIn } from "./testing/lists";
import { queried } from "./testing/queried";
import { unstyledPage } from "./testing/unstyled-page";

const places: Location[] = Array.from({ length: 50 }, (_, index) => ({
  id: `p${index}`,
  title: `Place ${index}`,
  lat: index / 10,
  lng: index / 10,
}));

/** A scoped list on the page, outside any map panel, beside a ready map, in a short block. */
async function scopedList() {
  const ready = await listed({ locations: places }, { scope: "viewport" });
  await ready.adapter.probe().settle();
  ready.list.element.style.height = "200px";
  const part = (selector: string) => queried(ready.list.element, selector);
  const moveTo = async (lat: number, lng: number) => {
    ready.maplace.setView({ lat, lng }, 9);
    await ready.adapter.probe().settle();
  };
  return {
    ...ready,
    moveTo,
    group: part(".maplace-area-switch"),
    all: part(".maplace-show-all"),
    area: part(".maplace-area-only"),
    status: part(".maplace-empty-area"),
    listbox: part('[role="listbox"]'),
  };
}

describe("list view with scope in a browser", () => {
  it("shows the switch as two joined buttons in one row over the entries, which scroll under it", async () => {
    const { list, group, all, area, listbox } = await scopedList();
    const block = list.element.getBoundingClientRect();
    const [first, second] = [all.getBoundingClientRect(), area.getBoundingClientRect()];
    expect([first.top, first.height]).toEqual([second.top, second.height]);
    expect(first.right).toBe(second.left);
    expect(group.getBoundingClientRect().width).toBeGreaterThan(block.width * 0.9);
    expect(group.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      listbox.getBoundingClientRect().top,
    );
    expect(listbox.scrollHeight).toBeGreaterThan(listbox.clientHeight);
    listbox.scrollTop = listbox.scrollHeight;
    expect(all.getBoundingClientRect().top).toBe(first.top);
  });

  it("fills the pressed button only, off the map panel too, and none of the look inside the opt-out", async () => {
    const { all, area, group } = await scopedList();
    const fill = (button: HTMLElement) => getComputedStyle(button).backgroundColor;
    expect(fill(all)).not.toBe(fill(area));
    expect(fill(area)).toBe("rgba(0, 0, 0, 0)");
    onTestFinished(unstyledPage());
    expect(fill(all)).toBe(fill(area));
    expect(getComputedStyle(group).display).toBe("block");
  });

  it("Tab reaches 'All', 'This area', then the list; Enter and Space switch, and focus stays on the button pressed", async () => {
    const { list, all, area, moveTo } = await scopedList();
    await moveTo(2.5, 2.5);
    await userEvent.keyboard("{Tab}");
    await expect.element(all).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(area).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(optionsIn(list.element).length).toBeLessThan(places.length);
    await expect.element(area).toHaveFocus();
    await expect.element(area).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("role")).toBe("option");
    await userEvent.keyboard("{Shift>}{Tab}{Tab}{/Shift} ");
    expect(optionsIn(list.element)).toHaveLength(places.length);
    await expect.element(all).toHaveFocus();
    await expect.element(all).toHaveAttribute("aria-pressed", "true");
  });

  it("names the switch as the list, a group of two toggle buttons", async () => {
    await scopedList();
    const group = page.getByRole("group", { name: "Locations" });
    await expect.element(group.getByRole("button", { name: "All", pressed: true })).toBeVisible();
    await expect
      .element(group.getByRole("button", { name: "This area", pressed: false }))
      .toBeVisible();
  });

  it("over an empty area, keeps the switch and the focus, and its live status, there all along, says so", async () => {
    const { list, status, area, moveTo } = await scopedList();
    const live = page.getByRole("status");
    await expect.element(live).toBeInTheDocument();
    expect(status.getBoundingClientRect().height).toBe(0);
    await moveTo(0, 100);
    await userEvent.click(area);
    await expect.element(live).toHaveTextContent("No locations in this area");
    expect(status.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(list.element.hidden).toBe(false);
    await expect.element(area).toHaveFocus();
    await moveTo(2.5, 2.5);
    await expect.element(live).toHaveTextContent("");
  });

  it("hands focus on an entry to the pressed button when a move leaves the area empty", async () => {
    const { list, area, moveTo } = await scopedList();
    await moveTo(2.5, 2.5);
    await userEvent.click(area);
    optionsIn(list.element)[0]?.focus();
    await moveTo(0, 100);
    await expect.element(area).toHaveFocus();
  });

  it("keeps a long label whole in a narrow list, putting the buttons one above the other", async () => {
    const ready = await listed(
      { locations: places },
      { scope: "viewport", showAllLabel: "Every location", areaOnlyLabel: "Only this area" },
    );
    ready.list.element.style.width = "120px";
    for (const button of ready.list.element.querySelectorAll(".maplace-area-switch>button")) {
      expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    }
    const [all, area] = ["show-all", "area-only"].map((name) =>
      queried(ready.list.element, `.maplace-${name}`).getBoundingClientRect(),
    );
    expect(area?.top).toBeGreaterThanOrEqual(all?.bottom ?? Number.POSITIVE_INFINITY);
  });
});
