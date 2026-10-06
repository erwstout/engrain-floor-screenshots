import { describe, expect, it, vi } from "vitest";
import { captureFloor } from "./captureFloor";
import { drawRasterImages, rasterImages } from "./compositeImages";
import { serializeSvg } from "./renderSvg";

vi.mock("./compositeImages", () => ({
  isVisible: () => true,
  rasterImages: vi.fn(() => []),
  drawRasterImages: vi.fn(async () => undefined),
}));

const stageWithSvg = () => {
  const stage = document.createElement("div");
  stage.innerHTML = `<svg width="2000" height="2000"><g><image href="https://cdn.example/plan.jpg"/><polyline/></g></svg>`;
  return stage;
};

describe("captureFloor", () => {
  it("draws the background from source, then the vector layer", async () => {
    const stage = stageWithSvg();
    const image = stage.querySelector("image") as SVGImageElement;
    vi.mocked(rasterImages).mockReturnValueOnce([image]);

    const blob = await captureFloor(stage, 4);

    expect(drawRasterImages).toHaveBeenCalledWith(expect.anything(), stage, [image], 4);
    expect(blob.type).toBe("image/png");
  });

  it("fails when the stage has no map svg", async () => {
    await expect(captureFloor(document.createElement("div"), 2)).rejects.toThrow("Map SVG not found");
  });
});

describe("serializeSvg", () => {
  it("drops hidden floors and raster images and sizes to the output", () => {
    const stage = document.createElement("div");
    stage.innerHTML = `<svg width="2000" height="2000">
      <g data-testid="hidden" style="display: none"><polyline/></g>
      <g data-testid="shown"><image href="https://cdn.example/plan.jpg"/><polyline/></g>
    </svg>`;
    document.body.append(stage);

    const markup = serializeSvg(stage.querySelector("svg")!, 8000, 8000);

    expect(markup).not.toContain('data-testid="hidden"');
    expect(markup).toContain('data-testid="shown"');
    expect(markup).not.toContain("plan.jpg");
    expect(markup).toContain('width="8000"');
    expect(markup).toContain('viewBox="0 0 2000 2000"');
    stage.remove();
  });
});
