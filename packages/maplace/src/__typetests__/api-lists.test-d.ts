// Each list in api-lists.ts names exactly the members of its type.
import type { Capability, MaplaceEventName, MisuseCode, RuntimeCode } from "maplace";
import { expectTypeOf } from "vitest";
import type { API_LISTS } from "./api-lists";

expectTypeOf<(typeof API_LISTS.misuseCodes)[number]>().toEqualTypeOf<MisuseCode>();
expectTypeOf<(typeof API_LISTS.runtimeCodes)[number]>().toEqualTypeOf<RuntimeCode>();
expectTypeOf<(typeof API_LISTS.events)[number]>().toEqualTypeOf<MaplaceEventName>();
expectTypeOf<(typeof API_LISTS.capabilities)[number]>().toEqualTypeOf<Capability>();
