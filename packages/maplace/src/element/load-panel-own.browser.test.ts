import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { fakeAdapters } from "../testing/fake/adapters";
import { defineProvider } from "./index";
import { box, mapFrom, nextTask, ROME, styledPage } from "./testing/fake-maps";
import { buttonIn, OWN_CHILD, paneIn, panelIn } from "./testing/load-panel";

/** The pane's size each time an adapter on the `measuring` provider mounted. */
const paneSizesAtMount: ReturnType<typeof box>[] = [];
const adapters = fakeAdapters();
defineProvider("measuring", () => {
  const adapter = adapters.createAdapter();
  const { mount } = adapter;
  adapter.mount = (context) => {
    paneSizesAtMount.push(box(context.container));
    return mount(context);
  };
  return adapter;
});

/** A held map on the fake provider, with `attributes` and the page's own panel. */
function heldMap(attributes = "") {
  return mapFrom(
    `<maplace-map hold provider="fake" ${attributes}>${ROME}${OWN_CHILD}</maplace-map>`,
  );
}

function ownChildIn(map: Element): HTMLElement {
  const own = map.querySelector<HTMLElement>("#own");
  if (own === null) throw new Error("no child of the page's own");
  return own;
}

afterEach(() => document.body.replaceChildren());

describe("A child marked data-maplace-idle, in place of the load panel", () => {
  it("gives way to a child marked data-maplace-idle: no panel, the child at the pane's size", async () => {
    styledPage();
    const map = await heldMap();
    expect(panelIn(map)).toBeNull();
    expect(getComputedStyle(ownChildIn(map)).display).toBe("block");
    expect(box(ownChildIn(map))).toEqual({ width: 600, height: 300 });
    expect(getComputedStyle(paneIn(map) as Element).display).toBe("none");
  });

  it("hides that child and shows the pane once the map loads, at its full size as the adapter mounts, even with display:grid on the child", async () => {
    styledPage("maplace-map { width: 600px; height: 300px; } #own { display: grid; }");
    const map = await mapFrom(
      `<maplace-map hold provider="measuring">${ROME}${OWN_CHILD}</maplace-map>`,
    );
    const own = ownChildIn(map);
    expect(getComputedStyle(own).display).toBe("grid");
    map.release();
    await nextTask();
    expect(own.parentElement).toBe(map);
    expect(getComputedStyle(own).display).toBe("none");
    expect(paneSizesAtMount).toEqual([{ width: 600, height: 300 }]);
    expect(box(paneIn(map))).toEqual({ width: 600, height: 300 });
  });

  it("comes back when the page removes its own child; leaves when one is added", async () => {
    styledPage();
    const map = await heldMap();
    ownChildIn(map).remove();
    await nextTask();
    expect(panelIn(map)).not.toBeNull();
    map.insertAdjacentHTML("beforeend", OWN_CHILD);
    await nextTask();
    expect(panelIn(map)).toBeNull();
  });

  it("keeps that child beside a lazy list, the list where it was", async () => {
    styledPage();
    onTestFinished(() => scrollTo(0, 0));
    const map = await mapFrom(
      `<div style="height: 200vh"></div><maplace-map provider="fake" loading="lazy" list>${ROME}${OWN_CHILD}</maplace-map>`,
    );
    const list = map.querySelector(".maplace-placed-list");
    expect(list?.parentElement).toBe(map);
    const ownBox = box(ownChildIn(map));
    expect(ownBox.height).toBe(300);
    expect(ownBox.width).toBeGreaterThan(0);
    expect(ownBox.width).toBeLessThan(600);
  });

  it("lets the page's child take the pane's place inside the opt-out too, the pane back at full size once loading", async () => {
    styledPage();
    const map = await heldMap("data-maplace-unstyled");
    expect(getComputedStyle(paneIn(map) as Element).display).toBe("none");
    expect(box(ownChildIn(map)).height).toBeLessThan(300);
    map.release();
    await nextTask();
    expect(getComputedStyle(ownChildIn(map)).display).toBe("none");
    expect(box(paneIn(map))).toEqual({ width: 600, height: 300 });
  });

  it("passes focus to the pane when the map opens from under a focused button in the page's child", async () => {
    styledPage();
    const map = await heldMap();
    const button = map.querySelector<HTMLButtonElement>("#own-button");
    button?.focus();
    button?.addEventListener("click", () => map.release());
    button?.click();
    await nextTask();
    expect(document.activeElement).toBe(paneIn(map));
  });

  it("leaves the pane out of focus when it arrives under the panel's focused button", async () => {
    styledPage();
    const map = await mapFrom(`<maplace-map hold provider="fake">${ROME}</maplace-map>`);
    buttonIn(map).focus();
    map.insertAdjacentHTML("beforeend", OWN_CHILD);
    await nextTask();
    expect(panelIn(map)).toBeNull();
    expect(paneIn(map)?.hasAttribute("tabindex")).toBe(false);
  });

  it("is only a direct child: one deeper is left to the page, the panel staying", async () => {
    styledPage();
    const map = await mapFrom(
      `<maplace-map hold provider="fake">${ROME}<section><div data-maplace-idle id="deeper">Mine</div></section></maplace-map>`,
    );
    expect(panelIn(map)).not.toBeNull();
    map.release();
    await nextTask();
    const deeper = map.querySelector("#deeper") as Element;
    expect(getComputedStyle(deeper).display).toBe("block");
  });
});
