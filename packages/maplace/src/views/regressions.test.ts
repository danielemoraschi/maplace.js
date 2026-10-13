// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createListView } from "../list-view";
import { createMaplace } from "../maplace/create";

// 0.2 scenarios about the list (RFC Appendix A, regression-test candidates).

describe("#94, #161: setting locations again doesn't duplicate the list", () => {
  it("keeps one list with one option per location", () => {
    const locations = ["a", "b"].map((id) => ({ id, lat: 0, lng: 0 }));
    const maplace = createMaplace({ locations });
    const list = createListView(maplace);
    document.body.replaceChildren(list.element);
    maplace.setLocations(locations.map((location) => ({ ...location })));
    maplace.setLocations([...locations]);
    expect(document.querySelectorAll('[role="listbox"]')).toHaveLength(1);
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(2);
  });
});
