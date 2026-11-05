import type { APIRoute } from "astro";
import { type ServedExampleFile, servedExampleFiles } from "./example-data.ts";

// What the routes under `pages/examples/[...folder]/` serve: each file the examples use, at
// `/examples/` plus its path under `examples/`, as written. One route per extension, as Astro
// leaves a route alone under `trailingSlash: "always"` only when its file name ends in one.

/** A served file's route parts and what it sends: `data/icons/a.svg` is `data/icons`, `a`. */
interface ExampleFilePath {
  readonly params: { readonly folder: string; readonly name: string };
  readonly props: Pick<ServedExampleFile, "body" | "contentType">;
}

/** The static paths of the route for `extension`'s files: each one's folder and name. */
export function exampleFilePaths(extension: string): ExampleFilePath[] {
  return servedExampleFiles()
    .filter(({ path }) => path.endsWith(`.${extension}`))
    .map(({ path, body, contentType }) => {
      const slash = path.lastIndexOf("/");
      const name = path.slice(slash + 1, -`.${extension}`.length);
      return { params: { folder: path.slice(0, slash), name }, props: { body, contentType } };
    });
}

/** A served file, as written, with its type. */
export const serveExampleFile: APIRoute = ({ props }) =>
  new Response(props.body, { headers: { "Content-Type": props.contentType } });
