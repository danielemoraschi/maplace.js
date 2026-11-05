import type { APIRoute, GetStaticPaths } from "astro";
import { everyExampleStylesheet } from "../../../examples/example-sources.ts";

/** `/examples/styles/whats-on.css`: each stylesheet the examples' versions link, as written. */
export const getStaticPaths = (() =>
  everyExampleStylesheet().map(({ file, code }) => ({
    params: { stylesheet: file.replace(/\.css$/, "") },
    props: { code },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.code, { headers: { "Content-Type": "text/css; charset=utf-8" } });
