import type { APIRoute, GetStaticPaths } from "astro";
import { exampleData } from "../examples/example-data.ts";

/** `/mixed-a.json` … `/mixed-e.json` and `/points-4k.json`, which `mixed` and `big` fetch. */
export const getStaticPaths = (() =>
  exampleData().map(({ name, json }) => ({
    params: { data: name },
    props: { json },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => Response.json(props.json);
