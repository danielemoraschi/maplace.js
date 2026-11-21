// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCodeCopyButtons } from "./code-copy.ts";
import { startCopyButtons } from "./copy-buttons.ts";

const TEMPLATE =
  '<template id="code-copy"><div data-code-frame><button type="button" data-copy>Copy</button><span role="status"></span></div></template>';
const BLOCK = '<pre class="astro-code"><code>const a = 1;</code></pre>';
const FOLDED = `<div class="folded-host" data-copy-text="before\n  <script>loader</script>\nafter">${BLOCK}<details><summary>Google's loader</summary>${BLOCK}</details>${BLOCK}</div>`;

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function started(html: string): HTMLTemplateElement {
  document.body.innerHTML = `${TEMPLATE}<main>${html}</main>`;
  const template = document.querySelector<HTMLTemplateElement>("#code-copy") as HTMLTemplateElement;
  addCodeCopyButtons(document, template);
  startCopyButtons(document);
  return template;
}

const buttons = () => document.querySelectorAll<HTMLButtonElement>("main [data-copy]");

describe("addCodeCopyButtons", () => {
  it("gives each code block a copy button and status, the block first in its frame", () => {
    started(`${BLOCK}<p>Between</p>${BLOCK}`);
    const frames = document.querySelectorAll("main [data-code-frame]");
    expect(frames).toHaveLength(2);
    for (const frame of frames) {
      expect(frame.firstElementChild?.matches("pre.astro-code")).toBe(true);
      expect(frame.querySelectorAll('[data-copy], [role="status"]')).toHaveLength(2);
    }
  });

  it("copies a block's code", async () => {
    started(BLOCK);
    buttons()[0]?.click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith("const a = 1;"));
  });

  it("gives a folded host one button, copying its whole file, not the fold's summary", async () => {
    started(FOLDED);
    expect(buttons()).toHaveLength(1);
    buttons()[0]?.click();
    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("before\n  <script>loader</script>\nafter"),
    );
  });

  it("opens a folded host's loader where the clipboard is refused, so the selection is the file", async () => {
    writeText.mockRejectedValue(new Error("refused"));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    started(FOLDED);
    buttons()[0]?.click();
    await vi.waitFor(() => expect(document.querySelector("details")?.open).toBe(true));
  });

  it("names a template that holds no frame", () => {
    document.body.innerHTML = `<template id="code-copy"></template><main>${BLOCK}</main>`;
    const empty = document.querySelector<HTMLTemplateElement>("#code-copy") as HTMLTemplateElement;
    expect(() => addCodeCopyButtons(document, empty)).toThrow("#code-copy holds no frame element");
  });

  it("leaves a code block outside `root` alone", () => {
    document.body.innerHTML = `${TEMPLATE}<aside>${BLOCK}</aside><main></main>`;
    const template = document.querySelector<HTMLTemplateElement>(
      "#code-copy",
    ) as HTMLTemplateElement;
    addCodeCopyButtons(document.querySelector("main") as HTMLElement, template);
    expect(document.querySelectorAll("[data-code-frame]")).toHaveLength(0);
  });
});
