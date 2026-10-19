import { describe, expect, it } from "vitest";
import { withLinksFromRoot } from "./doc-relative-links.ts";

const REFERENCE_PAGE = "docs/reference/element.md";

describe("withLinksFromRoot", () => {
  it("leaves a root document's links as they are", () => {
    const markdown = "[m](MIGRATION.md#options) [e](packages/maplace/examples/route/)";
    expect(withLinksFromRoot(markdown, "README.md")).toBe(markdown);
  });

  it("makes a sibling page's link a path from the root, anchor kept", () => {
    expect(withLinksFromRoot("[l](locations.md#markers)", REFERENCE_PAGE)).toBe(
      "[l](docs/reference/locations.md#markers)",
    );
  });

  it("resolves a link up the tree", () => {
    expect(withLinksFromRoot("[r](../rfc-1.0.md#errors)", REFERENCE_PAGE)).toBe(
      "[r](docs/rfc-1.0.md#errors)",
    );
  });

  it("resolves the path alone, the anchor kept as written", () => {
    expect(withLinksFromRoot("[s](./store.md#a/../b)", REFERENCE_PAGE)).toBe(
      "[s](docs/reference/store.md#a/../b)",
    );
  });

  it("keeps a directory's trailing slash", () => {
    expect(withLinksFromRoot("[r](../../packages/maplace/examples/route/)", REFERENCE_PAGE)).toBe(
      "[r](packages/maplace/examples/route/)",
    );
  });

  it("leaves URLs, anchors, rooted links, images and code as written", () => {
    const markdown = [
      "[u](https://x.y/a.md) [a](#here) [r](/locations/) ![i](icon.png)",
      "```md",
      "[c](locations.md)",
      "```",
    ].join("\n");
    expect(withLinksFromRoot(markdown, REFERENCE_PAGE)).toBe(markdown);
  });
});
