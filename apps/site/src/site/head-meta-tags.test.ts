import { describe, expect, it } from "vitest";
import { headMetaTags, type MetaTag, OG_IMAGE } from "./head-meta-tags.ts";
import { SITE_MAINTAINER } from "./site-owner.ts";

const PAGE = {
  url: "https://maplacejs.com/store/",
  title: "Store",
  description: "The store.",
  imageUrl: "https://maplacejs.com/_astro/og.png",
};

function contentOf(tags: readonly MetaTag[], key: string): string | undefined {
  return tags.find((tag) => ("name" in tag ? tag.name : tag.property) === key)?.content;
}

describe("headMetaTags", () => {
  const tags = headMetaTags(PAGE);

  it("gives Open Graph and Twitter the page's title, description, URL and image", () => {
    const expected = {
      "og:title": PAGE.title,
      "og:description": PAGE.description,
      "og:url": PAGE.url,
      "og:image": PAGE.imageUrl,
      "og:image:width": String(OG_IMAGE.width),
      "og:image:height": String(OG_IMAGE.height),
      "og:image:alt": OG_IMAGE.alt,
      "twitter:card": "summary_large_image",
      "twitter:title": PAGE.title,
      "twitter:description": PAGE.description,
      "twitter:image": PAGE.imageUrl,
      "twitter:image:alt": OG_IMAGE.alt,
    };
    for (const [key, content] of Object.entries(expected)) {
      expect(contentOf(tags, key), key).toBe(content);
    }
  });

  it("names the author", () => {
    expect(contentOf(tags, "author")).toBe(SITE_MAINTAINER);
  });
});
