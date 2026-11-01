import { describe, expect, it, vi } from "vitest";
import { adaptersMade, errorsOn, lastAdapter, mapFrom, nextTask, ROME } from "./testing/fake-maps";

describe("<maplace-map>'s switches, read when the store or the map opens", () => {
  it("reads the link switches and labels into the store's popup options", async () => {
    await mapFrom(
      `<maplace-map open-in-maps-link directions-link directions-label="Vai">${ROME}</maplace-map>`,
    );
    expect(lastAdapter().mounted?.popup).toMatchObject({
      openInMapsLabel: "Open in Maps",
      directionsLabel: "Vai",
    });
  });

  it("draws no link from its label alone", async () => {
    await mapFrom(
      `<maplace-map open-in-maps-label="Apri" directions-link="false">${ROME}</maplace-map>`,
    );
    expect(lastAdapter().mounted?.popup).toMatchObject({
      openInMapsLabel: undefined,
      directionsLabel: undefined,
    });
  });

  it("a link switch neither true nor false stands as misuse, naming it", async () => {
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("open-in-maps-link", "maybe");
    expect(errors).toEqual([
      expect.objectContaining({
        field: "open-in-maps-link",
        message: expect.stringContaining('open-in-maps-link must be true or false, got "maybe"'),
      }),
    ]);
    expect(map.loadState).toBe("error");
    map.setAttribute("open-in-maps-link", "false");
    expect(map.loadState).toBe("idle");
  });

  it("refuses a link switched on once the map is created, until put back", async () => {
    const map = await mapFrom(`<maplace-map>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("directions-link", "");
    expect(errors.map(({ message }) => message)).toEqual([
      expect.stringMatching(/directions-link.* can't change once the map is created/),
    ]);
    expect(map.loadState).toBe("error");
    map.setAttribute("directions-link", "false");
    expect(map.loadState).toBe("loading");
  });

  it("reads cluster='false' as off", async () => {
    await mapFrom(`<maplace-map cluster="false">${ROME}</maplace-map>`);
    expect(lastAdapter().mounted?.cluster).toBe(false);
  });

  it("a bad cluster at creation leaves clustering off and stands as misuse", async () => {
    const map = await mapFrom(`<maplace-map hold cluster="maybe">${ROME}</maplace-map>`);
    expect(map.loadState).toBe("error");
    map.removeAttribute("cluster");
    expect(map.loadState).toBe("idle");
    map.release();
    await nextTask();
    expect(lastAdapter().mounted?.cluster).toBe(false);
  });

  it("a bad cluster written later stands as misuse, naming it", async () => {
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("cluster", "maybe");
    expect(errors).toEqual([
      expect.objectContaining({
        field: "cluster",
        message: expect.stringContaining('cluster must be true or false, got "maybe"'),
      }),
    ]);
  });

  it("opens at once with hold='false'", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold="false">${ROME}</maplace-map>`);
    expect(adaptersMade.length).toBe(before + 1);
    expect(map.loadState).not.toBe("error");
  });

  it("a bad hold stays held and stands as misuse, until released", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold="maybe">${ROME}</maplace-map>`);
    expect(adaptersMade.length).toBe(before);
    expect(map.loadState).toBe("error");
    map.release();
    await nextTask();
    expect(adaptersMade.length).toBe(before + 1);
    expect(map.loadState).not.toBe("error");
  });

  it("a bad hold corrected in place stays held, with no misuse left and its panel back", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold="maybe">${ROME}</maplace-map>`);
    expect(map.loadState).toBe("error");
    map.setAttribute("hold", "");
    expect(map.loadState).toBe("idle");
    expect(getComputedStyle(map.querySelector(".maplace-load-panel") as Element).display).not.toBe(
      "none",
    );
    expect(adaptersMade.length).toBe(before);
  });

  it("a bad hold written later stands as misuse, naming it", async () => {
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.setAttribute("hold", "maybe");
    expect(errors).toEqual([
      expect.objectContaining({
        field: "hold",
        message: expect.stringContaining('hold must be true or false, got "maybe"'),
      }),
    ]);
  });

  it("writing hold='false' later opens nothing: release() does", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    map.setAttribute("hold", "false");
    await nextTask();
    expect(adaptersMade.length).toBe(before);
    map.release();
    await nextTask();
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("a provider written after hold='false' opens nothing either: release() does", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold>${ROME}</maplace-map>`);
    map.setAttribute("hold", "false");
    map.setAttribute("provider", "fake");
    await nextTask();
    expect(adaptersMade.length).toBe(before);
    map.release();
    await nextTask();
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("a bad hold fixed while away opens on the way back, with no misuse left", async () => {
    const before = adaptersMade.length;
    const map = await mapFrom(`<maplace-map hold="maybe">${ROME}</maplace-map>`);
    const parent = map.parentElement as HTMLElement;
    map.remove();
    await nextTask();
    map.setAttribute("hold", "false");
    parent.append(map);
    await nextTask();
    expect(map.loadState).not.toBe("error");
    expect(adaptersMade.length).toBe(before + 1);
  });

  it("a bad my-location keeps the map from opening until it is fixed", async () => {
    const map = await mapFrom(`<maplace-map hold my-location="maybe">${ROME}</maplace-map>`);
    const errors = errorsOn(map);
    map.release();
    await nextTask();
    expect(errors.map(({ field }) => field)).toEqual(["my-location"]);
    expect(map.loadState).toBe("error");
    map.setAttribute("my-location", "false");
    await vi.waitFor(() => expect(map.loadState).not.toBe("error"));
  });

  it("a bad link switch at creation leaves the link off and stands as misuse", async () => {
    const map = await mapFrom(`<maplace-map hold open-in-maps-link="maybe">${ROME}</maplace-map>`);
    expect(map.loadState).toBe("error");
    map.removeAttribute("open-in-maps-link");
    expect(map.loadState).toBe("idle");
    map.release();
    await nextTask();
    expect(lastAdapter().mounted?.popup.openInMapsLabel).toBeUndefined();
  });
});
