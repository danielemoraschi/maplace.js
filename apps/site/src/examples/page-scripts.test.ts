// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { INERT_SCRIPT_TYPE, runPageScripts } from "./page-scripts.ts";

function frameWith(html: string): HTMLElement {
  const frame = document.createElement("div");
  frame.innerHTML = html;
  return frame;
}

describe("runPageScripts", () => {
  it("puts each inert page script back with its own type, in order, leaving data alone", () => {
    const frame = frameWith(`
      <script type="application/json">[]</script>
      <script type="${INERT_SCRIPT_TYPE}">one()</script>
      <script type="${INERT_SCRIPT_TYPE}" data-type="module">two()</script>`);
    runPageScripts(frame);
    const scripts = [...frame.querySelectorAll("script")];
    expect(scripts.map(({ type, textContent }) => [type, textContent])).toEqual([
      ["application/json", "[]"],
      ["", "one()"],
      ["module", "two()"],
    ]);
  });

  it("runs them once, however often the map is released", () => {
    const frame = frameWith(`<script type="${INERT_SCRIPT_TYPE}">one()</script>`);
    runPageScripts(frame);
    const [script] = frame.querySelectorAll("script");
    runPageScripts(frame);
    expect(frame.querySelector("script")).toBe(script);
  });
});
