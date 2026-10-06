import { describe, expect, it } from "vitest";
import { loadMap } from "./loadMap";

const stage = () => Object.assign(document.createElement("div"), { id: "stage" });

describe("loadMap", () => {
  it("binds by element id with the API key, then loads the map", async () => {
    const map = await loadMap(stage(), "1167", "<API_KEY>");

    expect(window.unitmap).toHaveBeenCalledWith("stage", "<API_KEY>");
    expect(map.load).toHaveBeenCalledWith("1167");
  });

  it("rejects a container without an id", async () => {
    await expect(loadMap(document.createElement("div"), "1167", "<API_KEY>")).rejects.toThrow("needs an id");
  });
});
