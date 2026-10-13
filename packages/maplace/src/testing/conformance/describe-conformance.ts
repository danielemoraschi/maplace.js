import { afterEach, describe } from "vitest";
import { cameraChecks } from "./camera";
import { capabilityChecks } from "./capabilities";
import { drawingChecks } from "./drawing";
import { capabilitiesOf, unmountAll } from "./harness";
import { lifecycleChecks } from "./lifecycle";
import { popupChecks } from "./popups";
import { presentationChecks } from "./presentation";
import { reportChecks } from "./reports";
import type { CheckGroup, ConformanceSubject } from "./subject";

/**
 * The adapter contract as checks (T9): one suite every adapter runs, the fake in node, Google and
 * later MapLibre in a browser. It drives an adapter as the store would, on a host that only
 * records, and reads the map through the subject's probe. It never imports an adapter, so no
 * check can lean on one adapter's code.
 */
export function describeConformance(subject: ConformanceSubject): void {
  // Read once, when the checks register: a capability check runs only where it applies.
  const supports = capabilitiesOf(subject);
  describe(`${subject.name} conformance`, () => {
    afterEach(unmountAll);
    for (const checks of GROUPS) checks(subject, supports);
  });
}

const GROUPS: readonly CheckGroup[] = [
  lifecycleChecks,
  drawingChecks,
  presentationChecks,
  popupChecks,
  cameraChecks,
  reportChecks,
  capabilityChecks,
];
