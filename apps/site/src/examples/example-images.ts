import { basename } from "node:path";
import type { ImageMetadata } from "astro";
import type { SharingImage } from "../site/head-meta-tags.ts";
import type { ExampleSection } from "./example-groups.ts";

// Each example's pictures, captured by `scripts/example-shots.ts` (W65): its thumbnail, which the
// site resizes, and its sharing image, served as it is. Absent while the script's own build runs,
// before there are any: `example-images.test.ts` holds every example to having both.
const THUMBNAILS = byName(
  import.meta.glob<ImageMetadata>("../assets/shots/thumbnails/*.jpg", {
    import: "default",
    eager: true,
  }),
);
const SHARING_IMAGES = byName(
  import.meta.glob<string>("../assets/shots/sharing/*.jpg", {
    query: "?no-inline",
    import: "default",
    eager: true,
  }),
);

/** `section`'s thumbnail, for the lists of examples. */
export function thumbnailOf(section: ExampleSection): ImageMetadata | undefined {
  return THUMBNAILS.get(section.name);
}

/** `section`'s page's sharing image. */
export function sharingImageOf(section: ExampleSection): SharingImage | undefined {
  const url = SHARING_IMAGES.get(section.name);
  return url === undefined ? undefined : { url, alt: `${section.title} on a MapLibre map` };
}

/** A glob's modules by their file's name, without its extension: `route` for `…/route.jpg`. */
function byName<Module>(globbed: Record<string, Module>): ReadonlyMap<string, Module> {
  return new Map(Object.entries(globbed).map(([path, module]) => [basename(path, ".jpg"), module]));
}
