import {
  PROVIDER_POINTS,
  PROVIDERS_CONSENT_HREF,
  PROVIDERS_CONSENT_LEAD,
  PROVIDERS_CONSENT_LINK,
  PROVIDERS_HEADING,
  PROVIDERS_PRIVACY,
} from "../examples/home-page.ts";
import { homeIndexMarkdown } from "./example-index-markdown.ts";

/** What the home page's twin says under its heading and intro: the index, then the providers. */
export function homeMarkdown(): string {
  return `${homeIndexMarkdown()}\n\n${providersMarkdown()}`;
}

/** The home page's two providers (`MapProviders.astro`), as Markdown: each its points, then why a map waits. */
function providersMarkdown(): string {
  const providers = PROVIDER_POINTS.map(({ name, points }) => {
    const list = points.map(({ text }) => `- ${text}`).join("\n");
    return `### ${name}\n\n${list}`;
  });
  const privacy = `${PROVIDERS_PRIVACY} ${PROVIDERS_CONSENT_LEAD} [${PROVIDERS_CONSENT_LINK}](${PROVIDERS_CONSENT_HREF}).`;
  return [`## ${PROVIDERS_HEADING}`, ...providers, privacy].join("\n\n");
}
