import { describeConformance } from "../testing/conformance/describe-conformance";
import { GOOGLE_SUBJECT, PAGE_MAP_SUBJECT } from "./testing/subject";
import { describeWithMaps } from "./testing/with-maps";

describeWithMaps("on Maps JS", () => {
  describeConformance(GOOGLE_SUBJECT);
  describeConformance(PAGE_MAP_SUBJECT);
});
