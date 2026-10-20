import { afterAll, expect, it, vi } from "vitest";
import "../element/google";
import type * as Core from "../index";
import type { Maplace } from "../index";
import { clickButton } from "../testing/examples/behaviours/reading";
import { EXAMPLES } from "../testing/examples/example-files";
import { openHost } from "../testing/examples/example-hosts";
import { openPage } from "../testing/examples/example-page";
import { recordErrors } from "../testing/examples/page-errors";
import { recordedStoreCount, storeAttachedSince } from "../testing/examples/recorded-stores";
import { TILES_TIMEOUT_MS } from "./testing/store-on-google";
import { describeWithKey } from "./testing/with-maps";

// The recorder loaded by the factory itself: the element's import of the entry runs it before
// this file's own imports are in.
vi.mock("maplace", async (importOriginal) => {
  const real = await importOriginal<typeof Core>();
  const { recordingCreateMaplace } = await import("../testing/examples/recorded-stores");
  return { ...real, createMaplace: recordingCreateMaplace(real.createMaplace) };
});

afterAll(() => vi.unstubAllGlobals());

const styled = EXAMPLES.find(({ name }) => name === "styled");
if (styled === undefined) throw new Error("no styled example");

/** The colour scheme each Google map was created with, in order: Google has no getter for it. */
const schemesMade: (string | null | undefined)[] = [];

/** Google's `importLibrary`, its `Map` recording the `colorScheme` option each map is made with. */
function recordMapsMade(): void {
  const importLibrary = google.maps.importLibrary;
  google.maps.importLibrary = async (name: string) => {
    const library = await importLibrary(name);
    if (name !== "maps") return library;
    const GoogleMap = (library as google.maps.MapsLibrary).Map;
    class RecordedMap extends GoogleMap {
      constructor(element: HTMLElement, options?: google.maps.MapOptions) {
        super(element, options);
        schemesMade.push(options?.colorScheme);
      }
    }
    return Object.create(library, { Map: { value: RecordedMap } });
  };
}

/** "Dark theme" clicked once `store` is ready: the map made next is dark, and ready too. */
async function expectDarkOnToggle(store: Maplace, root: Element): Promise<void> {
  const ready = () => store.getSnapshot().loadState;
  await expect.poll(ready, { timeout: TILES_TIMEOUT_MS }).toBe("ready");
  expect(schemesMade.at(-1)).toBe(google.maps.ColorScheme.LIGHT);
  const made = schemesMade.length;
  clickButton(root, "Dark theme");
  await expect.poll(() => schemesMade.length, { timeout: TILES_TIMEOUT_MS }).toBe(made + 1);
  expect(schemesMade.at(-1)).toBe(google.maps.ColorScheme.DARK);
  await expect.poll(ready, { timeout: TILES_TIMEOUT_MS }).toBe("ready");
}

// The styled example's three versions in one document, as on the site: the vanilla host's
// bootstrap loads Maps JS, which the React version and the page then share.
describeWithKey("the styled example on Google Maps", (key) => {
  it("opens the vanilla version dark after its toggle", async () => {
    const root = openHost(styled.vanilla.html, { apiKey: key });
    await google.maps.importLibrary("maps");
    recordMapsMade();
    const errors = recordErrors();
    const stores = recordedStoreCount();
    await styled.vanilla.run();
    await expectDarkOnToggle(await vi.waitFor(() => storeAttachedSince(stores)), root);
    expect(errors).toEqual([]);
  }, 60_000);

  it("opens the React version dark after its toggle", async () => {
    const root = openHost(styled.react.html);
    const errors = recordErrors();
    const stores = recordedStoreCount();
    await styled.react.run();
    await expectDarkOnToggle(await vi.waitFor(() => storeAttachedSince(stores)), root);
    expect(errors).toEqual([]);
  }, 60_000);

  it("opens the page dark after its toggle", async () => {
    // A reader's stylesheet gives the map its size; the page leaves that to them.
    const style = document.createElement("style");
    style.textContent = "maplace-map { display: block; height: 240px; }";
    document.head.append(style);
    const page = openPage(styled.page.html, { apiKey: key });
    await expectDarkOnToggle(page.map.maplace, page.root);
    expect(page.errors).toEqual([]);
  }, 60_000);
});
