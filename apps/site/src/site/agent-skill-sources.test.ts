import { describe, expect, it } from "vitest";
import { exampleFile } from "../examples/example-sources.ts";
import { codeList, docSection, exampleSnippet, pageUrl } from "./agent-skill-sources.ts";

const settings = {
  pin: { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` },
  blobBase: "https://github.com/o/r/blob/abc123/",
  site: "https://example.test",
};

describe("exampleSnippet", () => {
  it("is the example file word for word in a fence named by its extension", () => {
    const code = exampleFile("simple", "vanilla.ts").trimEnd();
    expect(exampleSnippet("simple", "vanilla.ts")).toBe(`\`\`\`ts\n${code}\n\`\`\``);
  });
});

describe("docSection", () => {
  it("takes the section without its heading, up to the next one", () => {
    const text = docSection("setup", "## Style URL", settings);
    expect(text).toMatch(/^On MapLibre a map's look/);
    expect(text).not.toContain("## ");
  });

  it("makes the page's rooted links absolute on the site", () => {
    expect(docSection("api", "## Errors", settings)).toContain("https://example.test/element/#");
  });

  it("makes a link to a heading of the page absolute on that page", () => {
    expect(docSection("store", "## Events", settings)).toContain(
      "https://example.test/store/#popup-options",
    );
  });

  it("sends a repo file that isn't a page to GitHub", () => {
    expect(docSection("api", "## Misuse codes", settings)).toContain(
      `${settings.blobBase}docs/rfc-1.0.md#errors`,
    );
  });

  it("refuses a page the site doesn't have", () => {
    expect(() => docSection("nowhere", "## Errors", settings)).toThrow(
      "nowhere isn't in REPO_DOCS",
    );
  });

  it("refuses a heading the page doesn't have, naming its file", () => {
    expect(() => docSection("api", "## Nothing", settings)).toThrow("docs/reference/api.md");
  });
});

describe("pageUrl", () => {
  it("is the route on the site", () => {
    expect(pageUrl("/element/", settings.site)).toBe("https://example.test/element/");
  });
});

describe("codeList", () => {
  it("writes each name as code", () => {
    expect(codeList(["a", "b"])).toBe("`a`, `b`");
  });
});
