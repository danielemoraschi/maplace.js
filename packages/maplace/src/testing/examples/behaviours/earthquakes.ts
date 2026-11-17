import { expect } from "vitest";
import { type ExampleBehaviour, inputLabelled, listedIn, typeInSearch } from "./reading";

/** The quakes in earthquakes.json: the USGS's of magnitude 4.5 and up, over a month. */
const QUAKES = 684;
/** The volcanoes in volcanoes.json, none of them in Japan. */
const VOLCANOES = 12;
/** The quakes whose place names Japan. */
const IN_JAPAN = 51;

/**
 * The quakes drawn as heat, each weighing its magnitude, the volcanoes as pins; the list's search
 * narrows the heat with the list: "Japan" leaves Japan's quakes alone, an empty box every location.
 * The list's checkbox for each group shows a group alone, keeping what the search found.
 */
export const earthquakes: ExampleBehaviour = async ({ store, adapter, root }) => {
  await expect.poll(() => store.getSnapshot().locations.length).toBe(QUAKES + VOLCANOES);
  const probe = adapter.probe();
  const quake = store.getSnapshot().locations.find(({ group }) => group === "Quakes");
  expect(quake && probe.location(quake.id)?.visible).toBe(true);
  expect(probe.location("etna")?.visible).toBe(true);
  typeInSearch(root, "Japan");
  await expect.poll(() => listedIn(root)).toHaveLength(IN_JAPAN);
  expect(probe.location("etna")?.visible).toBe(false);
  // The first quake, south of the Kermadec Islands, leaves the heat with the list.
  expect(quake && probe.location(quake.id)?.visible).toBe(false);

  const toggle = (label: string) => inputLabelled(root, label).click();
  toggle("Volcanoes");
  await expect.poll(() => store.getSnapshot().filter?.groups).toEqual(["Quakes"]);
  expect(listedIn(root)).toHaveLength(IN_JAPAN);
  toggle("Volcanoes");

  typeInSearch(root, "");
  await expect.poll(() => listedIn(root)).toHaveLength(QUAKES + VOLCANOES);
  expect(quake && probe.location(quake.id)?.visible).toBe(true);
  toggle("Quakes");
  await expect.poll(() => listedIn(root)).toHaveLength(VOLCANOES);
  expect(quake && probe.location(quake.id)?.visible).toBe(false);
  expect(probe.location("etna")?.visible).toBe(true);
  toggle("Quakes");
  await expect.poll(() => listedIn(root)).toHaveLength(QUAKES + VOLCANOES);
};
