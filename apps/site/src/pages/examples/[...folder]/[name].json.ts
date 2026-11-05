import type { GetStaticPaths } from "astro";
import { exampleFilePaths } from "../../../examples/example-file-route.ts";

/** Each `.json` file the examples use, at `/examples/` plus its path under `examples/`. */
export const getStaticPaths = (() => exampleFilePaths("json")) satisfies GetStaticPaths;

export { serveExampleFile as GET } from "../../../examples/example-file-route.ts";
