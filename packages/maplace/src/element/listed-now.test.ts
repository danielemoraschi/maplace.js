import { expect, it } from "vitest";
import { createMaplace } from "../index";
import { listedNow } from "./listed-now";

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
  expect(listedNow(maplace).map(({ id }) => id)).toEqual(["b", "a", "c"]);
  maplace.setFilter(["south"]);
  expect(listedNow(maplace).map(({ id }) => id)).toEqual(["b", "c"]);
});

it("lists nothing without locations", () => {
  expect(listedNow(createMaplace())).toEqual([]);
});
