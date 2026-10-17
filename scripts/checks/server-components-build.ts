// Run by server-components.ts in a child process, with the app as the working directory (Vite's
// root, and where the RSC plugin finds the app's client packages). Prints what the build and its
// render show.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import rsc from "@vitejs/plugin-rsc";
import { createBuilder } from "vite";

/** Only the binding's own code has this text: `useMaplace`'s misuse message. */
const BINDING_MARK = "needs a <MaplaceProvider> above it";

/** How the RSC plugin stands in for a client module's export on the server. */
const PROVIDER_REFERENCE = /registerClientReference\([\s\S]{0,300}?"MaplaceProvider"\)/;

const entries = {
  rsc: "./src/entry.rsc.tsx",
  ssr: "./src/entry.ssr.tsx",
  client: "./src/entry.browser.tsx",
};

const builder = await createBuilder({
  configFile: false,
  logLevel: "error",
  plugins: [rsc({ entries, serverHandler: false })],
});
await builder.buildApp();

const { default: handler } = await import(
  pathToFileURL(join(process.cwd(), "dist/rsc/index.js")).href
);
const page = (path: string): Promise<string> =>
  handler(new Request(`http://localhost${path}`)).then((response: Response) => response.text());

process.stdout.write(
  JSON.stringify({
    html: await page("/"),
    payload: await page("/.rsc"),
    serverRefersToBinding: refersToBinding("dist/rsc"),
    clientHoldsBinding: holdsBinding("dist/client"),
  }),
);

/** The server build has a client reference for `MaplaceProvider`, and none of its code. */
function refersToBinding(dir: string): boolean {
  const code = outputCode(dir);
  return PROVIDER_REFERENCE.test(code) && !code.includes(BINDING_MARK);
}

/**
 * The client build has the binding's code, to hydrate the page with. Also what keeps
 * `BINDING_MARK` honest: were the message reworded, this would fail, not the server check pass.
 */
function holdsBinding(dir: string): boolean {
  return outputCode(dir).includes(BINDING_MARK);
}

/** Every JavaScript file a build wrote under `dir`, as one text. */
function outputCode(dir: string): string {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".js"))
    .map((file) => readFileSync(join(dir, file), "utf8"))
    .join("\n");
}
