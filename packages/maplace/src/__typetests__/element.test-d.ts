// Compile-time checks of the element: each @ts-expect-error must stay an error.
import {
  type Adapter,
  createListView,
  type Geometry,
  type LatLng,
  type LoadState,
  type Location,
  type Maplace,
  type MaplaceError,
  type Route,
} from "maplace";
import {
  defineListView,
  defineProvider,
  type ListViewFactory,
  type ListViewSetup,
  type MaplaceElementEventMap,
  type MaplaceLocationElement,
  type MaplaceMapElement,
} from "maplace/element";
import { expectTypeOf } from "vitest";

const map = document.createElement("maplace-map");
expectTypeOf(map).toEqualTypeOf<MaplaceMapElement>();
expectTypeOf(
  document.querySelector("maplace-location"),
).toEqualTypeOf<MaplaceLocationElement | null>();
expectTypeOf(map.maplace).toEqualTypeOf<Maplace>();
expectTypeOf(map.loadState).toEqualTypeOf<LoadState>();
expectTypeOf(map.route).toEqualTypeOf<Route | undefined>();
map.locations = [{ id: "a", lat: 1, lng: 2 }];
map.route = { stops: ["a", "b"] };
map.route = { stops: ["a", "b", "c"], via: ["b"] };
map.release();
expectTypeOf(map.sanitize).toEqualTypeOf<((html: string) => string) | undefined>();
map.sanitize = (html) => html;
// @ts-expect-error sanitize turns HTML into safe HTML, a string
map.sanitize = (html: string) => document.createTextNode(html);

// @ts-expect-error the load state is the element's to say
map.loadState = "ready";
declare const otherStore: Maplace;
// @ts-expect-error the store is the element's own
map.maplace = otherStore;
// @ts-expect-error a location's lat is a number, as in the store
map.locations = [{ id: "a", lat: "1", lng: 2 }];

declare const location: MaplaceLocationElement;
expectTypeOf(location.location).toEqualTypeOf<Location>();

expectTypeOf<MaplaceElementEventMap["maplace-selectionchange"]>().toEqualTypeOf<
  CustomEvent<{ readonly id: string | undefined }>
>();
expectTypeOf<
  MaplaceElementEventMap["maplace-popupopen"]["detail"]["element"]
>().toEqualTypeOf<HTMLElement>();
expectTypeOf<
  MaplaceElementEventMap["maplace-error"]["detail"]["error"]
>().toEqualTypeOf<MaplaceError>();
expectTypeOf<
  MaplaceElementEventMap["maplace-locationedit"]["detail"]["geometry"]
>().toEqualTypeOf<Geometry>();
expectTypeOf<
  MaplaceElementEventMap["maplace-mapclick"]["detail"]["position"]
>().toEqualTypeOf<LatLng>();
// @ts-expect-error event names are lower case, as DOM events are
expectTypeOf<MaplaceElementEventMap["maplace-popupOpen"]>();

defineProvider("mine", (element) => {
  expectTypeOf(element).toEqualTypeOf<MaplaceMapElement>();
  return {} as Adapter;
});
// @ts-expect-error a provider builds an adapter
defineProvider("mine", () => "google");

defineListView("checks", (maplace, { options, listed }) => {
  expectTypeOf(maplace).toEqualTypeOf<Maplace>();
  expectTypeOf(options.fitAllLabel).toEqualTypeOf<string | undefined>();
  expectTypeOf(options.scope).toEqualTypeOf<"viewport" | undefined>();
  expectTypeOf(options.searchAreaLabel).toEqualTypeOf<string | undefined>();
  expectTypeOf(listed()).toEqualTypeOf<readonly Location[]>();
  return createListView(maplace, options);
});
// @ts-expect-error a list view factory returns a ListView, not an element
defineListView("checks", () => document.createElement("div"));
expectTypeOf<ListViewFactory>().parameters.toEqualTypeOf<[Maplace, ListViewSetup]>();
