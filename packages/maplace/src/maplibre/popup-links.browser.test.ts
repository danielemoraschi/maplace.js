import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { POPUP_LINKS_CLASS } from "../adapter-kit/popup-links";
import { adding, markerDrawable, presented, withContent } from "../testing/conformance/fixtures";
import { unmountAll } from "../testing/conformance/harness";
import { unstyledPage } from "../testing/unstyled-page";
import { wait } from "./testing/map-settle";
import { mountedMapLibre } from "./testing/mounted";

afterEach(unmountAll);

const LABELS = { openInMapsLabel: "Open in Maps", directionsLabel: "Directions" };

/** Long enough for a click the map or the session heard to have been reported. */
const QUIET_MS = 300;

/** A MapLibre map whose selected location's popup is open, ending in both links. */
async function popupWithLinks() {
  const mounted = await mountedMapLibre(undefined, LABELS);
  await mounted.adapter.apply(adding(withContent(markerDrawable("a"), "Alpha")));
  mounted.adapter.present(presented({ selectedId: "a" }));
  await mounted.probe.settle();
  const element = mounted.probe.shownPopup()?.element;
  if (element === undefined) throw new Error("no popup opened");
  const links = [...element.querySelectorAll("a")];
  return { ...mounted, element, links };
}

describe("a popup's links on MapLibre", () => {
  it("go to OpenStreetMap", async () => {
    const { links } = await popupWithLinks();
    expect(links.map(({ href }) => href)).toEqual([
      "https://www.openstreetmap.org/?mlat=0.000000&mlon=0.000000#map=15/0.000000/0.000000",
      "https://www.openstreetmap.org/directions?to=0.000000%2C0.000000",
    ]);
  });

  it("a click on a link leaves the selection and popup alone, and loads nothing", async () => {
    const { links, host, probe } = await popupWithLinks();
    const stay = (event: Event) => event.preventDefault();
    document.addEventListener("click", stay, { capture: true });
    onTestFinished(() => document.removeEventListener("click", stay, { capture: true }));
    await userEvent.click(links[0] as HTMLAnchorElement);
    await wait(QUIET_MS);
    expect(host.reportsOf("reportPopupClose")).toEqual([]);
    expect(host.reportsOf("reportMapClick")).toEqual([]);
    expect(probe.shownPopup()?.id).toBe("a");
    const loaded = performance.getEntriesByType("resource").map(({ name }) => name);
    expect(loaded.filter((name) => name.includes("openstreetmap.org"))).toEqual([]);
  });

  it("Tab goes through the links, then to the close button MapLibre puts after the content", async () => {
    const { links } = await popupWithLinks();
    links[0]?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(links[1]);
    await userEvent.tab();
    expect(document.activeElement).toBe(document.querySelector(".maplibregl-popup-close-button"));
  });

  it("a link is at least 24px tall", async () => {
    const { links } = await popupWithLinks();
    for (const link of links) {
      expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(24);
    }
  });

  it("the row follows dir=rtl", async () => {
    const { links, container } = await popupWithLinks();
    container.dir = "rtl";
    const [first, second] = links.map((link) => link.getBoundingClientRect());
    expect(first?.left).toBeGreaterThan(second?.right ?? Number.POSITIVE_INFINITY);
  });

  it("the links stay apart inside the opt-out", async () => {
    onTestFinished(unstyledPage());
    const { links, element } = await popupWithLinks();
    expect(
      getComputedStyle(element.querySelector(`.${POPUP_LINKS_CLASS}`) as Element).display,
    ).toBe("block");
    const [first, second] = links.map((link) => link.getBoundingClientRect());
    expect(second?.left).toBeGreaterThan(first?.right ?? Number.POSITIVE_INFINITY);
  });
});
