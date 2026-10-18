// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { nextTask } from "../adapter-kit/chunks";
import { createMapSettingsWatch } from "./map-settings-watch";
import { elementWith } from "./testing/dom";

/** A started watch on an element with `attributes`, and how often it has called back. */
function watched(attributes: Record<string, string> = {}) {
  const host = elementWith(attributes);
  const onChange = vi.fn();
  const watch = createMapSettingsWatch(host, onChange);
  watch.start();
  return { host, onChange, watch };
}

describe("createMapSettingsWatch", () => {
  it("calls back once a map setting changes", async () => {
    const { host, onChange } = watched({ "color-scheme": "dark" });
    host.setAttribute("color-scheme", "light");
    await nextTask();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("calls back once for both settings changed in one task", async () => {
    const { host, onChange } = watched();
    host.setAttribute("color-scheme", "light");
    host.setAttribute("map-options", "{}");
    await nextTask();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("ignores a change back to the value the task started with", async () => {
    const { host, onChange } = watched({ "color-scheme": "dark" });
    host.setAttribute("color-scheme", "dark");
    host.setAttribute("map-options", "{}");
    host.removeAttribute("map-options");
    await nextTask();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes an empty setting as a missing one, as the provider does", async () => {
    const { host, onChange } = watched({ "color-scheme": "" });
    host.removeAttribute("color-scheme");
    host.setAttribute("map-options", "");
    await nextTask();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("ignores other attributes", async () => {
    const { host, onChange } = watched();
    host.setAttribute("map-id", "m");
    host.setAttribute("list", "menu");
    await nextTask();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("watches only while started, dropping a change pending at stop", async () => {
    const host = elementWith({});
    const onChange = vi.fn();
    const watch = createMapSettingsWatch(host, onChange);
    host.setAttribute("color-scheme", "dark");
    await nextTask();
    watch.start();
    host.setAttribute("color-scheme", "light");
    watch.stop();
    await nextTask();
    host.setAttribute("color-scheme", "dark");
    await nextTask();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls back once per change however often it was started", async () => {
    const { host, onChange, watch } = watched();
    watch.start();
    host.setAttribute("color-scheme", "dark");
    await nextTask();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
