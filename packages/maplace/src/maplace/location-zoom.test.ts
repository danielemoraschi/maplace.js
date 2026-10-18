// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import type { Location } from "../location";
import type { MaplaceOptions } from "../options";
import type { FakeAdapter } from "../testing/fake-adapter";
import { listed } from "../testing/listed";
import { optionsIn } from "../testing/lists";
import { mounted } from "../testing/mounted";

const locations: Location[] = [
  { id: "a", title: "A", lat: 0, lng: 0 },
  { id: "m", title: "M", lat: 1, lng: 2, zoom: 9 },
  { id: "ring", type: "circle", center: { lat: 0, lng: 0 }, radius: 1000, zoom: 12 },
];
const atOwnZoom = { kind: "location", id: "m", zoom: 9 };

const lastView = (adapter: FakeAdapter) => adapter.callsOf("setView").at(-1)?.view;
const onMap = (options?: MaplaceOptions) => mounted({ locations, ...options });

describe("a location's own zoom, whichever way it is selected", () => {
  it("select(id) shows it at its zoom", async () => {
    const { maplace, adapter } = await onMap();
    maplace.select("m");
    expect(lastView(adapter)).toEqual(atOwnZoom);
  });

  it("a click on its marker shows it at its zoom", async () => {
    const { adapter, host } = await onMap();
    host.reportSelectionChange("m");
    expect(lastView(adapter)).toEqual(atOwnZoom);
  });

  it("selectedId and a location view in options show it at its zoom first", async () => {
    const selected = await onMap({ selectedId: "m" });
    expect(lastView(selected.adapter)).toEqual(atOwnZoom);
    const viewed = await onMap({ view: { kind: "location", id: "m", zoom: undefined } });
    expect(lastView(viewed.adapter)).toEqual(atOwnZoom);
  });

  it("a click in the list shows it at its zoom", async () => {
    const { adapter, list } = await listed({ locations });
    optionsIn(list.element)[1]?.click();
    expect(lastView(adapter)).toEqual(atOwnZoom);
  });

  it("the select's zoom wins, and pan: false moves nothing", async () => {
    const { maplace, adapter } = await onMap();
    maplace.select("m", { zoom: 3 });
    expect(lastView(adapter)).toEqual({ kind: "location", id: "m", zoom: 3 });
    const views = adapter.callsOf("setView").length;
    maplace.select("a");
    maplace.select("m", { pan: false });
    expect(adapter.callsOf("setView")).toHaveLength(views + 1);
  });

  it("centres a shape at its zoom instead of fitting it", async () => {
    const { maplace, adapter } = await onMap();
    maplace.select("ring");
    expect(lastView(adapter)).toEqual({ kind: "location", id: "ring", zoom: 12 });
  });

  it("keeps the view as asked in the snapshot", async () => {
    const { maplace } = await onMap();
    maplace.select("m");
    expect(maplace.getSnapshot().view).toEqual({ kind: "location", id: "m", zoom: undefined });
  });
});
