import { describe, expect, it } from "vitest";
import { box, lastAdapter, mapFrom, nextTask, styledPage } from "./testing/fake-maps";

const HEADING = "Choose a location:";

/** `count` locations as `<maplace-location>` children. */
function places(count: number): string {
  return Array.from(
    { length: count },
    (_, index) =>
      `<maplace-location location-id="p${index}" lat="${index / 10}" lng="0" title="Place ${index}"></maplace-location>`,
  ).join("");
}

function listboxNamed(root: ParentNode, name: string): HTMLElement | null {
  return root.querySelector(`[role="listbox"][aria-label="${name}"]`);
}

describe("<maplace-map list-heading>", () => {
  it("shows the heading above its list on the map, naming it", async () => {
    await mapFrom(
      `<maplace-map list list-position="top-left" list-heading="${HEADING}">${places(3)}</maplace-map>`,
    );
    const container = lastAdapter().mounted?.container as HTMLElement;
    expect(container.querySelector(".maplace-list-heading")?.textContent).toBe(HEADING);
    expect(listboxNamed(container, HEADING)).not.toBeNull();
  });

  it("keeps the heading in view beside the map while the entries scroll", async () => {
    styledPage("maplace-map { width: 600px; height: 200px; }");
    const map = await mapFrom(
      `<maplace-map list list-heading="${HEADING}">${places(30)}</maplace-map>`,
    );
    const pane = map.querySelector(".maplace-map-pane")?.getBoundingClientRect();
    const block = map.querySelector(".maplace-list") as HTMLElement;
    const listbox = listboxNamed(block, HEADING) as HTMLElement;
    expect(block.getBoundingClientRect().left).toBeGreaterThanOrEqual(pane?.right ?? Infinity);
    expect(box(block).height).toBe(200);
    listbox.scrollTop = listbox.scrollHeight;
    expect(listbox.scrollTop).toBeGreaterThan(0);
    const heading = block.querySelector(".maplace-list-heading")?.getBoundingClientRect();
    expect(heading?.top).toBe(block.getBoundingClientRect().top);
  });

  it("builds the list again with a new heading", async () => {
    const map = await mapFrom(
      `<maplace-map list list-heading="${HEADING}">${places(2)}</maplace-map>`,
    );
    map.setAttribute("list-heading", "Towns");
    await nextTask();
    expect(map.querySelectorAll(".maplace-list")).toHaveLength(1);
    expect(listboxNamed(map, "Towns")).not.toBeNull();
  });
});
