import type { APIRoute, GetStaticPaths } from "astro";
import { exampleData } from "../examples/example-data.ts";

/** `/locations.json` and `/points-4k.json`, which the `mixed` and `big` pages fetch. */
export const getStaticPaths = (() =>
  exampleData().map(({ name, json }) => ({
    params: { data: name },
    props: { json },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.json);
