// @vitest-environment happy-dom
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ListEntry } from "../list-view";
import { optionsIn } from "../testing/lists";
import { LocationList } from "./location-list";
import { MaplaceProvider } from "./maplace-provider";
import { TOWNS } from "./testing/bound-store";
import { inAct, ROOT_MODES, renderInto, storeCatcher } from "./testing/render";

const { Keep, store } = storeCatcher();

const listboxes = (root: HTMLElement) => root.querySelectorAll('[role="listbox"]');

describe.each(ROOT_MODES)("LocationList, in $mode", (root) => {
  it("shows one listbox, or a native select, in step with the store", async () => {
    const app = (as: "list" | "select") => (
      <MaplaceProvider locations={TOWNS}>
        <Keep />
        <LocationList as={as} label="Towns" />
      </MaplaceProvider>
    );
    const { container, render } = await renderInto(app("list"), root);
    expect(listboxes(container)).toHaveLength(1);
    await inAct(() => store().select("south"));
    expect(container.querySelector('[aria-selected="true"]')?.textContent).toBe("south");
    await render(app("select"));
    expect(listboxes(container)).toHaveLength(0);
    expect(container.querySelector("select")?.value).toBe("south");
  });

  it("keeps its view across renders with the same options", async () => {
    const app = () => (
      <MaplaceProvider locations={TOWNS}>
        <LocationList fitAllLabel="All towns" />
      </MaplaceProvider>
    );
    const { container, render } = await renderInto(app(), root);
    const list = listboxes(container)[0];
    await render(app());
    expect(listboxes(container)[0]).toBe(list);
  });

  it("puts each entry's content in its option before the first act ends", async () => {
    const { container } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <LocationList>
          {({ location }) => <strong>{location.id.toUpperCase()}</strong>}
        </LocationList>
      </MaplaceProvider>,
      root,
    );
    const options = optionsIn(container);
    // A location without a group lists first, then the groups.
    expect(options.map((option) => option.textContent)).toEqual(["EAST", "NORTH", "SOUTH"]);
    expect(options.some((option) => option.hasAttribute("aria-label"))).toBe(false);
  });

  it("leaves out a location not listed, with content children too", async () => {
    const hidden = { id: "west", lat: 0, lng: -1, listed: false };
    const { container } = await renderInto(
      <MaplaceProvider locations={[...TOWNS, hidden]}>
        <LocationList>
          {({ location }) => <strong>{location.id.toUpperCase()}</strong>}
        </LocationList>
      </MaplaceProvider>,
      root,
    );
    expect(optionsIn(container).map((option) => option.textContent)).toEqual([
      "EAST",
      "NORTH",
      "SOUTH",
    ]);
    expect(container.textContent).not.toContain("WEST");
  });

  it("names an option by its label only while its content has no text", async () => {
    const { container } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <LocationList>
          {({ location }) => (location.id === "east" ? <img alt="" /> : location.id)}
        </LocationList>
      </MaplaceProvider>,
      root,
    );
    const named = optionsIn(container).map((option) => option.getAttribute("aria-label"));
    expect(named).toEqual(["east", null, null]);
  });

  it("renders again only the entries whose state changed", async () => {
    const content = vi.fn(({ location }: ListEntry) => location.id);
    await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <Keep />
        <LocationList>{content}</LocationList>
      </MaplaceProvider>,
      root,
    );
    content.mockClear();
    await inAct(() => store().hover("north"));
    expect(content.mock.calls.map(([entry]) => entry.location.id)).toEqual(
      root.mode === "StrictMode" ? ["north", "north"] : ["north"],
    );
  });

  it("keeps an entry's React state as it is selected and hovered", async () => {
    function Counter({ entry }: { readonly entry: ListEntry }) {
      const [clicks, setClicks] = useState(0);
      return (
        <button type="button" onClick={() => setClicks(clicks + 1)}>
          {`${entry.location.id} ${clicks} ${entry.selected ? "selected" : ""}`.trim()}
        </button>
      );
    }
    const { container } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <Keep />
        <LocationList>{(entry) => <Counter entry={entry} />}</LocationList>
      </MaplaceProvider>,
      root,
    );
    const north = () =>
      [...container.querySelectorAll("button")].find((b) => b.textContent?.startsWith("north"));
    await inAct(() => north()?.click());
    await inAct(() => store().select("north"));
    await inAct(() => store().hover("south"));
    expect(north()?.textContent).toBe("north 1 selected");
  });

  it("unmounts the content of an entry the filter hides, and mounts it fresh once shown", async () => {
    const app = (filter?: string[]) => (
      <MaplaceProvider locations={TOWNS} filter={filter}>
        <LocationList>{({ location }) => <em>{location.id}</em>}</LocationList>
      </MaplaceProvider>
    );
    const { container, render } = await renderInto(app(), root);
    const north = container.querySelector("em");
    await render(app(["S"]));
    expect([...container.querySelectorAll("em")].map((em) => em.textContent)).toEqual(["south"]);
    await render(app());
    expect(container.querySelector("em")).not.toBe(north);
    expect(container.querySelectorAll("em")).toHaveLength(3);
  });

  it("gives children with as: 'select' to the boundary", async () => {
    const { errors } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <LocationList as="select">{({ location }) => location.id}</LocationList>
      </MaplaceProvider>,
      root,
    );
    expect(errors[0]).toMatchObject({ code: "invalid-input" });
  });

  it("leaves nothing on the page once unmounted", async () => {
    const { container, unmount } = await renderInto(
      <MaplaceProvider locations={TOWNS}>
        <Keep />
        <LocationList>{({ location }) => location.id}</LocationList>
      </MaplaceProvider>,
      root,
    );
    const pointerOver = new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" });
    await inAct(() => void optionsIn(container)[0]?.dispatchEvent(pointerOver));
    expect(store().getSnapshot().hoveredId).toBeDefined();
    await unmount();
    expect(container.childNodes).toHaveLength(0);
    expect(store().getSnapshot().hoveredId).toBeUndefined();
  });
});
