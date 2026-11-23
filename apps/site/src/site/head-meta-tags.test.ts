import { describe, expect, it } from "vitest";
import {
  firstTitleWithin,
  headMetaTags,
  type MetaTag,
  OG_IMAGE,
  pageTitle,
} from "./head-meta-tags.ts";
import { SITE_MAINTAINER } from "./site-owner.ts";

const PAGE = {
  url: "https://maplacejs.com/store/",
  title: "Store",
  description: "The store.",
  image: { url: "https://maplacejs.com/_astro/store.jpg", alt: "Store on a MapLibre map" },
};

function contentOf(tags: readonly MetaTag[], key: string): string | undefined {
  return tags.find((tag) => ("name" in tag ? tag.name : tag.property) === key)?.content;
}

describe("headMetaTags", () => {
  const tags = headMetaTags(PAGE);

  it("gives Open Graph and Twitter the page's title, description, URL, and its own image and alt", () => {
    const expected = {
      "og:title": PAGE.title,
      "og:description": PAGE.description,
      "og:url": PAGE.url,
      "og:image": PAGE.image.url,
      "og:image:width": String(OG_IMAGE.width),
      "og:image:height": String(OG_IMAGE.height),
      "og:image:alt": PAGE.image.alt,
      "twitter:card": "summary_large_image",
      "twitter:title": PAGE.title,
      "twitter:description": PAGE.description,
      "twitter:image": PAGE.image.url,
      "twitter:image:alt": PAGE.image.alt,
    };
    for (const [key, content] of Object.entries(expected)) {
      expect(contentOf(tags, key), key).toBe(content);
    }
  });

  it("names the author", () => {
    expect(contentOf(tags, "author")).toBe(SITE_MAINTAINER);
  });
});

describe("pageTitle", () => {
  it("keeps the site's name after a heading that fits it within 60 characters", () => {
    expect(pageTitle("API reference")).toBe("API reference · Maplace.js");
  });

  it("leaves a longer heading alone, the site's name shown by search apart", () => {
    const heading = "Marker clustering and heatmaps: Google Maps & MapLibre";
    expect(pageTitle(heading)).toBe(heading);
  });
});

describe("firstTitleWithin", () => {
  it("takes the first title within 60 characters, in the order given", () => {
    expect(firstTitleWithin(["x".repeat(61), "x".repeat(60), "y"], "short")).toBe("x".repeat(60));
  });

  it("falls back when none fits", () => {
    expect(firstTitleWithin(["x".repeat(70)], "y".repeat(65))).toBe("y".repeat(65));
  });
});
