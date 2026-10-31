import { big } from "./behaviours/big";
import { brand } from "./behaviours/brand";
import { circles } from "./behaviours/circles";
import { cssMarkers } from "./behaviours/css-markers";
import { customList } from "./behaviours/custom-list";
import { markers } from "./behaviours/markers";
import { menu } from "./behaviours/menu";
import { mixed, mixedWithoutRoute } from "./behaviours/mixed";
import { polygon } from "./behaviours/polygon";
import { polyline } from "./behaviours/polyline";
import type { ExampleBehaviour } from "./behaviours/reading";
import { route } from "./behaviours/route";
import { search } from "./behaviours/search";
import { styledOnGoogle, styledOnMapLibre } from "./behaviours/styled";
import { tabs } from "./behaviours/tabs";
import { tags } from "./behaviours/tags";
import { unstyled } from "./behaviours/unstyled";
import type { Provider } from "./example-files";

export type { ExampleBehaviour } from "./behaviours/reading";

/** What each example does beyond drawing its locations, by name (`behaviours/<name>.ts`). */
const BEHAVIOURS: Readonly<Record<string, ExampleBehaviour>> = {
  markers,
  circles,
  menu,
  tabs,
  search,
  tags,
  polyline,
  route,
  polygon,
  mixed,
  "custom-list": customList,
  "css-markers": cssMarkers,
  brand,
  unstyled,
  big,
};

/**
 * Where a provider's version does otherwise: on MapLibre, mixed has no route, nor a button for
 * one; styled offers each provider's own looks.
 */
const ON_PROVIDER: Readonly<Record<Provider, Readonly<Record<string, ExampleBehaviour>>>> = {
  google: { styled: styledOnGoogle },
  maplibre: { mixed: mixedWithoutRoute, styled: styledOnMapLibre },
};

/** What `example`'s version on `provider` does beyond drawing its locations, if anything. */
export function behaviourOf(provider: Provider, example: string): ExampleBehaviour | undefined {
  return ON_PROVIDER[provider][example] ?? BEHAVIOURS[example];
}
