/// <reference types="vite/client" />
import { describe, expect, it, onTestFinished } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import { queried } from "../testing/queried";
import { box } from "./testing/dom";
import recipe from "./testing/list-before-script.html?raw";
import { panelIn } from "./testing/load-panel";
import { restoreScreen, showOnPhone } from "./testing/screens";

const ROWS = Array.from({ length: 100 }, (_, row) => `<li>Place ${row}</li>`).join("");

/** The docs' recipe as the page, on the fake provider, with these attributes on its map. */
function recipePage(attributes = "", rows = ""): void {
  document.body.innerHTML = recipe
    .replace('api-key="YOUR_KEY"', `provider="fake" ${attributes}`)
    .replace("</ul>", `${rows}</ul>`);
}

/** The recipe as the page once the script has arrived, and the map opened or waiting. */
async function definedPage(attributes = "", rows = ""): Promise<void> {
  await scriptArrives();
  recipePage(attributes, rows);
  await nextTask();
}

async function onPhone(): Promise<void> {
  await showOnPhone();
  onTestFinished(restoreScreen);
}

const mapOnPage = () => queried(document.body, "maplace-map");
const pageList = () => queried(document.body, ".before-script");

/** Where the map is on the page, and how big: what must hold still as the list swaps. */
function placeOfMap() {
  return { ...box(mapOnPage()), top: mapOnPage().getBoundingClientRect().top };
}

function isShown(element: Element): boolean {
  return getComputedStyle(element).display !== "none";
}

function maplaceList(): Element | null {
  return document.querySelector('[role="listbox"]');
}

/** Whether the page's list ends within its map and scrolls to reach the rest, however long. */
function scrollsWithinMap(): boolean {
  const list = pageList();
  list.scrollTop = 1;
  const ends =
    list.getBoundingClientRect().bottom <= mapOnPage().getBoundingClientRect().bottom + 1;
  return ends && list.scrollTop === 1;
}

/** The elements defined, as the script's arrival defines them, for what the page has by then. */
async function scriptArrives(): Promise<void> {
  await import("./testing/fake-maps");
  await nextTask();
}

function expectNotDefinedYet(): void {
  expect(customElements.get("maplace-map")).toBeUndefined();
}

// In this order: the elements stay defined for the rest of the file once the script arrives.
describe("a list before the script runs", () => {
  it("shows the page's list while the element isn't defined", () => {
    recipePage();
    expectNotDefinedYet();
    expect(isShown(pageList())).toBe(true);
    expect(pageList().textContent).toContain("Rome");
  });

  it("keeps a long list inside the map's room while the element isn't defined", () => {
    recipePage("", ROWS);
    expectNotDefinedYet();
    expect(scrollsWithinMap()).toBe(true);
  });

  it("lets a page's own height win over the room it holds", () => {
    document.body.innerHTML = "<style>maplace-map { height: 30rem }</style>";
    document.body.insertAdjacentHTML("beforeend", recipe);
    expectNotDefinedYet();
    expect(box(mapOnPage()).height).toBe(480);
  });

  it("swaps for maplace's list as the script arrives, the map where it was", async () => {
    recipePage();
    expectNotDefinedYet();
    const before = placeOfMap();
    await scriptArrives();
    expect(placeOfMap()).toEqual(before);
    expect(isShown(pageList())).toBe(false);
    expect(maplaceList()?.textContent).toContain("Rome");
    expect(maplaceList()?.textContent).toContain("Milan");
  });

  it("with hold, keeps the page's list until release(), then maplace's replaces it", async () => {
    await definedPage("hold");
    expect(isShown(pageList())).toBe(true);
    expect(maplaceList()).toBeNull();
    document.querySelector("maplace-map")?.release();
    await nextTask();
    expect(isShown(pageList())).toBe(false);
    expect(maplaceList()?.textContent).toContain("Rome");
  });

  it('with loading="lazy" off-screen, maplace\'s list replaces it at once', async () => {
    await definedPage('loading="lazy" style="margin-top: 200vh"');
    expect(mapOnPage().matches(":state(idle)")).toBe(true);
    expect(isShown(pageList())).toBe(false);
    expect(maplaceList()?.textContent).toContain("Rome");
  });

  it("keeps a long list inside a held map's box", async () => {
    await definedPage("hold", ROWS);
    expect(scrollsWithinMap()).toBe(true);
  });

  it("held at a phone's width, leaves the load panel its room above a long list", async () => {
    await onPhone();
    await definedPage("hold", ROWS);
    expect(box(panelIn(mapOnPage())).height).toBeGreaterThan(box(mapOnPage()).height / 2);
    expect(scrollsWithinMap()).toBe(true);
  });

  it("held at a phone's width, a short list takes only the room of its rows", async () => {
    await onPhone();
    await definedPage("hold");
    const rows = [...pageList().children].reduce((sum, row) => sum + box(row).height, 0);
    expect(box(pageList()).height).toBeLessThanOrEqual(rows + 1);
  });
});
