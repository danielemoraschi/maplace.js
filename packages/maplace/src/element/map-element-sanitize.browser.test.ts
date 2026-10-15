import { describe, expect, it } from "vitest";
import { errorsOn, lastAdapter, mapFrom, nextTask, ROME } from "./testing/fake-maps";

const JSON_WITH_HTML =
  '<script type="application/json">[{"id":"a","lat":1,"lng":2,"html":"<b>A</b><img src=x onerror=alert(1)>"}]</script>';

const strippingTags = (html: string) => html.replace(/<img[^>]*>/g, "");

describe("<maplace-map> sanitize", () => {
  it("draws html from its JSON through the sanitize set before it opened", async () => {
    const map = document.createElement("maplace-map");
    map.sanitize = strippingTags;
    map.innerHTML = JSON_WITH_HTML;
    const errors = errorsOn(map);
    document.body.replaceChildren(map);
    await nextTask();
    await lastAdapter().finishMount();
    await map.maplace.whenReady();
    expect(errors).toEqual([]);
    expect(lastAdapter().callsOf("apply")[0]?.diff.added).toHaveLength(1);
  });

  it("takes a sanitize set before it was defined", () => {
    const inert = document.implementation.createHTMLDocument();
    const map = inert.createElement("maplace-map") as HTMLElement & { sanitize: unknown };
    map.sanitize = strippingTags;
    document.body.replaceChildren(document.adoptNode(map));
    expect((map as unknown as HTMLElementTagNameMap["maplace-map"]).sanitize).toBe(strippingTags);
  });

  it("refuses html without one", async () => {
    const map = document.createElement("maplace-map");
    map.innerHTML = JSON_WITH_HTML;
    const errors = errorsOn(map);
    document.body.replaceChildren(map);
    await nextTask();
    expect(errors.map(({ code }) => code)).toEqual(["missing-sanitizer"]);
  });

  it("refuses a sanitize changed once it opened, each time, until the first is back", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.sanitize = strippingTags;
    map.sanitize = strippingTags;
    expect(errors.map(({ field }) => field)).toEqual(["sanitize", "sanitize"]);
    expect(map.loadState).toBe("error");
    map.sanitize = undefined;
    expect(map.loadState).toBe("loading");
  });

  it("starts without a sanitize that isn't a function, which stands through cluster put back", async () => {
    const map = document.createElement("maplace-map");
    map.sanitize = "strip" as never;
    const errors = errorsOn(map);
    document.body.replaceChildren(map);
    await nextTask();
    expect(errors.map(({ code }) => code)).toEqual(["invalid-input"]);
    expect([map.sanitize, map.loadState]).toEqual([undefined, "error"]);
    map.setAttribute("cluster", "");
    map.removeAttribute("cluster");
    expect(map.loadState).toBe("error");
  });
});
