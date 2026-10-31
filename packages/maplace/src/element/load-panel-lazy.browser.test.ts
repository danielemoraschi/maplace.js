import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { userEvent } from "vitest/browser";
import { SKIP_MAP_CLASS } from "../maplace/map-aids";
import { twoFrames } from "../testing/webgl-canvas";
import {
  adaptersMade,
  box,
  lastAdapter,
  mapFrom,
  nextTask,
  ROME,
  styledPage,
} from "./testing/fake-maps";
import { OWN_CHILD, paneIn, panelIn, panelsAdded } from "./testing/load-panel";

/** Pushes what follows it well past the viewport and the margin a lazy map opens within. */
const FAR = '<div style="height: 200vh"></div>';

const LAZY = 'provider="fake" loading="lazy"';

function lazyPage(): void {
  styledPage();
  onTestFinished(() => scrollTo(0, 0));
}

function lazyMap(attributes = "", children = ROME) {
  return `<maplace-map ${LAZY} ${attributes}>${children}</maplace-map>`;
}

/** The adapter finishes mounting, adding the link past the map, which the next Tab reaches. */
async function tabToLinkPastMapOf(map: Element): Promise<void> {
  const linkPastMap = () => map.querySelector(`.${SKIP_MAP_CLASS}`);
  lastAdapter().finishMount();
  await expect.poll(linkPastMap).not.toBeNull();
  await userEvent.keyboard("{Tab}");
  expect(document.activeElement).toBe(linkPastMap());
}

afterEach(() => document.body.replaceChildren());

describe('The load panel of <maplace-map loading="lazy">', () => {
  it("never adds the panel to a map that starts in view", async () => {
    lazyPage();
    const panels = panelsAdded();
    const before = adaptersMade.length;
    await mapFrom(lazyMap());
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    expect(panels).toEqual([]);
  });

  it("shows far from the view, its list beside it", async () => {
    lazyPage();
    const map = await mapFrom(FAR + lazyMap("list"));
    await expect.poll(() => panelIn(map)).not.toBeNull();
    expect(panelIn(map)?.parentElement).toBe(paneIn(map));
    expect(map.querySelector(".maplace-placed-list")?.parentElement).toBe(map);
    expect(panelIn(map)?.textContent).toContain("Loads from fake");
  });

  it("leaves as the map scrolls in", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + lazyMap());
    await expect.poll(() => panelIn(map)).not.toBeNull();
    map.scrollIntoView();
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    expect(panelIn(map)).toBeNull();
  });

  it("shows no panel while hidden in a closed details or display:none, and none as it opens in view", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(`<details>${lazyMap()}</details>`);
    await twoFrames();
    expect(panelIn(map)).toBeNull();
    map.closest("details")?.setAttribute("open", "");
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    expect(panelIn(map)).toBeNull();
    const hidden = await mapFrom(`<div style="display: none">${lazyMap()}</div>`);
    await twoFrames();
    expect(panelIn(hidden)).toBeNull();
  });

  it("opens from its button far from the view, and stays released on a later connect", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + lazyMap());
    await expect.poll(() => panelIn(map)).not.toBeNull();
    map.querySelector<HTMLButtonElement>(".maplace-load-panel>button")?.click();
    await nextTask();
    expect(adaptersMade.length).toBe(before + 1);
    expect(panelIn(map)).toBeNull();
    map.remove();
    await nextTask();
    document.body.append(map);
    await nextTask();
    expect(adaptersMade.length).toBe(before + 2);
    await twoFrames();
    expect(panelIn(map)).toBeNull();
  });

  it("tabbing to the far button opens the map and leaves focus on the pane, then the next Tab reaches the skip link", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + lazyMap());
    await expect.poll(() => panelIn(map)).not.toBeNull();
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    await expect.poll(() => document.activeElement).toBe(paneIn(map));
    await tabToLinkPastMapOf(map);
  });

  it("tabbing to a button in the page's own child, far from the view, opens the map and leaves focus on the pane, then the next Tab reaches the skip link", async () => {
    lazyPage();
    const before = adaptersMade.length;
    const map = await mapFrom(FAR + lazyMap("", `${ROME}${OWN_CHILD}`));
    await twoFrames();
    await userEvent.keyboard("{Tab}");
    await expect.poll(() => adaptersMade.length).toBe(before + 1);
    await expect.poll(() => document.activeElement).toBe(paneIn(map));
    await tabToLinkPastMapOf(map);
  });

  it("shows inside the opt-out with no height of its own", async () => {
    styledPage("maplace-map { width: 600px; }");
    onTestFinished(() => scrollTo(0, 0));
    const map = await mapFrom(FAR + lazyMap("data-maplace-unstyled"));
    await expect.poll(() => panelIn(map)).not.toBeNull();
    expect(box(panelIn(map)).height).toBeGreaterThan(0);
  });

  it("shows again when connected again, away from the view, until released", async () => {
    lazyPage();
    const map = await mapFrom(FAR + lazyMap());
    await expect.poll(() => panelIn(map)).not.toBeNull();
    map.remove();
    await nextTask();
    expect(panelIn(map)).toBeNull();
    document.body.append(map);
    await expect.poll(() => panelIn(map)).not.toBeNull();
  });
});
