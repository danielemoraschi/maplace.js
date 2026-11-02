// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PREVIEW_FIT_PADDING, startBuilder } from "./builder-page.ts";

const FIXTURE = `
  <fieldset data-provider-choice>
    <input type="radio" name="provider" value="maplibre" checked />
    <input type="radio" name="provider" value="google" />
  </fieldset>
  <textarea data-builder-paste>lat,lng,title\n1,2,a\n3,4,b</textarea>
  <p data-builder-status></p>
  <div data-builder-preview><maplace-map></maplace-map><maplace-map></maplace-map></div>
  <p data-builder-preview-note hidden></p>
  <div data-builder-notes hidden><ul data-builder-notes-list></ul></div>
  <p data-builder-trust-note hidden></p>
  <p data-builder-text-note hidden></p>
  <p data-builder-key-note hidden></p>
  <p data-builder-serve-note hidden></p>
  <pre data-builder-code></pre>
  <button data-builder-copy></button><span data-builder-copied></span>
  <code data-pinned-script="maplibre">&lt;script src="m.js"&gt;&lt;/script&gt;</code>
  <code data-pinned-script="google">&lt;script src="g.js"&gt;&lt;/script&gt;</code>`;

const get = (selector: string) => document.querySelector(selector) as HTMLElement;
const statusText = () => get("[data-builder-status]").textContent;
const codeText = () => get("[data-builder-code]").textContent ?? "";
const copy = () => get("[data-builder-copy]") as HTMLButtonElement;
type TestMap = HTMLElement & {
  locations: { title?: string }[];
  maplace?: { fitAll(): void; select(id: string | undefined): void };
};
const CONFIG_WITH_START = "{ start: 2, locations: [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }] }";
const maps = () => [...document.querySelectorAll<TestMap>("maplace-map")];

/** The first map as a defined one, with what it is asked for. */
function stubFirstMap() {
  const stub = { fitAll: vi.fn(), select: vi.fn() };
  (maps()[0] as TestMap).maplace = stub;
  return stub;
}

function paste(text: string): void {
  const area = get("[data-builder-paste]") as HTMLTextAreaElement;
  area.value = text;
  area.dispatchEvent(new Event("input"));
  vi.runAllTimers();
}

