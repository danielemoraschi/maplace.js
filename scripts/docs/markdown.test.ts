import { describe, expect, it } from "vitest";
import {
  backticked,
  fencedBlocks,
  relativeLinksIn,
  section,
  tableRows,
  withAbsoluteLinks,
  withLinksResolved,
} from "./markdown.ts";

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

describe("withLinksResolved", () => {
  it("gives each link to a repo path, anchor included, the target `resolve` makes of it", () => {
    const resolve = (path: string) => `/site/${path.toLowerCase()}`;
    expect(withLinksResolved("[m](MIGRATION.md#options), ![i](a.png), [s](#s)", resolve)).toBe(
      "[m](/site/migration.md#options), ![i](a.png), [s](#s)",
    );
  });
});

describe("fencedBlocks", () => {
  it("is the code of each block fenced in that language, whatever the line endings", () => {
    const markdown =
      "```html \r\n<a></a>\r\n```\r\ntext\n```sh\nls\n```\n```html\n<b></b>\n<i></i>\n```";
    expect(fencedBlocks(markdown, "html")).toEqual(["<a></a>", "<b></b>\n<i></i>"]);
  });
});

describe("section", () => {
  const markdown = "# Doc\n### Events\nevents here\n\nmore\n### Next\nnot this";

  it("is the text from a heading to the next one", () => {
    expect(section(markdown, "### Events", "DOC.md")).toBe("events here\n\nmore");
  });

  it("reads past a fenced line that starts with #, a comment rather than a heading", () => {
    const fenced = "### Events\n```sh\n# a comment\n```\nafter\n### Next";
    expect(section(fenced, "### Events", "DOC.md")).toBe("```sh\n# a comment\n```\nafter");
  });

  it("throws naming the document when the heading is missing", () => {
    expect(() => section(markdown, "### Methods", "DOC.md")).toThrow(
      'DOC.md: no "### Methods" section',
    );
  });
});

describe("tableRows", () => {
  it("is each body row's cells, with neither header nor separator, indented tables too", () => {
    const text = [
      "Intro.",
      "| 0.2 | 1.0 |",
      "|---|---|",
      "| `a` | `b`, `c` |",
      "  | `d` \\| `e` | — |",
    ].join("\n");
    expect(tableRows(text)).toEqual([
      ["`a`", "`b`, `c`"],
      ["`d` \\| `e`", "—"],
    ]);
  });

  it("keeps a body row of dashes, telling header and separator by place, not by look", () => {
    expect(tableRows("| a | b |\n|---|---|\n| `c` | `d` |\n| - | - |")).toEqual([
      ["`c`", "`d`"],
      ["-", "-"],
    ]);
  });

  it("reads each table of a text, skipping the header and separator of each", () => {
    expect(tableRows("| h |\n|---|\n| a |\n\ntext\n\n| H |\n|---|\n| b |")).toEqual([["a"], ["b"]]);
  });

  it("keeps a row's last cell whole when the row has no closing pipe", () => {
    expect(tableRows("| a | b |\n|---|---|\n| `c` | `d`")).toEqual([["`c`", "`d`"]]);
  });
});

describe("backticked", () => {
  it("is each backticked name of a text, in order", () => {
    expect(backticked("`selectionChange` with `id` undefined, then the view")).toEqual([
      "selectionChange",
      "id",
    ]);
  });
});
