import { SITE_MAINTAINER } from "./site-owner.ts";

/** The site's name, wherever search and sharing show it. */
export const SITE_NAME = "Maplace.js";

/**
 * The site's sharing image, `src/assets/og-image.png`: its size every sharing image's, an example
 * page's own included (W65), and its alt the site's.
 */
export const OG_IMAGE = {
  width: 1200,
  height: 630,
  alt: "Maplace.js: JavaScript library for Google Maps and MapLibre.",
} as const;

/**
 * A page's own sharing image: its address, the site's path as an example's lookup gives it, made
 * absolute by `SearchMetadata` before `headMetaTags` writes it.
 */
export interface SharingImage {
  readonly url: string;
  readonly alt: string;
}

/** A `<meta>` tag: named, or by Open Graph's `property`. */
export type MetaTag =
  | { readonly name: string; readonly content: string }
  | { readonly property: string; readonly content: string };

/** A page as search and sharing show it; every address absolute. */
export interface SharedPage {
  readonly url: string;
  readonly title: string;
  readonly description: string;
  readonly image: SharingImage;
}

/** The author, Open Graph and Twitter tags of `page`. */
export function headMetaTags({ url, title, description, image }: SharedPage): readonly MetaTag[] {
  return [
    { name: "author", content: SITE_MAINTAINER },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:image", content: image.url },
    { property: "og:image:width", content: String(OG_IMAGE.width) },
    { property: "og:image:height", content: String(OG_IMAGE.height) },
    { property: "og:image:alt", content: image.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image.url },
    { name: "twitter:image:alt", content: image.alt },
  ];
}
