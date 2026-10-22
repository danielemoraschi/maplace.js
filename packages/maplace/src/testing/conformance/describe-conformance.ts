import { afterEach, describe } from "vitest";
import { cameraChecks } from "./camera";
import { clusterChecks } from "./cluster";
import { containerChecks } from "./container";
import { controlChecks } from "./controls";
import { declarationChecks } from "./declarations";
import { drawingChecks } from "./drawing";
import { editingChecks } from "./editing";
import { capabilitiesOf, unmountAll } from "./harness";
import { lifecycleChecks } from "./lifecycle";
import { popupChecks } from "./popups";
import { presentationChecks } from "./presentation";
import { reportChecks } from "./reports";
import { routeChecks } from "./route";
import type { CheckGroup, ConformanceGroup, ConformanceSubject } from "./subject";

/**
 * The adapter contract as checks (T9): one suite every adapter runs in a browser: the fake, Google
 * and MapLibre. It drives an adapter as the store would, on a host that only records, and reads
 * the map through the subject's probe. It never imports an adapter, so no check can lean on one
 * adapter's code.
 */
export function describeConformance(subject: ConformanceSubject): void {
  // Read once, when the checks register: a capability check runs only where it applies.
  const supports = capabilitiesOf(subject);
  describe(`${subject.name} conformance`, () => {
    afterEach(unmountAll);
    for (const [name, checks] of Object.entries(GROUPS)) {
      // A group the adapter isn't built for yet shows as skipped, never as missing.
      if (isBuiltFor(subject, name as ConformanceGroup)) checks(subject, supports);
      else describe.skip(`${name} (not built yet)`, () => checks(subject, supports));
    }
  });
}

/** Complete, so a new group can't be left out; in the suite's order. */
const GROUPS: Readonly<Record<ConformanceGroup, CheckGroup>> = {
  declarations: declarationChecks,
  lifecycle: lifecycleChecks,
  drawing: drawingChecks,
  presentation: presentationChecks,
  popups: popupChecks,
  camera: cameraChecks,
  container: containerChecks,
  reports: reportChecks,
  editing: editingChecks,
  route: routeChecks,
  cluster: clusterChecks,
  controls: controlChecks,
};

function isBuiltFor({ groups }: ConformanceSubject, group: ConformanceGroup): boolean {
  return groups === undefined || groups.includes(group);
}
