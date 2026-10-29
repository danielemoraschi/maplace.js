// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { starButtonShadow } from "../site/star-button-markup.ts";
import { STAR_COUNT_PATH } from "../site/star-count-api.ts";
import { showStarCount } from "./star-count.ts";

const REPO = "https://github.com/o/r";

/** Two star buttons, as the hero draws one: GitHub's button in an open shadow root. */
function drawButtons(): HTMLElement[] {
  document.body.innerHTML = "<span data-star-button></span><span data-star-button></span>";
  const buttons = [...document.querySelectorAll<HTMLElement>("[data-star-button]")];
  for (const button of buttons) {
    button.attachShadow({ mode: "open" }).innerHTML = starButtonShadow(REPO);
  }
  return buttons;
}

const countOf = (button: HTMLElement) =>
  button.shadowRoot?.querySelector(".widget .social-count")?.textContent;

const answering = (response: () => Response) => vi.fn(async () => response());

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("showStarCount", () => {
  it("adds the count to each star button", async () => {
    const buttons = drawButtons();
    const ask = answering(() => Response.json({ stars: 1234 }));
    await showStarCount(document, ask);
    expect(buttons.map(countOf)).toEqual(["1,234", "1,234"]);
    expect(ask).toHaveBeenCalledOnce();
    expect(ask).toHaveBeenCalledWith(STAR_COUNT_PATH);
  });

  it("asks nothing on a page without one", async () => {
    const ask = answering(() => Response.json({ stars: 1 }));
    await showStarCount(document, ask);
    expect(ask).not.toHaveBeenCalled();
  });

  it("leaves the buttons without a count when the site gives none: an error, not a count, HTML, or no answer", async () => {
    const failures = [
      answering(() => Response.json({ error: "star count unavailable" }, { status: 503 })),
      answering(() => Response.json({ stars: "many" })),
      answering(() => new Response("<!doctype html><title>maplacejs</title>", { status: 200 })),
      vi.fn(async (): Promise<Response> => {
        throw new TypeError("offline");
      }),
    ];
    for (const ask of failures) {
      const buttons = drawButtons();
      await showStarCount(document, ask);
      expect(buttons.map(countOf)).toEqual([undefined, undefined]);
    }
  });
});
