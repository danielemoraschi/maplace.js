import { afterEach, describe, expect, it } from "vitest";
import { fakeAdapters } from "../testing/fake/adapters";
import { defineBuiltInProvider } from "./built-in-provider";
import { defineProvider, type ProviderFactory } from "./index";
import {
  adaptersMade,
  box,
  errorsOn,
  mapFrom,
  nextTask,
  ROME,
  styledPage,
} from "./testing/fake-maps";
import { buttonIn, lineIn, paneIn, panelIn, panelsAdded } from "./testing/load-panel";

const NEVER_OPENED: ProviderFactory = () => {
  throw new Error("never opened here");
};

/** What each map on the `watching` provider's pane held for a panel, as the provider built. */
const panelWhenOpened: (Element | null)[] = [];
const adapters = fakeAdapters();
defineProvider("watching", (element) => {
  panelWhenOpened.push(element.querySelector(".maplace-load-panel"));
  return adapters.createAdapter();
});
// Several registered, so a map naming none has no one to name.
defineProvider("second-of-several", NEVER_OPENED);

/** A held map on the fake provider, with `attributes` and `children`. */
function heldMap(attributes = "", children = ROME) {
  return mapFrom(`<maplace-map hold provider="fake" ${attributes}>${children}</maplace-map>`);
}

afterEach(() => document.body.replaceChildren());

describe("<maplace-map>'s load panel", () => {
  it("shows on a held map, naming its provider, asking nothing of it", async () => {
    styledPage();
    const before = adaptersMade.length;
    const map = await heldMap();
    expect(panelIn(map)?.parentElement).toBe(paneIn(map));
    expect(lineIn(map)?.textContent).toBe("Loads from fake");
    expect(buttonIn(map).textContent).toBe("Load map");
    expect(buttonIn(map).type).toBe("button");
    expect(adaptersMade.length).toBe(before);
  });

  it("fills the pane, and leaves a held map's size as it was", async () => {
    styledPage();
    const map = await heldMap();
    expect(box(map)).toEqual({ width: 600, height: 300 });
    expect(box(panelIn(map))).toEqual(box(map));
  });

  it("shows nothing on a map with neither hold nor lazy, even before it opens", async () => {
    styledPage();
    const panels = panelsAdded();
    await mapFrom(`<maplace-map provider="fake">${ROME}</maplace-map>`);
    await nextTask();
    expect(panels).toEqual([]);
  });

  it("opens the map from its button, the panel gone before the adapter mounts", async () => {
    styledPage();
    const map = await mapFrom(`<maplace-map hold provider="watching">${ROME}</maplace-map>`);
    expect(panelIn(map)).not.toBeNull();
    buttonIn(map).click();
    await nextTask();
    expect(panelWhenOpened).toEqual([null]);
    expect(panelIn(map)).toBeNull();
  });

  it("passes focus to the pane when its focused button is clicked, and the pane gives up tabindex once focus moves on", async () => {
    styledPage();
    const map = await heldMap();
    const pane = paneIn(map);
    buttonIn(map).focus();
    buttonIn(map).click();
    await nextTask();
    expect(document.activeElement).toBe(pane);
    expect(pane?.getAttribute("tabindex")).toBe("-1");
    pane?.blur();
    expect(pane?.hasAttribute("tabindex")).toBe(false);
  });

  it("takes no focus when the panel didn't hold it", async () => {
    styledPage();
    const map = await heldMap();
    map.release();
    await nextTask();
    expect(document.activeElement).toBe(document.body);
    expect(paneIn(map)?.hasAttribute("tabindex")).toBe(false);
  });

  it("takes its words from load-label and load-from-label, live; an empty or whitespace-only one is the default", async () => {
    styledPage();
    const map = await heldMap('load-label="Karte laden" load-from-label="Lädt von"');
    expect(buttonIn(map).textContent).toBe("Karte laden");
    expect(lineIn(map)?.textContent).toBe("Lädt von fake");
    map.setAttribute("load-label", "Laden");
    await nextTask();
    expect(buttonIn(map).textContent).toBe("Laden");
    map.setAttribute("load-label", "");
    map.setAttribute("load-from-label", "   ");
    await nextTask();
    expect(buttonIn(map).textContent).toBe("Load map");
    expect(lineIn(map)?.textContent).toBe("Loads from fake");
  });

  it("keeps its button, and its focus, through a change of words", async () => {
    styledPage();
    const map = await heldMap();
    const button = buttonIn(map);
    button.focus();
    map.setAttribute("load-label", "Laden");
    await nextTask();
    expect(buttonIn(map)).toBe(button);
    expect(document.activeElement).toBe(button);
  });

  it("follows provider while held", async () => {
    styledPage();
    const map = await heldMap();
    map.setAttribute("provider", "not-yet");
    await nextTask();
    expect(lineIn(map)?.textContent).toBe("Loads from not-yet");
  });

  it("names a provider registered after it shows", async () => {
    styledPage();
    const map = await mapFrom('<maplace-map hold provider="registered-late"></maplace-map>');
    expect(lineIn(map)?.textContent).toBe("Loads from registered-late");
    defineBuiltInProvider("registered-late", NEVER_OPENED, {
      mapSettings: [],
      loadSource: () => "Its Own Name",
    });
    await nextTask();
    expect(lineIn(map)?.textContent).toBe("Loads from Its Own Name");
  });

  it("shows only the button when no provider can be named", async () => {
    styledPage();
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    const line = lineIn(map) as HTMLElement;
    expect([line.hidden, line.textContent]).toEqual([true, ""]);
    expect(getComputedStyle(line).display).toBe("none");
    expect(buttonIn(map).textContent).toBe("Load map");
  });

  it("hides in the error state, and returns when the misuse is corrected", async () => {
    styledPage();
    const map = await heldMap('selected-id="missing"');
    errorsOn(map);
    await nextTask();
    expect(map.loadState).toBe("error");
    const panel = panelIn(map);
    expect(panel === null ? "none" : getComputedStyle(panel).display).toBe("none");
    map.locations = [{ id: "missing", lat: 1, lng: 2, title: "Found" }];
    await expect.poll(() => map.loadState).toBe("idle");
    expect(getComputedStyle(panelIn(map) as Element).display).toBe("grid");
  });

  it("goes when removed, and comes back when connected again, still held", async () => {
    styledPage();
    const map = await heldMap();
    map.remove();
    await nextTask();
    expect(panelIn(map)).toBeNull();
    document.body.append(map);
    await nextTask();
    expect(panelIn(map)).not.toBeNull();
    map.setAttribute("load-label", "Again");
    await nextTask();
    expect(buttonIn(map).textContent).toBe("Again");
  });

  it("still works inside the opt-out: in flow, its button opening the map", async () => {
    styledPage();
    const before = adaptersMade.length;
    const map = await heldMap("data-maplace-unstyled");
    const panel = panelIn(map);
    expect(getComputedStyle(panel as Element).display).toBe("block");
    buttonIn(map).click();
    await nextTask();
    expect(adaptersMade.length).toBe(before + 1);
    expect(panelIn(map)).toBeNull();
  });

  it("lets a page hide it with its own CSS", async () => {
    styledPage(
      "maplace-map { width: 600px; height: 300px; } .maplace-load-panel { display: none; }",
    );
    const map = await heldMap();
    expect(getComputedStyle(panelIn(map) as Element).display).toBe("none");
  });
});
