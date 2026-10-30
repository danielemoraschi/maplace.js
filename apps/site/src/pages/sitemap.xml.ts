/// <reference types="astro/client" />
import { getEntry } from "astro:content";
import type { APIRoute } from "astro";
import { SEARCH_FACTS_ENTRY } from "../site/search-facts-loader.ts";
import { SITE_ROUTES } from "../site/site-routes.ts";
import { sitemapXml } from "../site/sitemap-xml.ts";

export const GET: APIRoute = async ({ site }) => {
  const facts = await getEntry("searchFacts", SEARCH_FACTS_ENTRY);
  if (facts === undefined) {
    throw new Error("the searchFacts collection has no entry (content.config.ts)");
  }
  const pages = SITE_ROUTES.map((route) => ({
    url: new URL(route, site).href,
    lastModified: facts.data.modifiedOn[route],
  }));
  return new Response(sitemapXml(pages), { headers: { "Content-Type": "application/xml" } });
};
