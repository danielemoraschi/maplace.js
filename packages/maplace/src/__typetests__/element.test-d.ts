// Compile-time checks of the element: each @ts-expect-error must stay an error.
import type { Adapter, LoadState, Location, Maplace, MaplaceError, Route } from "maplace";
import {
  defineProvider,
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

expectTypeOf<MaplaceElementEventMap["maplace-select"]>().toEqualTypeOf<
  CustomEvent<{ readonly id: string | undefined }>
>();
expectTypeOf<
  MaplaceElementEventMap["maplace-popupopen"]["detail"]["element"]
>().toEqualTypeOf<HTMLElement>();
expectTypeOf<
  MaplaceElementEventMap["maplace-error"]["detail"]["error"]
>().toEqualTypeOf<MaplaceError>();
// @ts-expect-error event names are lower case, as DOM events are
expectTypeOf<MaplaceElementEventMap["maplace-popupOpen"]>();

defineProvider("mine", (element) => {
  expectTypeOf(element).toEqualTypeOf<MaplaceMapElement>();
  return {} as Adapter;
});
// @ts-expect-error a provider builds an adapter
defineProvider("mine", () => "google");
