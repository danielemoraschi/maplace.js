import { afterEach } from "vitest";
import { describeConformance } from "../testing/conformance/describe-conformance";
import { MAPLIBRE_SUBJECT, PAGE_MAP_SUBJECT, removePageMaps } from "./testing/subject";

afterEach(removePageMaps);

describeConformance(MAPLIBRE_SUBJECT);
describeConformance(PAGE_MAP_SUBJECT);
