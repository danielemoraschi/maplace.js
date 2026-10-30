import { describe, expect, it } from "vitest";
import {
  AGENT_SKILL_DESCRIPTION,
  AGENT_SKILL_NAME,
  AGENT_SKILL_PATH,
} from "./agent-skill-paths.ts";
import { agentSkillsIndex } from "./agent-skills-index.ts";

const digestOf = (skillMarkdown: string) =>
  JSON.parse(agentSkillsIndex(skillMarkdown)).skills[0].digest;

describe("agentSkillsIndex", () => {
  it("names the one skill with the five fields the spec requires", () => {
    const index = JSON.parse(agentSkillsIndex("text"));
    expect(index.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
    expect(index.skills).toEqual([
      {
        name: AGENT_SKILL_NAME,
        type: "skill-md",
        description: AGENT_SKILL_DESCRIPTION,
        url: AGENT_SKILL_PATH,
        digest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      },
    ]);
  });

  it("gives the sha256 of the text's UTF-8 bytes", () => {
    // printf 'caffè' | shasum -a 256
    expect(digestOf("caffè")).toBe(
      "sha256:07f4328075815d92fe80ac02bdfdebcdae3e72964113e430e86f2ac4d4a455c5",
    );
  });

  it("changes its digest with a byte of the skill", () => {
    expect(digestOf("a")).not.toBe(digestOf("b"));
  });
});
