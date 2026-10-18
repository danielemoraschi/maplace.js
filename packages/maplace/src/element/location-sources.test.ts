// @vitest-environment happy-dom
import { beforeAll, describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import { MaplaceLocation } from "./location-element";
import { readLocationSource, watchLocationSource } from "./location-sources";

beforeAll(() => {
  if (!customElements.get("maplace-location")) {
    customElements.define("maplace-location", MaplaceLocation);
  }
});

function hostWith(html: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  document.body.replaceChildren(host);
  return host;
}

/** The first location's icon builder, called as a provider calls it for a state. */
function iconOf(host: HTMLElement): () => Element | undefined {
  const icon = readLocationSource(host)[0] as { icon?: unknown };
  expect(icon.icon).toBeTypeOf("function");
  const build = icon.icon as (location: unknown, state: unknown) => Element | undefined;
  return () => build(undefined, { selected: false, hovered: false });
}

const ROME = '<maplace-location location-id="rome" lat="41.9" lng="12.5"></maplace-location>';
const JSON_SCRIPT = (text: string) => `<script type="application/json">${text}</script>`;

describe("readLocationSource", () => {
  it("reads the location children, the same objects while unchanged", () => {
    const host = hostWith(ROME);
    const [first] = readLocationSource(host);
    expect(first).toMatchObject({ id: "rome", lat: 41.9 });
    expect(readLocationSource(host)[0]).toBe(first);
  });

  it("reads a location again once its attributes changed", () => {
    const host = hostWith(ROME);
    const [first] = readLocationSource(host);
    host.querySelector("maplace-location")?.setAttribute("lat", "42");
    expect(readLocationSource(host)[0]).not.toBe(first);
    expect(readLocationSource(host)[0]).toMatchObject({ lat: 42 });
  });

  it("gives a template child as popup content, a fresh copy for each popup", () => {
    const host = hostWith(
      '<maplace-location location-id="a" lat="1" lng="2"><template><b>A</b></template></maplace-location>',
    );
    const content = readLocationSource(host)[0]?.content as () => Node;
    const shown = document.createElement("div");
    shown.append(content(), content());
    expect(shown.innerHTML).toBe("<b>A</b><b>A</b>");
  });

  it("gives an icon attribute as the marker's image URL", () => {
    const host = hostWith(
      '<maplace-location location-id="a" lat="1" lng="2" icon="star.svg"></maplace-location>',
    );
    expect(readLocationSource(host)[0]).toMatchObject({ icon: "star.svg" });
  });

  it("gives an icon template's element as the marker, a fresh copy for each state", () => {
    const host = hostWith(
      '<maplace-location location-id="a" lat="1" lng="2"><template data-icon> <span class="star">★</span> </template></maplace-location>',
    );
    const icon = iconOf(host);
    const [first, second] = [icon(), icon()];
    expect(first?.outerHTML).toBe('<span class="star">★</span>');
    expect(second).not.toBe(first);
  });

  it("wraps an icon template's other content in a span, so the marker is one element", () => {
    const host = hostWith(
      '<maplace-location location-id="a" lat="1" lng="2"><template data-icon>★ <b>1</b></template></maplace-location>',
    );
    expect(iconOf(host)()?.outerHTML).toBe("<span>★ <b>1</b></span>");
  });

  it("keeps the popup's template and the icon's apart", () => {
    const host = hostWith(
      '<maplace-location location-id="a" lat="1" lng="2"><template data-icon><i>★</i></template><template><b>A</b></template></maplace-location>',
    );
    const content = readLocationSource(host)[0]?.content as () => Node;
    expect((content() as DocumentFragment).firstElementChild?.outerHTML).toBe("<b>A</b>");
    expect(iconOf(host)()?.outerHTML).toBe("<i>★</i>");
  });

  it("reads a location again once a template is added, not for other children", async () => {
    const host = hostWith(ROME);
    const [first] = readLocationSource(host);
    const location = host.querySelector("maplace-location");
    location?.append(document.createTextNode(" "));
    await nextTask();
    expect(readLocationSource(host)[0]).toBe(first);
    location?.append(document.createElement("template"));
    await nextTask();
    expect(readLocationSource(host)[0]?.content).toBeTypeOf("function");
  });

  it("reads one inline JSON script, the same objects while its text is the same", () => {
    const host = hostWith(JSON_SCRIPT('[{"id":"a","lat":1,"lng":2}]'));
    const read = readLocationSource(host);
    expect(read).toEqual([{ id: "a", lat: 1, lng: 2 }]);
    expect(readLocationSource(host)).toBe(read);
  });

  it.each([
    ["children and a script", ROME + JSON_SCRIPT("[]"), /children or as one JSON script/],
    ["two scripts", JSON_SCRIPT("[]") + JSON_SCRIPT("[]"), /one JSON script, not several/],
    ["JSON that isn't", JSON_SCRIPT("[{"), /not valid JSON/],
    ["JSON that isn't an array", JSON_SCRIPT("{}"), /an array of locations/],
  ])("refuses %s", (_, html, message) => {
    expect(() => readLocationSource(hostWith(html))).toThrow(message);
  });
});

describe("watchLocationSource", () => {
  it("calls once per task for many changes: children added, changed, and the script's text", async () => {
    const host = hostWith(ROME);
    const onChange = vi.fn();
    watchLocationSource(host, onChange);
    host.insertAdjacentHTML("beforeend", ROME.replace("rome", "milan"));
    host.querySelector("maplace-location")?.setAttribute("lat", "40");
    await nextTask();
    expect(onChange).toHaveBeenCalledOnce();
    const script = document.createElement("script");
    script.type = "application/json";
    host.append(script);
    await nextTask();
    script.textContent = "[]";
    await nextTask();
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("ignores children that hold no locations, and stops when asked", async () => {
    const host = hostWith(ROME);
    const onChange = vi.fn();
    const stop = watchLocationSource(host, onChange);
    host.append(document.createElement("div"));
    await nextTask();
    stop();
    host.querySelector("maplace-location")?.setAttribute("lat", "40");
    host.insertAdjacentHTML("beforeend", ROME);
    await nextTask();
    expect(onChange).not.toHaveBeenCalled();
  });
});
