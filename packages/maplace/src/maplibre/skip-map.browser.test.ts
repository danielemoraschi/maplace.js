import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { queried } from "../testing/queried";
import { onMapLibre } from "./testing/control-site";

afterEach(() => {
  document.body.replaceChildren();
});

async function listTopLeft() {
  const maplace = createMaplace({ locations: [{ id: "a", lat: 1, lng: 1, title: "A" }] });
  const { adapter, container } = await onMapLibre(maplace);
  const list = createListView(maplace);
  adapter.mountControl(list.element, "top-left");
  const link = queried(container, `.${SKIP_MAP_CLASS}`) as HTMLAnchorElement;
  return { container, link, list };
}

describe("the link past a MapLibre map", () => {
  it("is reached before the map's own stops", async () => {
    const { container, link } = await listTopLeft();
    const before = document.createElement("button");
    container.before(before);
    before.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(link);
  });

  it("shows on top of a list in the top-left corner", async () => {
    const { link } = await listTopLeft();
    link.focus();
    const { left, top, width, height } = link.getBoundingClientRect();
    const onTop = document.elementFromPoint(left + width / 2, top + height / 2);
    expect(onTop).toBe(link);
  });

  it("stays on top with the page's opt-out from maplace's styles", async () => {
    const { container, link } = await listTopLeft();
    container.setAttribute("data-maplace-unstyled", "");
    link.focus();
    const { left, top, width, height } = link.getBoundingClientRect();
    expect(document.elementFromPoint(left + width / 2, top + height / 2)).toBe(link);
  });

  it("goes to the list on the map", async () => {
    const { link, list } = await listTopLeft();
    link.focus();
    await userEvent.keyboard("{Enter}");
    expect(list.element.contains(document.activeElement)).toBe(true);
  });
});
