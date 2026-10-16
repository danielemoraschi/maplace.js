import { describe, expect, it } from "vitest";
import { relativeLinksIn, withAbsoluteLinks } from "./markdown.ts";

describe("relativeLinksIn", () => {
  it("finds links and images to repo paths, by line, without their anchors", () => {
    const markdown = [
      "# Title",
      "See [the RFC](docs/rfc-1.0.md#errors) and [examples](packages/maplace/examples/).",
      "![a map](docs/map.png), [a site](https://example.com), [a section](#below), [root](/x)",
    ].join("\n");
    expect(relativeLinksIn(markdown)).toEqual([
      { path: "docs/rfc-1.0.md", line: 2 },
      { path: "packages/maplace/examples/", line: 2 },
      { path: "docs/map.png", line: 3 },
    ]);
  });

  it("skips code fences, where a link is code", () => {
    expect(relativeLinksIn("```md\n[x](missing.md)\n```\n[y](here.md)")).toEqual([
      { path: "here.md", line: 4 },
    ]);
  });
});

describe("withAbsoluteLinks", () => {
  const BLOB = "https://github.com/o/r/blob/v1.0.0/";

  it("makes links to repo paths absolute, and leaves images, URLs and anchors as written", () => {
    expect(
      withAbsoluteLinks(
        "![a map](docs/map.png), [the RFC](docs/rfc.md), [x](https://x.y), [s](#s)",
        BLOB,
      ),
    ).toBe(`![a map](docs/map.png), [the RFC](${BLOB}docs/rfc.md), [x](https://x.y), [s](#s)`);
  });

  it("leaves code fences as written, the same rule the link check reads by", () => {
    expect(withAbsoluteLinks("```md\n[x](a.md)\n```\n[y](b.md)", BLOB)).toBe(
      `\`\`\`md\n[x](a.md)\n\`\`\`\n[y](${BLOB}b.md)`,
    );
  });
});
