import { describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import { afterParsing } from "./after-parsing";

function documentIn(readyState: DocumentReadyState): Document {
  const events = new EventTarget();
  return Object.assign(events, { readyState }) as unknown as Document;
}

describe("afterParsing", () => {
  it("waits for the parser while the document is loading", async () => {
    const loading = documentIn("loading");
    const run = vi.fn();
    afterParsing(loading, run);
    await nextTask();
    expect(run).not.toHaveBeenCalled();
    loading.dispatchEvent(new Event("DOMContentLoaded"));
    loading.dispatchEvent(new Event("DOMContentLoaded"));
    expect(run).toHaveBeenCalledOnce();
  });

  it("runs after this task's microtasks once parsed", async () => {
    const run = vi.fn();
    afterParsing(documentIn("complete"), run);
    expect(run).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(run).toHaveBeenCalledOnce();
  });
});
