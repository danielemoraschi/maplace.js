// Compile-time checks of the list view: each @ts-expect-error must stay an error.
import {
  createListView,
  createMaplace,
  createMyLocationControl,
  distanceTo,
  type ListView,
  type MyLocationControl,
} from "maplace";
import { expectTypeOf } from "vitest";

const shop = createMaplace({ locations: [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }] });

const list = createListView(shop, {
  label: "Shops",
  heading: "Shops near you",
  fitAllLabel: "All shops",
  render: ({ location, selected }) => {
    expectTypeOf(location.data).toEqualTypeOf<{ price: number } | undefined>();
    expectTypeOf(selected).toEqualTypeOf<boolean>();
    return document.createTextNode(String(location.data?.price));
  },
});
expectTypeOf(list).toEqualTypeOf<ListView>();
expectTypeOf(list.element).toEqualTypeOf<HTMLElement>();
createListView(shop, {
  scope: "viewport",
  areaOnlyLabel: "Here only",
  showAllLabel: "Everything",
  emptyAreaLabel: "Nothing here",
});

createListView(shop, { groupCounts: true });
createListView(shop, { searchLabel: "Find", noMatchesLabel: "None", matchesLabel: "Found" });
// @ts-expect-error the box is named by text
createListView(shop, { searchLabel: true });
// @ts-expect-error groupCounts is on or off
createListView(shop, { groupCounts: "yes" });

// @ts-expect-error the list is a listbox or a native select
createListView(shop, { as: "dropdown" });
// @ts-expect-error render returns a node, never an HTML string
createListView(shop, { render: () => "<b>Shop</b>" });
// @ts-expect-error a heading is text, never a node
createListView(shop, { heading: document.createElement("h2") });
// @ts-expect-error a list scopes to the map's view only
createListView(shop, { scope: "world" });

createListView(shop, {
  sort: "distance",
  distanceUnit: "mile",
  render: ({ distance, distanceLabel }) => {
    expectTypeOf(distance).toEqualTypeOf<number | undefined>();
    expectTypeOf(distanceLabel).toEqualTypeOf<string | undefined>();
    return document.createTextNode(distanceLabel ?? "");
  },
});
// @ts-expect-error distance is the one sort
createListView(shop, { sort: "name" });
// @ts-expect-error kilometres or miles
createListView(shop, { distanceUnit: "yard" });

expectTypeOf(distanceTo({ lat: 1, lng: 2 }, { id: "a", lat: 1, lng: 2 })).toEqualTypeOf<number>();
const control: MyLocationControl = createMyLocationControl(shop, { label: "Near me" });
expectTypeOf(control.element).toEqualTypeOf<HTMLElement>();
// @ts-expect-error the corner is where the control is placed, not the control's
createMyLocationControl(shop, { position: "top-left" });
