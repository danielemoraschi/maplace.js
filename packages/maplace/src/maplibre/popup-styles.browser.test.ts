import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { POPUP_CLASS, POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
import { darkPage } from "../google/testing/dark-page";
import { unstyledPage } from "../testing/unstyled-page";
import { POPUP_STYLES } from "./popup-styles";

afterEach(() => document.body.replaceChildren());

/** A popup's content element holding `html`, on a page with `POPUP_STYLES`. */
function popupHolding(html: string): HTMLElement {
  const style = document.createElement("style");
  style.textContent = POPUP_STYLES;
  const popup = document.createElement("div");
  popup.className = POPUP_CLASS;
  popup.innerHTML = html;
  document.body.append(style, popup);
  return popup;
}

/** A popup's heading, on the page beside the content. */
function headingOnPage(): HTMLElement {
  const heading = document.createElement("span");
  heading.className = POPUP_HEADING_CLASS;
  document.body.append(heading);
  return heading;
}

/** A popup's heading inside MapLibre's popup content, as MapLibre holds it. */
function headingInMapLibresPopup(): HTMLElement {
  const content = document.createElement("div");
  content.className = "maplibregl-popup-content";
  content.append(headingOnPage());
  document.body.append(content);
  return content.firstElementChild as HTMLElement;
}

describe("POPUP_STYLES in a browser", () => {
  it("keeps the content and heading dark on MapLibre's white bubble, on a dark page", () => {
    darkPage();
    const popup = popupHolding("<p>One</p>");
    const heading = headingOnPage();
    for (const element of [popup, heading]) {
      expect(getComputedStyle(element).color).toBe("rgb(31, 31, 31)");
      expect(getComputedStyle(element).colorScheme).toBe("light");
    }
  });

  it("turns off inside the opt-out: the page's text colour", () => {
    onTestFinished(unstyledPage());
    document.body.style.color = "red";
    onTestFinished(() => {
      document.body.style.color = "";
    });
    const popup = popupHolding("<p>One</p>");
    const heading = headingOnPage();
    expect([getComputedStyle(popup).color, getComputedStyle(heading).color]).toEqual([
      "rgb(255, 0, 0)",
      "rgb(255, 0, 0)",
    ]);
  });

  it("keeps the heading on its own line, bold", () => {
    popupHolding("<p>One</p>");
    const heading = getComputedStyle(headingInMapLibresPopup());
    expect([heading.display, heading.fontWeight]).toEqual(["block", "600"]);
  });

  it("styles no heading outside MapLibre's popup: Google's keeps its own look", () => {
    popupHolding("<p>One</p>");
    expect(getComputedStyle(headingOnPage()).display).toBe("inline");
  });
});
