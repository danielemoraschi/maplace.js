import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import type { Location } from "../location";
import { placedListbox } from "../testing/lists";

const at = { lat: 0, lng: 0 };
const locations: Location[] = [
  { id: "home", title: "Home", ...at },
  { id: "louvre", title: "Louvre", group: "Museums", ...at },
  { id: "orsay", title: "Orsay", group: "Museums", ...at },
  { id: "luxembourg", title: "Luxembourg", group: "Parks", ...at },
];

describe("listbox in a browser: what assistive tech reads", () => {
  it("a named listbox, groups named once, options named and one selected", async () => {
    const { view } = placedListbox(locations, { groupHeadings: true });
    view.renderState({ selectedId: "orsay", hoveredId: undefined });
    await expect.element(page.getByRole("listbox")).toMatchAriaInlineSnapshot(`
      - listbox "Places":
        - /children: deep-equal
        - option "All"
        - option "Home"
        - group "Museums":
          - option "Louvre"
          - option "Orsay" [selected]
        - group "Parks":
          - option "Luxembourg"
    `);
  });
});
