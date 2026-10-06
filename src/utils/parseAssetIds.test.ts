import { describe, expect, it } from "vitest";
import { parseAssetIds } from "./parseAssetIds";

describe("parseAssetIds", () => {
  it("splits on commas, whitespace, and newlines", () => {
    expect(parseAssetIds("1, 2\n3  4;5")).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("dedupes and drops empties", () => {
    expect(parseAssetIds(" 1,,1\n\n2 ")).toEqual(["1", "2"]);
  });
});
