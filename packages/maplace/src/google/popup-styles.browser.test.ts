import { afterEach, describe, expect, it, onTestFinished } from "vitest";
import { POPUP_CLASS, POPUP_HEADING_CLASS } from "../adapter-kit/popup-content";
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

/** The outer margins of `popup`'s paragraphs: the first's top and the last's bottom. */
function outerMargins(popup: HTMLElement): string[] {
  const paragraphs = [...popup.querySelectorAll("p")].map((p) => getComputedStyle(p));
  return [paragraphs[0]?.marginTop ?? "", paragraphs.at(-1)?.marginBottom ?? ""];
}

describe("POPUP_STYLES in a browser", () => {
  it("insets its content from the bubble's right and bottom as Google does its left", () => {
    expect(getComputedStyle(popupHolding("<p>One</p>")).padding).toBe("0px 12px 12px 0px");
  });

  it("keeps the browser's paragraph margins out of the bubble, between paragraphs only", () => {
    const popup = popupHolding("<p>One</p><p>Two</p>");
    expect(outerMargins(popup)).toEqual(["0px", "0px"]);
    expect(getComputedStyle(popup.querySelector("p") as Element).marginBottom).not.toBe("0px");
  });

  it("does so through one wrapper too, as React's content sits in its portal's element", () => {
    expect(outerMargins(popupHolding("<div><p>One</p><p>Two</p></div>"))).toEqual(["0px", "0px"]);
  });

  it("turns off inside the opt-out: the page's text colour, no inset", () => {
    onTestFinished(unstyledPage());
    document.body.style.color = "red";
    onTestFinished(() => {
      document.body.style.color = "";
    });
    const popup = popupHolding("<p>One</p>");
    const heading = document.createElement("span");
    heading.className = POPUP_HEADING_CLASS;
    document.body.append(heading);
    expect([getComputedStyle(popup).color, getComputedStyle(heading).color]).toEqual([
      "rgb(255, 0, 0)",
      "rgb(255, 0, 0)",
    ]);
    expect(getComputedStyle(popup).padding).toBe("0px");
  });

  it("keeps the heading dark on Google's white bubble, whatever the page's text", () => {
    popupHolding("<p>One</p>");
    document.body.style.color = "white";
    const heading = document.createElement("span");
    heading.className = POPUP_HEADING_CLASS;
    document.body.append(heading);
    expect(getComputedStyle(heading).color).toBe("rgb(31, 31, 31)");
  });
});
