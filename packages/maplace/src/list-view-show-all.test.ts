// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { movedTo, readyScopedList, SCOPED, scopedList } from "./testing/scoped-list";

describe("createListView with scope: 'viewport', back to every location", () => {
  it("shows 'Show all' only while the list is scoped to a view", async () => {
    const { maplace, adapter, areaOnly, showAll } = await readyScopedList();
    expect(showAll.hidden).toBe(true);
    await movedTo(maplace, adapter, -40);
    expect(showAll.hidden).toBe(true);
    areaOnly.click();
    expect(showAll.hidden).toBe(false);
    await movedTo(maplace, adapter, 40);
    expect([areaOnly.hidden, showAll.hidden]).toEqual([false, false]);
  });

  it("'Show all' lists every location again, and hides", async () => {
    const { maplace, adapter, areaOnly, showAll, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
    expect(listedCount()).toBe(1);
    showAll.click();
    expect([listedCount(), showAll.hidden]).toEqual([5, true]);
  });

  it("after 'Show all', offers 'This area only' when the view would list other locations", async () => {
    const { maplace, adapter, areaOnly, showAll } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
    showAll.click();
    expect(areaOnly.hidden).toBe(false);
  });

  it("after 'Show all', offers nothing when the view holds every location", async () => {
    const { maplace, adapter, areaOnly, showAll } = await readyScopedList();
    await movedTo(maplace, adapter, -40);
    areaOnly.click();
    maplace.setView({ lat: 10, lng: 0 }, 1);
    await adapter.probe().settle();
    areaOnly.click();
    showAll.click();
    expect([areaOnly.hidden, showAll.hidden]).toEqual([true, true]);
  });

  it("keeps 'Show all' beside the empty-area status, the way out", async () => {
    const { maplace, adapter, areaOnly, showAll, status, listedCount } = await readyScopedList();
    await movedTo(maplace, adapter, 150);
    areaOnly.click();
    expect([status.hidden, showAll.hidden]).toEqual([false, false]);
    showAll.click();
    expect([listedCount(), status.hidden, showAll.hidden]).toEqual([5, true, true]);
  });

  it("labels the button showAllLabel, 'Show all' by default", () => {
    expect(scopedList().showAll.textContent).toBe("Show all");
    const view = { ...SCOPED, showAllLabel: "Everything" };
    expect(scopedList({}, view).showAll.textContent).toBe("Everything");
  });
});
