// Compile-time checks of the list view: each @ts-expect-error must stay an error.
import { createListView, createMaplace, type ListView } from "maplace";
import { expectTypeOf } from "vitest";

const shop = createMaplace({ locations: [{ id: "s", lat: 1, lng: 2, data: { price: 3 } }] });

const list = createListView(shop, {
  label: "Shops",
  fitAllLabel: "All shops",
  render: ({ location, selected }) => {
    expectTypeOf(location.data).toEqualTypeOf<{ price: number } | undefined>();
    expectTypeOf(selected).toEqualTypeOf<boolean>();
    return document.createTextNode(String(location.data?.price));
  },
});
expectTypeOf(list).toEqualTypeOf<ListView>();
expectTypeOf(list.element).toEqualTypeOf<HTMLElement>();

// @ts-expect-error the list is a listbox or a native select
createListView(shop, { as: "dropdown" });
// @ts-expect-error render returns a node, never an HTML string
createListView(shop, { render: () => "<b>Shop</b>" });
