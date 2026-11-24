import { PACKAGE_NAME } from "./published-package.ts";

/** Where jsDelivr serves npm's files, and where it is asked to forget its copies. */
export const JSDELIVR_CDN = "https://cdn.jsdelivr.net";
export const JSDELIVR_PURGE = "https://purge.jsdelivr.net";

/** A file of the package under `spec` (`@1.3.0`, `@1`, `@latest`, or `""` for the bare package). */
export function jsDelivrPath(spec: string, file: string): string {
  return `/npm/${PACKAGE_NAME}${spec}/dist/${file}`;
}
