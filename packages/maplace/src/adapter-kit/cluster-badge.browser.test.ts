import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { unstyledPage } from "../testing/unstyled-page";
import { CLUSTER_CLASS, CLUSTER_STYLES, countBadge } from "./cluster-badge";

afterEach(() => document.body.replaceChildren());

/**
 * A page with its own `css`, then `CLUSTER_STYLES` after it, harder for the page's rules to win
 * than the adopted sheet before them, and a badge inside a holder for custom properties.
 */
function badgeOnPage(css = ""): { badge: HTMLElement; holder: HTMLElement } {
  const styles = [css, CLUSTER_STYLES].map((text) => {
    const style = document.createElement("style");
    style.textContent = text;
    return style;
  });
  const holder = document.createElement("div");
  const badge = countBadge(document, 12);
  holder.append(badge);
  document.body.append(...styles, holder);
  return { badge, holder };
}

describe("CLUSTER_STYLES in a browser", () => {
  it("draws the count in a blue round badge with white text by default", () => {
    const look = getComputedStyle(badgeOnPage().badge);
    expect([look.backgroundColor, look.color, look.height, look.borderRadius]).toEqual([
      "rgb(26, 115, 232)",
      "rgb(255, 255, 255)",
      "32px",
      "16px",
    ]);
  });

  it("takes its colours from the custom properties set on anything above it", () => {
    const { badge, holder } = badgeOnPage();
    holder.style.setProperty("--maplace-cluster-background", "rgb(0, 128, 0)");
    holder.style.setProperty("--maplace-cluster-color", "rgb(0, 0, 0)");
    const look = getComputedStyle(badge);
    expect([look.backgroundColor, look.color]).toEqual(["rgb(0, 128, 0)", "rgb(0, 0, 0)"]);
  });

  it("has no look inside the opt-out", () => {
    onTestFinished(unstyledPage());
    const look = getComputedStyle(badgeOnPage().badge);
    expect([look.backgroundColor, look.borderRadius]).toEqual(["rgba(0, 0, 0, 0)", "0px"]);
  });

  it("gives way to any rule of the page", () => {
    const { badge } = badgeOnPage(`.${CLUSTER_CLASS}{background:rgb(255, 0, 0)}`);
    expect(getComputedStyle(badge).backgroundColor).toBe("rgb(255, 0, 0)");
  });
});
