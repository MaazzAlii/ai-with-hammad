import { describe, expect, it } from "vitest";

import { speakable } from "@/components/site/assistant/voice";

describe("assistant voice text", () => {
  it("drops the lead marker, URLs and markdown before speaking", () => {
    expect(speakable("See **our work** at https://example.com/projects now. [[LEAD_FORM]]")).toBe("See our work at the link in the chat now.");
  });
});
