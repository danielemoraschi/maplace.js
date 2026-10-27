import { onTestFinished } from "vitest";
import { createListView, type ListViewOptions } from "../list-view";
import type { Location } from "../location";
import { createMaplace } from "../maplace/create";
import { sizedContainer } from "./container";
import { createFakeAdapter, type FakeAdapter } from "./fake-adapter";
import { optionsIn } from "./lists";
import { queried } from "./queried";

/** Four places along the equator, and one up north in group "N". */
export const PLACES: Location[] = [
  { id: "far-west", lat: 0, lng: -40, group: "S" },
  { id: "west", lat: 0, lng: -10, group: "S" },
  { id: "east", lat: 0, lng: 10, group: "S" },
  { id: "far-east", lat: 0, lng: 40, group: "S" },
  { id: "north", lat: 30, lng: 0, group: "N" },
];

export const SCOPED: ListViewOptions = { scope: "viewport", groupHeadings: false };

/**
 * A store on the fake with a scoped list view, attached, both taken down when the test finishes;
 * a held fake keeps the store loading.
 */
export function scopedList(
  options: { locations?: Location[]; holdApplies?: boolean } = {},
  view: ListViewOptions = SCOPED,
) {
  const maplace = createMaplace({ locations: options.locations ?? PLACES });
  const adapter = createFakeAdapter({ holdApplies: options.holdApplies ?? false });
  const list = createListView(maplace, view);
  document.body.append(list.element);
  const map = sizedContainer();
  const detach = maplace.attach(adapter, map);
  onTestFinished(() => {
    list.destroy();
    detach();
    map.remove();
  });
  const ids = () => optionsIn(list.element).map((option) => option.textContent);
  return {
    maplace,
    adapter,
    list,
    areaOnly: queried(list.element, ".maplace-area-only") as HTMLButtonElement,
    showAll: queried(list.element, ".maplace-show-all") as HTMLButtonElement,
    status: queried(list.element, ".maplace-empty-area"),
    detach,
    ids,
    listedCount: () => ids().length,
  };
}

/** `scopedList`, ready, at the view it fitted. */
export async function readyScopedList(...args: Parameters<typeof scopedList>) {
  const scoped = scopedList(...args);
  await scoped.adapter.finishMount();
  await scoped.maplace.whenReady();
  await scoped.adapter.probe().settle();
  return scoped;
}

/** The map moved, as a user would, to zoom 5 over (0, `lng`). */
export async function movedTo(
  maplace: ReturnType<typeof createMaplace>,
  adapter: FakeAdapter,
  lng: number,
): Promise<void> {
  maplace.setView({ lat: 0, lng }, 5);
  await adapter.probe().settle();
}
