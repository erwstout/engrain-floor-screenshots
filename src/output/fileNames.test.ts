import { describe, expect, it } from "vitest";
import { floorFileLabel, floorFileName } from "./fileNames";

describe("floorFileLabel", () => {
  it("prefers the short label", () => {
    expect(floorFileLabel({ id: "a", label: "Floor 1", shortLabel: "1" }, 0)).toBe("1");
  });

  it("sanitizes unsafe characters", () => {
    expect(floorFileLabel({ id: "a", label: "", shortLabel: "B1 / Lobby" }, 0)).toBe("B1-Lobby");
  });

  it("falls back to the position", () => {
    expect(floorFileLabel({ id: "a", label: "", shortLabel: "" }, 2)).toBe("3");
  });
});

describe("floorFileName", () => {
  it("joins the asset id and floor label", () => {
    expect(floorFileName("12345", "2")).toBe("12345_floor-2.png");
  });
});
