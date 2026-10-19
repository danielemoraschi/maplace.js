import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "../build/package.ts";
import { newTempDir, removeTempDir } from "../build/temp-dir.ts";

const APP_SOURCE = join(import.meta.dirname, "rsc-app");
const BUILD_AND_RENDER_FILE = "server-components-build.ts";
const BUILD_AND_RENDER = join(import.meta.dirname, BUILD_AND_RENDER_FILE);
const RUN = "the RSC app's build and render";

/** What a React Server Components app shows of maplace, built and rendered as a page's would be. */
export interface ServerComponentsRender {
  /** The page's HTML, rendered on the server. */
  readonly html: string;
  /** The page's RSC stream: what the server component hands the client, its data included. */
  readonly payload: string;
  /** The server build refers to the binding as a client reference, and runs none of it. */
  readonly serverRefersToBinding: boolean;
  /** The client build holds the binding, to hydrate with. */
  readonly clientHoldsBinding: boolean;
}

/**
 * Builds the server-components app in `rsc-app/` with Vite's RSC plugin against the package
 * installed at `installed`, and renders its page. The app lives outside `node_modules` (Node strips
 * no types there, and Vite takes what's there for dependencies), under the git-ignored `.vitest/`,
 * so React and the plugin resolve to the repo's own; maplace is a link to the installed package.
 */
export function renderServerComponentsApp(installed: string): ServerComponentsRender {
  const app = newTempDir("rsc-app", join(ROOT, ".vitest"));
  try {
    layOutApp(app, installed);
    const run = spawnSync(process.execPath, [BUILD_AND_RENDER], { cwd: app, encoding: "utf8" });
    if (run.error) {
      throw new Error(`${RUN} (${BUILD_AND_RENDER_FILE}) didn't start`, { cause: run.error });
    }
    if (run.status !== 0) throw new Error(`the RSC app failed to build or render:\n${run.stderr}`);
    return renderIn(run.stdout);
  } finally {
    removeTempDir(app);
  }
}

function layOutApp(app: string, installed: string): void {
  cpSync(APP_SOURCE, app, { recursive: true });
  mkdirSync(join(app, "node_modules"));
  symlinkSync(installed, join(app, "node_modules", "maplace"), "dir");
}

/** The render the run printed as JSON, or its output when it printed something else. */
function renderIn(stdout: string): ServerComponentsRender {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(`${RUN} printed no JSON:\n${stdout}`, { cause: error });
  }
}
