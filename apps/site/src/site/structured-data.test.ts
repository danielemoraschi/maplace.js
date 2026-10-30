import { describe, expect, it } from "vitest";
import { REPOSITORY_URL } from "./repo-docs.ts";
import { SITE_MAINTAINER } from "./site-owner.ts";
import { jsonLdText, structuredData } from "./structured-data.ts";

const PAGE = {
  url: "https://maplacejs.com/store/",
  title: "Store",
  description: "The store.",
  modifiedOn: "2026-10-30",
};
const LIBRARY = { name: "maplace", description: "A map.", version: "1.2.3", license: "MIT" };

const { "@graph": graph } = structuredData(PAGE, LIBRARY);
const nodeOfType = (type: string) => graph.find((node) => node["@type"] === type);

describe("structuredData", () => {
  it("describes the page, dated", () => {
    expect(nodeOfType("WebPage")).toMatchObject({
      "@id": `${PAGE.url}#webpage`,
      url: PAGE.url,
      name: PAGE.title,
      description: PAGE.description,
      dateModified: PAGE.modifiedOn,
    });
  });

  it("names the library with its repository, licence, npm package and version", () => {
    expect(nodeOfType("SoftwareSourceCode")).toMatchObject({
      name: "maplacejs",
      description: LIBRARY.description,
      codeRepository: REPOSITORY_URL,
      programmingLanguage: "TypeScript",
      license: "https://spdx.org/licenses/MIT.html",
      version: LIBRARY.version,
      sameAs: "https://www.npmjs.com/package/maplace",
    });
  });

  it("points the page and library at one author and one site by @id", () => {
    const author = { "@id": "https://maplacejs.com/#author" };
    expect(nodeOfType("Person")).toMatchObject({ ...author, name: SITE_MAINTAINER });
    expect(nodeOfType("WebSite")).toMatchObject({
      "@id": "https://maplacejs.com/#website",
      url: "https://maplacejs.com/",
      author,
    });
    expect(nodeOfType("SoftwareSourceCode")).toMatchObject({ author });
    expect(nodeOfType("WebPage")).toMatchObject({
      author,
      isPartOf: { "@id": "https://maplacejs.com/#website" },
      about: { "@id": "https://maplacejs.com/#library" },
    });
  });
});

describe("jsonLdText", () => {
  it("can't close the script it is written in", () => {
    const description = "</script><script>alert(1)</script>";
    const text = jsonLdText(structuredData({ ...PAGE, description }, LIBRARY));
    expect(text).not.toContain("<");
    expect(JSON.parse(text)["@graph"].at(-1).description).toBe(description);
  });
});
