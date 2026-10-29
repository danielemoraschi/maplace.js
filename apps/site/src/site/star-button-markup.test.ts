import { describe, expect, it } from "vitest";
import { starButtonShadow, starCountMarkup } from "./star-button-markup.ts";

const REPO = "https://github.com/o/r";

describe("starCountMarkup", () => {
  it("writes the count with thousands commas, as GitHub's button does", () => {
    expect(starCountMarkup(1234567, REPO)).toContain(">1,234,567</a>");
    expect(starCountMarkup(999, REPO)).toContain(">999</a>");
  });

  it("labels one star in the singular and more in the plural", () => {
    expect(starCountMarkup(1, REPO)).toContain('aria-label="1 stargazer on GitHub"');
    expect(starCountMarkup(2, REPO)).toContain('aria-label="2 stargazers on GitHub"');
  });

  it("links the count to the repository", () => {
    expect(starCountMarkup(5, REPO)).toMatch(
      /^<a class="social-count" href="https:\/\/github\.com\/o\/r"/,
    );
  });
});

describe("starButtonShadow", () => {
  it("links the button to the repository, named for a screen reader", () => {
    expect(starButtonShadow(REPO)).toContain(
      '<a class="btn" href="https://github.com/o/r" rel="noopener" target="_blank" aria-label="Star o/r on GitHub">',
    );
  });
});
