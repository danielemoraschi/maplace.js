// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { consentLatch } from "../consent/map-gate.ts";
import { sectionStarter } from "./section-start.ts";

vi.mock("./fade-in.ts");

/** A group's panel: a section with its map, a version, a Map/code tab pair and a reload button. */
function panel(name: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <section data-version-switch="${name}">
      <div role="tablist">
        <button role="tab" id="${name}-map-tab" aria-controls="${name}-map" aria-selected="true">Map</button>
        <button role="tab" id="${name}-code-tab" aria-controls="${name}-code" aria-selected="false" tabindex="-1">Code</button>
      </div>
      <div role="tabpanel" id="${name}-map">
        <maplace-map hold id="${name}-page-map"></maplace-map>
        <div data-live-version="vanilla" id="${name}-vanilla"></div>
        <div data-live-version="html" id="${name}-html"></div>
        <button data-map-reload>Reload the page</button>
      </div>
      <div role="tabpanel" id="${name}-code" hidden></div>
    </section>`;
  document.body.append(root);
  return root;
}

function setup() {
  const latch = consentLatch();
  const released: string[] = [];
  const followed: ParentNode[] = [];
  const reload = vi.fn();
  const startSections = sectionStarter({
    whenVisible: (_element, run) => run(),
    release: async (map) => {
      released.push(map.id);
    },
    startVersion: async (version) => {
      released.push(version.id);
    },
    followToggle: (root) => followed.push(root),
    reload,
    latch,
  });
  return { latch, released, followed, reload, startSections };
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe("sectionStarter", () => {
  it("releases a root's maps and module versions once maps are on, not before", () => {
    const { latch, released, startSections } = setup();
    startSections(panel("simple"));
    expect(released).toEqual([]);
    latch.turnOn();
    expect(released).toEqual(["simple-page-map", "simple-vanilla"]);
  });

  it("releases a root started after consent at once, its HTML version left to its map", () => {
    const { latch, released, startSections } = setup();
    latch.turnOn();
    startSections(panel("menu"));
    expect(released).toEqual(["menu-page-map", "menu-vanilla"]);
  });

  it("wires a root's tabs, reload buttons and version switches", () => {
    const { followed, reload, startSections } = setup();
    const root = panel("menu");
    startSections(root);
    document.getElementById("menu-code-tab")?.click();
    expect(document.getElementById("menu-code")?.hidden).toBe(false);
    root.querySelector<HTMLButtonElement>("[data-map-reload]")?.click();
    expect(reload).toHaveBeenCalledOnce();
    expect(followed).toEqual([root]);
  });

  it("wires each root once, leaving the roots started before alone", () => {
    const { reload, startSections } = setup();
    const first = panel("simple");
    startSections(first);
    startSections(panel("menu"));
    first.querySelector<HTMLButtonElement>("[data-map-reload]")?.click();
    expect(reload).toHaveBeenCalledOnce();
  });
});
