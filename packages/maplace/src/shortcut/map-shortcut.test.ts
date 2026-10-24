// @vitest-environment happy-dom
import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { places } from "../google/testing/places";
import { fakeAdapters } from "../testing/fake/adapters";
import { frameDocument } from "../testing/iframes";
import { cssTextOf } from "../testing/selectors";
import { createShortcutMap } from "./map-shortcut";

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
