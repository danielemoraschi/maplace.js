// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COPIED_SHOWN_MS, startCopyButtons } from "./copy-buttons.ts";

const PILL =
  '<div><code>npm install x</code><button type="button" data-copy="npm install x">Copy</button><span role="status"></span></div>';

const writeText = vi.fn<(text: string) => Promise<void>>();

beforeEach(() => {
  vi.useFakeTimers();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  document.body.innerHTML = PILL;
});

afterEach(() => vi.useRealTimers());

const button = () => document.querySelector<HTMLButtonElement>("[data-copy]") as HTMLButtonElement;
const status = () => document.querySelector('[role="status"]')?.textContent;

async function click(): Promise<void> {
  button().click();
  await vi.advanceTimersByTimeAsync(0);
}

describe("startCopyButtons", () => {
  it("copies the button's command and says Copied in its status", async () => {
    startCopyButtons(document);
    await click();
    expect(writeText).toHaveBeenCalledWith("npm install x");
    expect(status()).toBe("Copied");
    expect(button().dataset.copied).toBe("done");
  });

  it("says to select the command where the clipboard is refused, and keeps saying it", async () => {
    writeText.mockRejectedValue(new Error("refused"));
    startCopyButtons(document);
    await click();
    expect(status()).toBe("Select the command to copy it");
    await vi.advanceTimersByTimeAsync(COPIED_SHOWN_MS * 2);
    expect(status()).toBe("Select the command to copy it");
    expect(button().dataset.copied).toBe("refused");
  });

  it("clears Copied a while after the last click, however often it was clicked", async () => {
    startCopyButtons(document);
    await click();
    await vi.advanceTimersByTimeAsync(COPIED_SHOWN_MS - 100);
    await click();
    await vi.advanceTimersByTimeAsync(COPIED_SHOWN_MS - 100);
    expect(status()).toBe("Copied");
    await vi.advanceTimersByTimeAsync(100);
    expect(status()).toBe("");
    expect(button().dataset.copied).toBeUndefined();
  });

  it("keeps Copied a while after the last copy ends, when a slow copy overlaps a quick one", async () => {
    writeText
      .mockImplementationOnce(() => new Promise((done) => setTimeout(done, 500)))
      .mockResolvedValueOnce(undefined);
    startCopyButtons(document);
    button().click();
    await click();
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(COPIED_SHOWN_MS - 100);
    expect(status()).toBe("Copied");
    await vi.advanceTimersByTimeAsync(100);
    expect(status()).toBe("");
  });

  it("starts only the buttons under the root", async () => {
    document.body.innerHTML = `<section>${PILL}</section><aside></aside>`;
    startCopyButtons(document.querySelector("aside") as Element);
    await click();
    expect(writeText).not.toHaveBeenCalled();
  });
});
