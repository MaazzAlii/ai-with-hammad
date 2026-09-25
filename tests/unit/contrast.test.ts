import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/** WCAG 2.x contrast ratio of the light and dark design tokens in globals.css. */
function hex(name: string, css: string) {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"));
  if (!m) throw new Error(`token ${name} not found`);
  return m[1]!;
}
function lum(h: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

const PAIRS: [fg: string, bg: string, min: number][] = [
  ["fg", "bg", 4.5],
  ["fg", "surface-2", 4.5],
  ["muted", "bg", 4.5],
  ["muted", "surface", 4.5],
  ["muted", "surface-2", 4.5],
  ["subtle", "bg", 4.5],
  ["subtle", "surface", 4.5],
  ["accent", "bg", 4.5],
  ["accent", "surface", 4.5],
  ["accent-fg", "accent", 4.5],
  ["accent-fg", "accent-2", 4.5],
  ["danger", "surface", 4.5],
  ["success", "surface", 4.5],
  ["warning", "surface", 4.5],
];

describe("colour contrast (WCAG AA)", () => {
  const css = readFileSync(path.resolve(__dirname, "../../src/app/globals.css"), "utf8");
  // Light tokens live in @theme; dark overrides follow the "/* dark */" marker.
  const [light, dark] = css.split("/* dark */");
  if (!dark) throw new Error("dark palette marker not found in globals.css");

  describe.each([
    ["light", light!],
    ["dark", dark],
  ])("%s palette", (_, palette) => {
    it.each(PAIRS)("%s on %s ≥ %s:1", (fg, bg, min) => {
      expect(ratio(hex(fg, palette), hex(bg, palette))).toBeGreaterThanOrEqual(min);
    });
  });
});
