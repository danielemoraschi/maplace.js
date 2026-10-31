import { type ControlPosition, MY_LOCATION_CORNER } from "../adapter";
import type { MyLocationOptions } from "../index";
import { CORNERS, oneOfAttribute } from "./element-list";
import { nonBlank } from "./store-labels";

/** The control `my-location-label` asks for, and its corner. */
export interface MyLocationAsked {
  readonly corner: ControlPosition;
  readonly options: MyLocationOptions;
}

/** Read as the map opens, before the provider builds, so a bad corner leaves nothing behind. */
export function myLocationAsked(host: HTMLElement): MyLocationAsked | undefined {
  if (!host.hasAttribute("my-location-label")) return undefined;
  return {
    corner: oneOfAttribute(host, "my-location-position", CORNERS) ?? MY_LOCATION_CORNER,
    options: {
      label: nonBlank(host.getAttribute("my-location-label")),
      unavailableLabel: nonBlank(host.getAttribute("my-location-unavailable-label")),
    },
  };
}
