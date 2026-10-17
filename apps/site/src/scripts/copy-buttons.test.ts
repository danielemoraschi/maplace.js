// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startCopyButtons } from "./copy-buttons.ts";

function copyPage(writeText: (text: string) => Promise<void>) {
  document.body.innerHTML = `<code id="sri">sha384-abc</code><button data-copy="sri">Copy</button>`;
  startCopyButtons(document, { writeText });
  return document.querySelector("button") as HTMLButtonElement;
}

describe("startCopyButtons", () => {
  afterEach(() => vi.useRealTimers());

  it("copies its target's text, says so, then goes back to its label", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => {});
    const button = copyPage(writeText);
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe("Copied"));
    expect(writeText).toHaveBeenCalledWith("sha384-abc");
    vi.runAllTimers();
    expect(button.textContent).toBe("Copy");
  });

  it("says when the browser refused to copy", async () => {
    const button = copyPage(async () => {
      throw new DOMException("denied", "NotAllowedError");
    });
    button.click();
    await vi.waitFor(() => expect(button.textContent).toBe("Couldn't copy"));
  });
});
