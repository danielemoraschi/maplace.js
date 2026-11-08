// Run by scripts/checks/kit-in-browser.ts in Vitest's browser mode, from the packed package.
import { describeConformance } from "@maplacejs/maplace/testing";
import { myAdapter } from "../testing.js";

describeConformance(myAdapter);
