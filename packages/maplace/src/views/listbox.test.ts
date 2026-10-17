// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import type { ListEntry } from "../list-view";
import type { Location } from "../location";
import { optionsIn, recordingActions, structureOf } from "../testing/lists";
import { createListbox } from "./listbox";

const locations: Location[] = [
  { id: "a", lat: 0, lng: 0, title: "Alpha", group: "N" },
  { id: "b", lat: 0, lng: 0, title: "Beta", group: "S" },
  { id: "c", lat: 0, lng: 0, title: "Gamma" },
];

function listbox(settings: { fitAllLabel?: string; render?: (entry: ListEntry) => Node } = {}) {
  const actions = recordingActions();
  const view = createListbox(actions, {
    label: "Shops",
    fitAllLabel: settings.fitAllLabel,
    render: settings.render,
  });
  document.body.replaceChildren(view.element);
  const show = (list: Location[]) => view.renderStructure(structureOf(list));
  show(locations);
  view.renderState({ selectedId: undefined, hoveredId: undefined });
  return { view, actions, show };
}

const options = () => optionsIn(document.body);
const labels = () => options().map((option) => option.textContent);

describe("createListbox: structure", () => {
  it("is a named listbox with groups and options, ungrouped first", () => {
    const { view } = listbox({ fitAllLabel: "All" });
    expect(view.element.getAttribute("role")).toBe("listbox");
    expect(view.element.getAttribute("aria-label")).toBe("Shops");
    expect(labels()).toEqual(["All", "Gamma", "Alpha", "Beta"]);
    const groups = Array.from(document.querySelectorAll('[role="group"]'), (g) =>
      g.getAttribute("aria-label"),
    );
    expect(groups).toEqual(["N", "S"]);
  });

  it("keeps each option element while its entry stays listed", () => {
    const { show } = listbox();
    const before = options();
    show([locations[2] as Location, locations[0] as Location]);
    expect(options()[0]).toBe(before[0]);
    expect(options()).toHaveLength(2);
  });

  it("is hidden while there is nothing to list", () => {
    const { view, show } = listbox();
    show([]);
    expect(view.element.hidden).toBe(true);
  });
});

describe("createListbox: state", () => {
  it("marks the selected option, makes it the only tab stop, and the fit-all entry when none", () => {
    const { view } = listbox({ fitAllLabel: "All" });
    expect(options()[0]?.getAttribute("aria-selected")).toBe("true");
    view.renderState({ selectedId: "b", hoveredId: undefined });
    const selected = document.querySelectorAll('[aria-selected="true"]');
    expect(Array.from(selected, (option) => option.textContent)).toEqual(["Beta"]);
    const stops = document.querySelectorAll('[tabindex="0"]');
    expect(Array.from(stops, (option) => option.textContent)).toEqual(["Beta"]);
  });

  it("re-runs render only for the entries whose state changed", () => {
    const render = vi.fn(() => document.createElement("span"));
    const { view } = listbox({ render });
    render.mockClear();
    view.renderState({ selectedId: undefined, hoveredId: "a" });
    expect(render).toHaveBeenCalledOnce();
    expect(render.mock.calls[0]).toEqual([
      expect.objectContaining({ hovered: true, selected: false }),
    ]);
  });

  it("keeps a node render gives again for the same id in its option", () => {
    const nodes = new Map<string, HTMLElement>();
    const nodeFor = ({ location }: ListEntry) => {
      const node = nodes.get(location.id) ?? document.createElement("span");
      nodes.set(location.id, node);
      return node;
    };
    const { view } = listbox({ render: nodeFor });
    view.renderState({ selectedId: "a", hoveredId: "a" });
    view.renderState({ selectedId: undefined, hoveredId: undefined });
    const option = options().find((element) => element.contains(nodes.get("a") ?? null));
    expect(option?.childNodes).toHaveLength(1);
    expect(option?.firstChild).toBe(nodes.get("a"));
  });

  it("clears its own hover when destroyed", () => {
    const { view, actions } = listbox();
    options()[0]?.dispatchEvent(
      new PointerEvent("pointerover", { bubbles: true, pointerType: "mouse" }),
    );
    view.destroy();
    expect(actions.calls).toContain("unhover:c");
    expect(view.element.isConnected).toBe(false);
  });
});
