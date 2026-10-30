/// <reference types="astro/client" />
import { getCollection } from "astro:content";
import type { APIRoute, GetStaticPaths } from "astro";
import { markdownTwins } from "../site/markdown-twins.ts";

/** Each page with Markdown behind it, at `<its address>index.md` (W41). */
export const getStaticPaths = (async () => {
  const twins = markdownTwins({
    docs: await getCollection("docs"),
    changelog: await getCollection("changelog"),
    guides: await getCollection("exampleGuides"),
  });
  return twins.map(({ address, markdown }) => ({
    params: { twin: address.slice(1).replace(/\.md$/, "") },
    props: { markdown },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.markdown, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
