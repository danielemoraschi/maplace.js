import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import { createMapFailureNotice } from "../adapter-kit/map-failure";
import { MaplaceError } from "../errors";
import { MAP_FAILURE_CLASS, MAP_FAILURE_WORDS } from "../map-failure-words";
import { fakeAdapters } from "../testing/fake/adapters";
import "../maplibre/testing/stylesheet";
import { TEST_STYLE } from "../maplibre/testing/test-style";
import { defineProvider, type MaplaceMapElement } from "./index";
import "./maplibre";
import { errorsOn, styledPage } from "./testing/dom";

// M41's attribute on real MapLibre, on the local test style, so nothing leaves the machine.

const MISSING = `${location.origin}/maplibre-test-missing/style.json`;
const LOAD = { timeout: 15_000 };

afterEach(() => {
  document.body.replaceChildren();
});

/** A `<maplace-map>` with `attributes`, returned before it opens, so listeners see its errors. */
function mapWith(attributes: string): MaplaceMapElement {
  styledPage();
  document.body.innerHTML = `<maplace-map ${attributes}></maplace-map>`;
  return document.querySelector("maplace-map") as MaplaceMapElement;
}

/** On `maplibre` by name, as a second provider is registered below. */
const onMapLibre = (attributes: string) => mapWith(`provider="maplibre" ${attributes}`);
const goodMap = (attributes = "") =>
  onMapLibre(`map-style='${JSON.stringify(TEST_STYLE)}' ${attributes}`);
const failingMap = (attributes = "") => onMapLibre(`map-style="${MISSING}" ${attributes}`);

const untilFailed = (map: MaplaceMapElement) =>
  vi.waitFor(() => expect(map.loadState).toBe("error"), LOAD);

const panelOn = (map: Element) => map.querySelector(`.${MAP_FAILURE_CLASS}`);
const wordsOn = (map: Element) => map.querySelector<HTMLElement>(`.${MAP_FAILURE_CLASS}>*`);

describe("the failure panel on <maplace-map>", () => {
  it("shows the default words", async () => {
    const map = failingMap();
    await untilFailed(map);
    expect(wordsOn(map)?.textContent).toBe(MAP_FAILURE_WORDS);
  });

  it("failure-label words it, a change is live, blank is the default", async () => {
    const map = failingMap('failure-label="Karte nicht geladen"');
    await untilFailed(map);
    await vi.waitFor(() => expect(wordsOn(map)?.textContent).toBe("Karte nicht geladen"));
    map.setAttribute("failure-label", "Keine Karte");
    expect(wordsOn(map)?.textContent).toBe("Keine Karte");
    map.setAttribute("failure-label", "   ");
    expect(wordsOn(map)?.textContent).toBe(MAP_FAILURE_WORDS);
    map.removeAttribute("failure-label");
    expect(wordsOn(map)?.textContent).toBe(MAP_FAILURE_WORDS);
  });

  it("leaves words already right alone, so an alert isn't announced again", async () => {
    const map = failingMap();
    await untilFailed(map);
    const text = wordsOn(map)?.firstChild;
    map.querySelector(".maplace-map-pane")?.append(document.createElement("div"));
    await nextTask();
    expect(wordsOn(map)?.firstChild).toBe(text);
  });

  it("a good map-style opens the map again and the panel is gone", async () => {
    const map = failingMap();
    await untilFailed(map);
    map.setAttribute("map-style", JSON.stringify(TEST_STYLE));
    await vi.waitFor(() => expect(map.loadState).toBe("ready"), LOAD);
    expect(panelOn(map)).toBeNull();
  });

  it("bad map-options, misuse, show none", async () => {
    const map = goodMap(`map-options='{"scrollwheel":false}'`);
    const errors = errorsOn(map);
    await vi.waitFor(() => expect(errors).toHaveLength(1), LOAD);
    expect(map.loadState).toBe("error");
    expect(panelOn(map)).toBeNull();
  });

  it("a ready map shows none", async () => {
    const map = goodMap();
    await vi.waitFor(() => expect(map.loadState).toBe("ready"), LOAD);
    expect(panelOn(map)).toBeNull();
  });

  it(".maplace-map-failure{display:none} leaves :state(error)", async () => {
    const map = failingMap();
    styledPage(
      "maplace-map { width: 600px; height: 300px; } .maplace-map-failure { display: none; }",
    );
    await untilFailed(map);
    expect(wordsOn(map)?.checkVisibility()).toBe(false);
    expect(map.matches(":state(error)")).toBe(true);
  });

  it("on a list beside the map, the list stays", async () => {
    const map = failingMap("list");
    map.innerHTML =
      '<maplace-location location-id="rome" lat="41.9" lng="12.5" title="Rome"></maplace-location>';
    await untilFailed(map);
    expect(wordsOn(map)).not.toBeNull();
    await vi.waitFor(() => expect(map.querySelector(".maplace-list-view")).not.toBeNull());
  });
});

describe("a panel added while the store is already at error", () => {
  const notice = createMapFailureNotice();
  const fakes = fakeAdapters();
  defineProvider("failing-late", () => {
    const made = fakes.createAdapter();
    return { ...made, mount: notice.mounting((context) => made.mount(context)) };
  });

  it("is still worded", async () => {
    const map = mapWith('provider="failing-late" failure-label="Keine Karte"');
    await vi.waitFor(() => expect(fakes.made).not.toHaveLength(0), LOAD);
    const fake = fakes.made.at(-1);
    if (fake === undefined) throw new Error("no map was opened");
    await fake.finishMount();
    await vi.waitFor(() => expect(map.loadState).toBe("ready"), LOAD);
    const host = fake.host();
    const drawFailure = new MaplaceError("provider-load-failed", "apply: failed");
    host.reportError(drawFailure);
    expect(map.loadState).toBe("error");
    notice.reportFatal(host, new MaplaceError("provider-load-failed", "mount: failed"));
    await nextTask();
    expect(wordsOn(map)?.textContent).toBe("Keine Karte");
  });
});