function chooseGoogle(): void {
  const radio = get('input[value="google"]') as HTMLInputElement;
  radio.checked = true;
  radio.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("startBuilder", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = FIXTURE;
    startBuilder(document);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes the status and snippet from what the page opens with", () => {
    expect(statusText()).toBe("Read as CSV: 2 locations");
    expect(codeText()).toContain('src="m.js"');
    expect(codeText()).toContain("<maplace-map list>");
    expect(copy().disabled).toBe(false);
  });

  it("gives every map the locations, and the list attributes", () => {
    for (const map of maps()) {
      expect(map.locations.map(({ title }) => title)).toEqual(["a", "b"]);
      expect(map.hasAttribute("list")).toBe(true);
    }
  });

  it("removes list attributes a new paste doesn't have", () => {
    paste("lat,lng\n1,2");
    for (const map of maps()) expect(map.hasAttribute("list")).toBe(false);
  });

  it("shows a refusal, disables Copy and empties the maps", () => {
    paste("nothing to see");
    expect(statusText()).toContain("Can't read this:");
    expect(get("[data-builder-status]").hasAttribute("data-refused")).toBe(true);
    expect(copy().disabled).toBe(true);
    expect(codeText()).toBe("");
    expect(get("[data-builder-code]").hidden).toBe(true);
    for (const map of maps()) expect(map.locations).toEqual([]);
  });

  it("treats an empty paste as nothing, without a refusal", () => {
    paste("   ");
    expect(statusText()).not.toContain("Can't");
    expect(copy().disabled).toBe(true);
  });

  it("rewrites the snippet for the toggle, leaving the maps' locations and camera", () => {
    const [map] = maps() as [TestMap];
    const before = map.locations;
    const { fitAll, select } = stubFirstMap();
    expect(get("[data-builder-serve-note]").hidden).toBe(false);
    chooseGoogle();
    expect(get("[data-builder-serve-note]").hidden).toBe(true);
    expect(codeText()).toContain('src="g.js"');
    expect(codeText()).toContain('api-key="YOUR_KEY"');
    expect(map.locations).toBe(before);
    expect(fitAll).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(get("[data-builder-key-note]").hidden).toBe(false);
  });

  it("clears the selection and fits a defined map on a paste with no selected-id", () => {
    const { fitAll, select } = stubFirstMap();
    paste("lat,lng\n5,6");
    expect(select).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(fitAll).toHaveBeenCalledExactlyOnceWith({ padding: PREVIEW_FIT_PADDING });
  });

  it("selects the snippet's selected-id on a paste, without fitting", () => {
    const { fitAll, select } = stubFirstMap();
    paste(CONFIG_WITH_START);
    expect(select).toHaveBeenCalledExactlyOnceWith("2");
    expect(fitAll).not.toHaveBeenCalled();
  });

  it("tolerates a map not defined on a paste", () => {
    expect(() => paste(CONFIG_WITH_START)).not.toThrow();
  });

  it("asks nothing of a defined map when a paste can't be read", () => {
    const { fitAll, select } = stubFirstMap();
    paste("nothing to see");
    expect(select).not.toHaveBeenCalled();
    expect(fitAll).not.toHaveBeenCalled();
  });

  it("writes a note's name as text", () => {
    paste('[{ lat: 1, lng: 2, "<img onerror=x>": 1 }]');
    const list = get("[data-builder-notes-list]");
    expect(get("[data-builder-notes]").hidden).toBe(false);
    expect(list.querySelector("img")).toBeNull();
    expect(list.textContent).toContain("<img onerror=x>");
  });

  it("says so when the clipboard refuses", async () => {
    vi.useRealTimers();
    vi.stubGlobal("navigator", { clipboard: { writeText: () => Promise.reject(new Error("no")) } });
    copy().click();
    await vi.waitFor(() =>
      expect(get("[data-builder-copied]").textContent).toBe("Select the code to copy it"),
    );
    vi.unstubAllGlobals();
  });

  it("says so when there is no clipboard", async () => {
    vi.useRealTimers();
    vi.stubGlobal("navigator", {});
    copy().click();
    await vi.waitFor(() =>
      expect(get("[data-builder-copied]").textContent).toBe("Select the code to copy it"),
    );
    vi.unstubAllGlobals();
  });

  it("copies what was just pasted, not the snippet before it settled", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const area = get("[data-builder-paste]") as HTMLTextAreaElement;
    area.value = "lat,lng,title\n1,2,newest";
    area.dispatchEvent(new Event("input"));
    copy().click();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("newest"));
    vi.unstubAllGlobals();
  });

  it("copies nothing when the paste that settles on Copy can't be read", () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const area = get("[data-builder-paste]") as HTMLTextAreaElement;
    area.value = "nothing to read";
    area.dispatchEvent(new Event("input"));
    copy().click();
    expect(writeText).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("doesn't swallow an error of another kind", () => {
    const area = get("[data-builder-paste]") as HTMLTextAreaElement;
    area.dispatchEvent(new Event("input"));
    Object.defineProperty(area, "value", {
      get() {
        throw new TypeError("a bug");
      },
    });
    expect(() => vi.runAllTimers()).toThrow("a bug");
  });
});

describe("startBuilder once the element is defined", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function defineAfter(openingPaste: string, pasted?: string) {
    vi.useFakeTimers();
    vi.spyOn(customElements, "whenDefined").mockResolvedValue(HTMLElement);
    document.body.innerHTML = FIXTURE;
    (get("[data-builder-paste]") as HTMLTextAreaElement).value = openingPaste;
    startBuilder(document);
    if (pasted !== undefined) paste(pasted);
    const stub = stubFirstMap();
    await vi.advanceTimersByTimeAsync(0);
    return stub;
  }

  it("shows the selected-id of the latest paste", async () => {
    const { fitAll, select } = await defineAfter("lat,lng\n1,2", CONFIG_WITH_START);
    expect(select).toHaveBeenCalledExactlyOnceWith("2");
    expect(fitAll).not.toHaveBeenCalled();
  });

  it("fits with none", async () => {
    const { fitAll, select } = await defineAfter("lat,lng\n1,2");
    expect(select).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(fitAll).toHaveBeenCalledExactlyOnceWith({ padding: PREVIEW_FIT_PADDING });
  });
});
