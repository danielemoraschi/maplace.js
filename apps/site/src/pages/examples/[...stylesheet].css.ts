import type { APIRoute, GetStaticPaths } from "astro";
import { stylesheetHref } from "../../examples/example-file-links.ts";
import { everyExampleStylesheet } from "../../examples/example-sources.ts";

/** `/examples/` and `.css` around the route's param, which `stylesheetHref` puts between them. */
const AROUND_PARAM = /^\/examples\/|\.css$/g;

/** `/examples/whats-on/whats-on.css`: each stylesheet an example's versions link, as written. */
export const getStaticPaths = (() =>
  everyExampleStylesheet().map((stylesheet) => ({
    params: { stylesheet: stylesheetHref(stylesheet).replaceAll(AROUND_PARAM, "") },
    props: { code: stylesheet.code },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.code, { headers: { "Content-Type": "text/css; charset=utf-8" } });
