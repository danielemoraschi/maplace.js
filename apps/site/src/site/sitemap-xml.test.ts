import { describe, expect, it } from "vitest";
import { sitemapXml } from "./sitemap-xml.ts";

describe("sitemapXml", () => {
  const xml = sitemapXml([
    { url: "https://maplacejs.com/", lastModified: "2026-10-29" },
    { url: "https://maplacejs.com/store/", lastModified: "2026-10-30" },
  ]);

  it("lists each page with its date", () => {
    expect(xml).toContain(
      "<url><loc>https://maplacejs.com/</loc><lastmod>2026-10-29</lastmod></url>",
    );
    expect(xml).toContain(
      "<url><loc>https://maplacejs.com/store/</loc><lastmod>2026-10-30</lastmod></url>",
    );
  });

  it("writes an XML declaration and the sitemap namespace", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
  });
});
