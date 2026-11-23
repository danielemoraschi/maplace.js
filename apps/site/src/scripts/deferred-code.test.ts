// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { expandShownCode } from "./deferred-code.ts";

afterEach(() => {
  document.body.innerHTML = "";
});

/** A provider's part of a version's panel: its code written in, or kept in a template. */
const part = (provider: string, shown: boolean, deferred: boolean) => {
  const code = `<pre class="astro-code">${provider}</pre>`;
  const body = deferred ? `<template data-deferred-files>${code}</template>` : code;
  return `<div data-provider-files="${provider}"${shown ? "" : " hidden"}>${body}</div>`;
};

/** A section of two versions on two providers, as built: only html on maplibre written in. */
function builtSection() {
  document.body.innerHTML = `
    <section>
      <div role="tabpanel" id="html">${part("maplibre", true, false)}${part("google", false, true)}</div>
      <div role="tabpanel" id="react" hidden>${part("maplibre", true, true)}${part("google", false, true)}</div>
    </section>`;
  const panel = (id: string) => document.getElementById(id) as HTMLElement;
  const providerPart = (id: string, provider: string) =>
    panel(id).querySelector(`[data-provider-files="${provider}"]`) as HTMLElement;
  const written = () =>
    [...document.querySelectorAll("pre")].map(
      (pre) => `${pre.closest('[role="tabpanel"]')?.id} ${pre.textContent}`,
    );
  return { panel, providerPart, written };
}

describe("expandShownCode", () => {
  it("leaves a hidden panel's code in its template, its provider shown or not", () => {
    const { written } = builtSection();
    const prepare = vi.fn();
    expandShownCode(document, prepare);
    expect(written()).toEqual(["html maplibre"]);
    expect(document.querySelectorAll("template[data-deferred-files]")).toHaveLength(3);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("writes in the code of the panel and provider shown, and only that", () => {
    const { panel, written } = builtSection();
    panel("react").hidden = false;
    panel("html").hidden = true;
    expandShownCode(document, () => {});
    expect(written()).toEqual(["html maplibre", "react maplibre"]);
    expect(document.querySelectorAll("template[data-deferred-files]")).toHaveLength(2);
  });

  it("prepares each part it writes in, once", () => {
    const { panel, providerPart } = builtSection();
    panel("react").hidden = false;
    const prepare = vi.fn();
    expandShownCode(document, prepare);
    expandShownCode(document, prepare);
    expect(prepare.mock.calls).toEqual([[providerPart("react", "maplibre")]]);
  });

  it("leaves a page with nothing deferred as it is", () => {
    document.body.innerHTML = `<div role="tabpanel">${part("maplibre", true, false)}</div>`;
    const prepare = vi.fn();
    expandShownCode(document, prepare);
    expect([document.querySelectorAll("pre").length, prepare.mock.calls.length]).toEqual([1, 0]);
  });
});
