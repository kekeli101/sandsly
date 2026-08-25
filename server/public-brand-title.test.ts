import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("public restaurant title", () => {
  it("uses The Crunch Bite in the HTML document title", () => {
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");
    expect(html).toContain("<title>The Crunch Bite</title>");
    expect(html).not.toContain("<title>Sandsly</title>");
  });
});
