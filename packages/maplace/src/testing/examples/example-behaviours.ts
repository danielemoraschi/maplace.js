import { circles } from "./behaviours/circles";
import { customList } from "./behaviours/custom-list";
import { markers } from "./behaviours/markers";
import { menu } from "./behaviours/menu";
import { mixed, mixedWithoutRoute } from "./behaviours/mixed";
import { polygon } from "./behaviours/polygon";
import { polyline } from "./behaviours/polyline";
import type { ExampleBehaviour } from "./behaviours/reading";
import { route } from "./behaviours/route";
import { styled } from "./behaviours/styled";
import { tabs } from "./behaviours/tabs";
import type { Provider } from "./example-files";

export type { ExampleBehaviour } from "./behaviours/reading";

/** What each example does beyond drawing its locations, by name (`behaviours/<name>.ts`). */
const BEHAVIOURS: Readonly<Record<string, ExampleBehaviour>> = {
  markers,
  circles,
  menu,
  tabs,
  polyline,
  route,
  polygon,
  mixed,
  styled,
  "custom-list": customList,
};

/** Where a provider's version does otherwise: on MapLibre, mixed's group C has no route. */
const ON_PROVIDER: Readonly<Record<Provider, Readonly<Record<string, ExampleBehaviour>>>> = {
  google: {},
  maplibre: { mixed: mixedWithoutRoute },
};

/** What `example`'s version on `provider` does beyond drawing its locations, if anything. */
export function behaviourOf(provider: Provider, example: string): ExampleBehaviour | undefined {
  return ON_PROVIDER[provider][example] ?? BEHAVIOURS[example];
}
