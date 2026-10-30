import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { API_LISTS } from "../../../../packages/maplace/src/__typetests__/api-lists.ts";
import { elementEventName } from "../../../../packages/maplace/src/element/event-forwarding.ts";
import { LOCATION_ATTRIBUTES } from "../../../../packages/maplace/src/element/location-attributes.ts";
import { eventPropName } from "../../../../packages/maplace/src/react/store-binding.ts";
import {
  EXAMPLE_PAGES,
  EXAMPLES,
} from "../../../../packages/maplace/src/testing/examples/example-files.ts";
import { CDN_SCRIPTS } from "../../../../scripts/build/cdn-builds.ts";
import { pinnedSnippetOf, withPinnedScripts } from "../../../../scripts/build/cdn-pins.ts";
import { readRootFile } from "../../../../scripts/build/package.ts";
import { fencedBlocks, isFence, relativeLinksIn } from "../../../../scripts/docs/markdown.ts";
import { agentSkillMarkdown } from "./agent-skill.ts";
import {
  AGENT_SKILL_DESCRIPTION,
  AGENT_SKILL_NAME,
  AGENT_SKILL_PATH,
} from "./agent-skill-paths.ts";
import { codeList } from "./agent-skill-sources.ts";
import {
  GOOGLE_PROVIDER_ATTRIBUTES,
  MAP_ATTRIBUTES,
  MAPLIBRE_PROVIDER_ATTRIBUTES,
} from "./element-attributes.ts";
import { installOf } from "./install-loader.ts";
import { LOCATION_FIELDS, SHAPE_STYLE_FIELDS, STORE_NAMES } from "./reference-names.ts";
import {
  GOOGLE_MAP_OPTIONS,
  MAP_ELEMENT_PROPERTIES,
  MAPLIBRE_MAP_OPTIONS,
  REACT_PROPS,
} from "./reference-names-bindings.ts";
import { docRoute, REPO_DOCS } from "./repo-docs.ts";

const SITE = "https://example.test";
const pin = { version: "1.2.3", integrityOf: (file: string) => `sha384-of-${file}` };
const settings = { pin, blobBase: "https://github.com/o/r/blob/abc123/", site: SITE };
const skill = agentSkillMarkdown(settings);

const FENCE_LANGS = ["html", "ts", "tsx", "sh"];
const fences = FENCE_LANGS.flatMap((lang) => fencedBlocks(skill, lang));

function expectAllNamed(names: readonly string[]): void {
  for (const name of names) expect(skill, name).toContain(`\`${name}\``);
}

/** The list printed whole, so one bullet dropped fails even if its names appear elsewhere. */
function expectListed(names: readonly string[]): void {
  expect(skill).toContain(codeList(names));
}

