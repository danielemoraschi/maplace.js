import type { Crumb } from "./breadcrumbs.ts";
import { SITE_NAME } from "./head-meta-tags.ts";
import { REPOSITORY_URL } from "./repo-docs.ts";
import type { LibraryFacts } from "./search-facts-loader.ts";
import { SITE_MAINTAINER } from "./site-owner.ts";

/** A page as its JSON-LD describes it. */
export interface DescribedPage {
  readonly url: string;
  readonly title: string;
  readonly description: string;
  /** `YYYY-MM-DD`. */
  readonly modifiedOn: string;
  /** Its trail from the home page (`breadcrumbs.ts`); none for the home page. */
  readonly trail?: readonly Crumb[] | undefined;
}

/** A node of the graph. */
type GraphNode = Readonly<Record<string, unknown>>;

/** The `@id`s the graph's nodes point at each other by, under the site's origin. */
function nodeIds(origin: string) {
  return {
    site: { "@id": `${origin}/#website` },
    library: { "@id": `${origin}/#library` },
    author: { "@id": `${origin}/#author` },
  };
}

type NodeIds = ReturnType<typeof nodeIds>;

function webSite(origin: string, ids: NodeIds): GraphNode {
  return {
    ...ids.site,
    "@type": "WebSite",
    url: `${origin}/`,
    name: SITE_NAME,
    author: ids.author,
  };
}

function softwareSourceCode(library: LibraryFacts, ids: NodeIds): GraphNode {
  return {
    ...ids.library,
    "@type": "SoftwareSourceCode",
    name: SITE_NAME,
    description: library.description,
    codeRepository: REPOSITORY_URL,
    programmingLanguage: "TypeScript",
    license: `https://spdx.org/licenses/${library.license}.html`,
    version: library.version,
    sameAs: `https://www.npmjs.com/package/${library.name}`,
    author: ids.author,
  };
}

function person(ids: NodeIds): GraphNode {
  return { ...ids.author, "@type": "Person", name: SITE_MAINTAINER };
}

function webPage(page: DescribedPage, ids: NodeIds): GraphNode {
  return {
    "@id": `${page.url}#webpage`,
    "@type": "WebPage",
    url: page.url,
    name: page.title,
    description: page.description,
    dateModified: page.modifiedOn,
    isPartOf: ids.site,
    about: ids.library,
    author: ids.author,
    ...(page.trail && { breadcrumb: breadcrumbId(page.url) }),
  };
}

const breadcrumbId = (url: string) => ({ "@id": `${url}#breadcrumb` });

/** The page's trail, each step's address absolute: search shows it in place of the URL. */
function breadcrumbList(url: string, trail: readonly Crumb[]): GraphNode {
  return {
    ...breadcrumbId(url),
    "@type": "BreadcrumbList",
    itemListElement: trail.map(({ name, path }, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: new URL(path, url).href,
    })),
  };
}

/** The Schema.org graph of `page`: the site, the library, the author, the page and its trail. */
export function structuredData(page: DescribedPage, library: LibraryFacts) {
  const { origin } = new URL(page.url);
  const ids = nodeIds(origin);
  return {
    "@context": "https://schema.org",
    "@graph": [
      webSite(origin, ids),
      softwareSourceCode(library, ids),
      person(ids),
      webPage(page, ids),
      ...(page.trail ? [breadcrumbList(page.url, page.trail)] : []),
    ],
  };
}

/** `data` as the text of a `<script>`: with no `<`, nothing in it can close the script. */
export function jsonLdText(data: object): string {
  return JSON.stringify(data).replaceAll("<", String.raw`\u003c`);
}
