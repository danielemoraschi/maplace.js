import type { APIRoute, GetStaticPaths } from "astro";
import { exampleIcons } from "../../examples/example-data.ts";

/** `/icons/a.svg` and the others, which the `markers` example's markers show. */
export const getStaticPaths = (() =>
  exampleIcons().map(({ name, svg }) => ({
    params: { icon: name },
    props: { svg },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(props.svg, { headers: { "Content-Type": "image/svg+xml" } });
