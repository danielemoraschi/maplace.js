import { brand } from "./behaviours/brand";
import { circles } from "./behaviours/circles";
import { clickToAdd } from "./behaviours/click-to-add";
import { cssMarkers } from "./behaviours/css-markers";
import { customList } from "./behaviours/custom-list";
import { linkToPlace } from "./behaviours/link-to-place";
import { liveData, liveDataWithoutRoute } from "./behaviours/live-data";
import { loadOnDemand } from "./behaviours/load-on-demand";
import { markers } from "./behaviours/markers";
import { menu } from "./behaviours/menu";
import { mixed } from "./behaviours/mixed";
import { nearest } from "./behaviours/nearest";
import { polygon } from "./behaviours/polygon";
import { polyline } from "./behaviours/polyline";
import { popups } from "./behaviours/popups";
import type { ExampleBehaviour } from "./behaviours/reading";
import { route } from "./behaviours/route";
import { search } from "./behaviours/search";
import { styledOnGoogle, styledOnMapLibre } from "./behaviours/styled";
import { tabs } from "./behaviours/tabs";
import { tags } from "./behaviours/tags";
import { thisArea } from "./behaviours/this-area";
import { unstyled } from "./behaviours/unstyled";
import { whatsOn } from "./behaviours/whats-on";
import type { Provider } from "./example-files";

export type { ExampleBehaviour } from "./behaviours/reading";

/** What each example does beyond drawing its locations, by name (`behaviours/<name>.ts`). */
const BEHAVIOURS: Readonly<Record<string, ExampleBehaviour>> = {
  markers,
  popups,
  "click-to-add": clickToAdd,
  circles,
  menu,
  tabs,
  search,
  nearest,
  "this-area": thisArea,
  tags,
  polyline,
  route,
  polygon,
  mixed,
  "live-data": liveData,
  "load-on-demand": loadOnDemand,
  "link-to-place": linkToPlace,
  "custom-list": customList,
  "css-markers": cssMarkers,
  brand,
  "whats-on": whatsOn,
  unstyled,
};

/**
 * Where a provider's version does otherwise: on MapLibre, live-data has no route, nor a button for
 * one; styled offers each provider's own looks.
 */
const ON_PROVIDER: Readonly<Record<Provider, Readonly<Record<string, ExampleBehaviour>>>> = {
  google: { styled: styledOnGoogle },
  maplibre: { "live-data": liveDataWithoutRoute, styled: styledOnMapLibre },
};

/** What `example`'s version on `provider` does beyond drawing its locations, if anything. */
export function behaviourOf(provider: Provider, example: string): ExampleBehaviour | undefined {
  return ON_PROVIDER[provider][example] ?? BEHAVIOURS[example];
}
