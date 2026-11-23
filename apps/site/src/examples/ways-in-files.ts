// What the home page's four ways in show of the Simple example (W66): the part a reader writes,
// its page whole, a module without its host page, React's component without the mount every
// React app has. The example's own page shows every file, as the tests run them.
import { HOST_FILES } from "./bootstrap-fold.ts";
import type { ExampleCode, ExampleFile } from "./example-sources.ts";

/** The files the four ways show of `code`: its page, or its module without its host page. */
export function waysInFiles(code: ExampleCode): readonly ExampleFile[] {
  const written = code.files.filter(({ file }) => !HOST_FILES.has(file));
  if (code.kind !== "react") return written;
  return written.map((module) => ({
    ...module,
    code: componentOf(module.code, `examples/${code.folder}/${module.file}`),
  }));
}

/** The imports only a mount needs, and the mount itself, from `createRoot(` to the file's end. */
const MOUNT_IMPORTS = /^import \{ (?:StrictMode|createRoot) \} from "react(?:-dom\/client)?";\n/gm;
const MOUNT = "\ncreateRoot(";

/**
 * React `source`'s component, exported, without the mount (`createRoot(…).render(…)`) and its
 * imports; throws, naming the file at `where`, for one with no mount to cut.
 */
export function componentOf(source: string, where: string): string {
  const mount = source.indexOf(MOUNT);
  if (mount === -1) throw new Error(`${where} has no createRoot mount to leave out`);
  return source
    .slice(0, mount)
    .replaceAll(MOUNT_IMPORTS, "")
    .replace(/^function /m, "export function ")
    .trimEnd();
}
