import { describe, expect, it } from "vitest";
import { withSiteLinks } from "./site-links.ts";

const links = {
  routes: { "MIGRATION.md": "/migrating/" },
  blobBase: "https://github.com/o/r/blob/next/",
};

describe("withSiteLinks", () => {
  it("sends a link to a document the site renders to its page, anchor kept", () => {
    expect(withSiteLinks("See [MIGRATION.md](MIGRATION.md#options).", links)).toBe(
      "See [MIGRATION.md](/migrating/#options).",
    );
  });

  it("sends a link to any other repo path to the repo", () => {
    expect(withSiteLinks("[the RFC](docs/rfc-1.0.md)", links)).toBe(
      "[the RFC](https://github.com/o/r/blob/next/docs/rfc-1.0.md)",
    );
  });

  it("leaves URLs, anchors and code as written", () => {
    const markdown = "[x](https://x.y) [s](#s)\n```md\n[m](MIGRATION.md)\n```";
    expect(withSiteLinks(markdown, links)).toBe(markdown);
  });
});