describe("the skill's frontmatter", () => {
  const frontmatter = parse(skill.split("---\n")[1] ?? "");

  it("opens the file, holding only name and description", () => {
    expect(skill.startsWith("---\n")).toBe(true);
    expect(Object.keys(frontmatter)).toEqual(["name", "description"]);
  });

  it("names the skill as the spec allows, as its folder", () => {
    expect(frontmatter.name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(frontmatter.name.length).toBeLessThanOrEqual(64);
    expect(frontmatter.name).toBe(AGENT_SKILL_NAME);
    expect(AGENT_SKILL_PATH.split("/").at(-2)).toBe(frontmatter.name);
  });

  it("describes it within the spec's 1024 characters, with no angle brackets", () => {
    expect(frontmatter.description).toBe(AGENT_SKILL_DESCRIPTION);
    expect(frontmatter.description.length).toBeLessThanOrEqual(1024);
    expect(frontmatter.description).not.toMatch(/[<>]/);
  });
});

describe("the skill's lists", () => {
  it("lists every event, in the store's, the element's and React's names", () => {
    expectAllNamed(API_LISTS.events);
    expectListed(API_LISTS.events.map(elementEventName));
    expectListed(API_LISTS.events.map(eventPropName));
  });

  it("lists every error code and capability", () => {
    expectAllNamed(API_LISTS.misuseCodes);
    expectAllNamed(API_LISTS.runtimeCodes);
    expectAllNamed(API_LISTS.capabilities);
  });

  it("lists every location field and shape style", () => {
    for (const fields of Object.values(LOCATION_FIELDS)) expectListed(fields);
    expectListed(SHAPE_STYLE_FIELDS);
  });

  it("lists every attribute and property of the elements", () => {
    expectListed(MAP_ATTRIBUTES);
    expectListed(GOOGLE_PROVIDER_ATTRIBUTES);
    expectListed(MAPLIBRE_PROVIDER_ATTRIBUTES);
    expectListed(LOCATION_ATTRIBUTES);
    expectListed(MAP_ELEMENT_PROPERTIES);
  });

  it("lists every option and method of the store and of the map calls", () => {
    expectListed(STORE_NAMES.options);
    expectListed(STORE_NAMES.popupOptions);
    expectListed(STORE_NAMES.methods);
    expectListed(GOOGLE_MAP_OPTIONS);
    expectListed(MAPLIBRE_MAP_OPTIONS);
  });

  it("lists every React prop", () => {
    for (const props of Object.values(REACT_PROPS)) expectListed(props);
  });
});

describe("what the skill teaches", () => {
  it("says what a map needs to load and to show", () => {
    for (const needed of ["`apiKey`", "`DEMO_MAP_ID`", "`bright`", "give the container a height"]) {
      expect(skill).toContain(needed);
    }
  });

  it("states the element's default height as its page does", () => {
    expect(skill).toContain("24rem tall");
    expect(readRootFile("docs/reference/element.md")).toContain("24rem tall");
  });

  it("shows a polygon on the element", () => {
    const page = EXAMPLE_PAGES.find(
      ({ name, provider }) => name === "polygon" && provider === "google",
    );
    expect(fencedBlocks(skill, "html")).toContain(page?.html.trimEnd());
  });

  it("shows the page each npm module mounts on", () => {
    const simple = EXAMPLES.filter(({ name }) => name === "simple");
    for (const { provider, vanilla } of simple) {
      expect(skill, provider).toContain(vanilla.html.trimEnd());
    }
  });

  it("links every page of the docs", () => {
    for (const { id } of REPO_DOCS) expect(skill).toContain(`](${SITE}${docRoute(id)})`);
  });

  it("tells 0.2's API from today's", () => {
    expect(skill).toContain("new Maplace(options).Load()");
    expect(skill).toContain(`${SITE}/migrating/`);
  });
});

describe("the skill's snippets", () => {
  const runnable = new Set(
    [
      ...EXAMPLE_PAGES.map(({ html }) => html),
      ...EXAMPLES.flatMap(({ script, vanilla, react }) => [
        script.html,
        vanilla.html,
        vanilla.moduleSource,
        react.moduleSource,
      ]),
      ...installOf(pin).providers.flatMap(({ cdnSnippet, npmCommand }) => [cdnSnippet, npmCommand]),
      pinnedSnippetOf(withPinnedScripts(readRootFile("README.md"), pin), CDN_SCRIPTS.cluster),
    ].map((code) => code.trim()),
  );

  it("are each a version the example runners run, or an install line", () => {
    expect(fences.length).toBeGreaterThan(0);
    for (const fence of fences) expect(runnable, fence).toContain(fence.trim());
  });

  it("are in no other language", () => {
    const fenceLines = skill.split("\n").filter(isFence);
    expect(fenceLines.length).toBe(fences.length * 2);
  });

  it("have the version and integrity filled in", () => {
    expect(skill).toContain("sha384-of-maplace-element-cluster.iife.js");
    expect(skill).toContain("maplace@1.2.3/dist/");
    expect(skill).toContain('integrity="sha384-of-');
    expect(skill).not.toContain("x.y.z");
  });
});

describe("the skill as a file", () => {
  it("has no link only the repo or the site can follow", () => {
    expect(relativeLinksIn(skill)).toEqual([]);
    expect(skill).not.toContain("](/");
    expect(skill).not.toContain("](#");
  });

  it("stays within what the spec recommends", () => {
    expect(skill.split("\n").length).toBeLessThanOrEqual(500);
    expect(skill.length).toBeLessThanOrEqual(20_000);
  });
});
