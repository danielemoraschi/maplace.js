// @vitest-environment happy-dom
import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { places } from "../google/testing/places";
import { fakeAdapters } from "../testing/fake/adapters";
import { frameDocument } from "../testing/iframes";
import { cssTextOf } from "../testing/selectors";
import { MY_LOCATION_CLASS } from "../views/my-location-nodes";
import { createShortcutMap } from "./map-shortcut";
import type { SplitOptions } from "./shortcut-options";

const NAMES = { shortcut: "createFakeMap", adapterFactory: "createFakeAdapter" };

afterEach(() => document.body.replaceChildren());

describe("createShortcutMap's list in the page's element", () => {
  it("styles the list in the page's element in that element's document", () => {
    const container = document.body.appendChild(document.createElement("div"));
    const frame = frameDocument();
    const beside = frame.body.appendChild(frame.createElement("div"));
    const maplace = createShortcutMap({
      names: NAMES,
      container,
      split: {
        storeOptions: { locations: places() },
        adapterOptions: {},
        list: { container: beside },
      },
      createAdapter: fakeAdapters().createAdapter,
    });
    onTestFinished(() => maplace.destroy());
    const sheets = frame.adoptedStyleSheets.map(cssTextOf);
    expect(sheets.some((css) => css.includes(".maplace-listbox"))).toBe(true);
  });
});

describe("createShortcutMap's My location control", () => {
  function mapWith(split: Partial<SplitOptions<unknown, object>>) {
    const container = document.body.appendChild(document.createElement("div"));
    const adapters = fakeAdapters();
    const maplace = createShortcutMap({
      names: NAMES,
      container,
      split: { storeOptions: {}, adapterOptions: {}, list: undefined, ...split },
      createAdapter: adapters.createAdapter,
    });
    return { maplace, adapters, container };
  }
  const positionsOn = ({ live }: ReturnType<typeof fakeAdapters>) =>
    live()
      .callsOf("mountControl")
      .map(({ position }) => position);

  it("puts the control in its corner, top-left by default", () => {
    const byDefault = mapWith({ myLocation: true });
    onTestFinished(() => byDefault.maplace.destroy());
    expect(positionsOn(byDefault.adapters)).toEqual(["top-left"]);
    const named = mapWith({ myLocation: { position: "bottom-right", label: "Near me" } });
    onTestFinished(() => named.maplace.destroy());
    expect(positionsOn(named.adapters)).toEqual(["bottom-right"]);
    expect(named.container.querySelector("button")?.textContent).toBe("Near me");
  });

  it("destroy() takes it down before the store", () => {
    const { maplace, container } = mapWith({ myLocation: true });
    const control = container.querySelector(`.${MY_LOCATION_CLASS}`);
    expect(control?.isConnected).toBe(true);
    expect(() => maplace.destroy()).not.toThrow();
    expect(control?.isConnected).toBe(false);
  });

  it("a refused label makes no adapter and leaves no list in the page's container", () => {
    const beside = document.body.appendChild(document.createElement("div"));
    const createAdapter = vi.fn();
    expect(() =>
      createShortcutMap({
        names: NAMES,
        container: document.body,
        split: {
          storeOptions: {},
          adapterOptions: {},
          list: { container: beside },
          myLocation: { label: " " },
        },
        createAdapter,
      }),
    ).toThrow(/label/);
    expect(createAdapter).not.toHaveBeenCalled();
    expect(beside.childElementCount).toBe(0);
  });
});
