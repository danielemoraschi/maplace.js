import { buildPackage } from "./build/build-package.ts";
import { DIST, PACKED } from "./build/package.ts";

/** `npm run build`: `dist` and the package as npm packs it. */
await buildPackage();
console.log(`Built ${DIST}, staged ${PACKED}.`);
