import { circles } from "./behaviours/circles";
import { customList } from "./behaviours/custom-list";
import { markers } from "./behaviours/markers";
import { menu } from "./behaviours/menu";
import { mixed } from "./behaviours/mixed";
import { polygon } from "./behaviours/polygon";
import { polyline } from "./behaviours/polyline";
import type { ExampleBehaviour } from "./behaviours/reading";
import { route } from "./behaviours/route";
import { styled } from "./behaviours/styled";
import { tabs } from "./behaviours/tabs";

export type { ExampleBehaviour } from "./behaviours/reading";

/** What each example does beyond drawing its locations, by name (`behaviours/<name>.ts`). */
export const EXAMPLE_BEHAVIOURS: Readonly<Record<string, ExampleBehaviour>> = {
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
