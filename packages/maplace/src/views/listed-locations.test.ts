import { expect, it } from "vitest";
import { createMaplace, listedLocations } from "../index";

const at = { lat: 0, lng: 0 };

it("lists the shown, listed locations in data order, whatever their groups", () => {
  const maplace = createMaplace({
    locations: [
      { id: "b", ...at, group: "south" },
      { id: "hidden", ...at, visible: false },
      { id: "unlisted", ...at, listed: false },
      { id: "a", ...at, group: "north" },
      { id: "c", ...at, group: "south" },
    ],
  });
  const ids = () => listedLocations(maplace.getSnapshot()).map(({ id }) => id);
  expect(ids()).toEqual(["b", "a", "c"]);
  maplace.setFilter(["south"]);
  expect(ids()).toEqual(["b", "c"]);
});

it("lists nothing without locations", () => {
  expect(listedLocations(createMaplace().getSnapshot())).toEqual([]);
});
