import { describeConformance } from "../testing/conformance/describe-conformance";
import { GOOGLE_SUBJECT } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

describeWithMaps("on Maps JS", () =>
  describeConformance({
    ...GOOGLE_SUBJECT,
    // The groups G1 is built for; each row adds its own, and the last drops this list.
    groups: ["declarations", "lifecycle"],
  }),
);
