import { pageOf } from "./example-files";
import { OPENFREEMAP_BRIGHT } from "./openfreemap-styles";

/** A page's `<maplace-map>` `map-style`, read without a DOM: the site's tests run in node. */
const MAP_STYLE = /<maplace-map[^>]*\smap-style="([^"]+)"/;

/** The style `example`'s MapLibre versions open on: its page's `map-style`, else the default. */
export function openingStyleOf(example: string): string {
  return MAP_STYLE.exec(pageOf(example, "maplibre").html)?.[1] ?? OPENFREEMAP_BRIGHT;
}
