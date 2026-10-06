import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchMaps } from "../unitmap/api";
import { createMockDir } from "../test/mockFileSystem";
import { createMockUnitmap } from "../test/mockUnitmap";
import { runCapture, type RunOptions } from "./runCapture";
import { SettleTimeoutError, waitForSettled } from "./waitForSettled";

vi.mock("../unitmap/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../unitmap/api")>()),
  fetchMaps: vi.fn(),
}));

const fetchMapsMock = vi.mocked(fetchMaps);

const buildOptions = (assetIds: string[], overrides: Partial<RunOptions> = {}): RunOptions => ({
  assetIds,
  apiKey: "<API_KEY>",
  container: document.body.appendChild(Object.assign(document.createElement("div"), { id: "stage" })),
  outputDir: createMockDir(),
  scale: 4,
  signal: new AbortController().signal,
  onAsset: vi.fn(),
  onFloor: vi.fn(),
  onCapture: vi.fn(),
  onTimeout: vi.fn(async () => null),
  ...overrides,
});

beforeEach(() => {
  document.getElementById("stage")?.remove();
  fetchMapsMock.mockImplementation(async (assetId) =>
    assetId === "missing" ? [] : [{ id: `map-${assetId}`, asset_id: assetId, name: `Map ${assetId}`, tags: [] }],
  );
});

describe("runCapture", () => {
  it("writes one png per floor into an asset folder", async () => {
    const outputDir = createMockDir();
    const opts = buildOptions(["100", "200"], { outputDir });

    await runCapture(opts);

    expect((outputDir as unknown as { written: string[] }).written).toEqual([
      "100/100_floor-1.png",
      "100/100_floor-2.png",
      "200/200_floor-1.png",
      "200/200_floor-2.png",
    ]);
    expect(opts.onAsset).toHaveBeenCalledWith("200", { status: "done" });
  });

  it("marks a failed asset and continues the batch", async () => {
    const opts = buildOptions(["missing", "100"]);

    await runCapture(opts);

    expect(opts.onAsset).toHaveBeenCalledWith("missing", {
      status: "error",
      error: "No Unit Map found for this asset",
    });
    expect(opts.onAsset).toHaveBeenCalledWith("100", { status: "done" });
  });

  it("reports SDK load errors", async () => {
    window.unitmap = createMockUnitmap(undefined, { fail: true });
    const opts = buildOptions(["100"]);

    await runCapture(opts);

    expect(opts.onAsset).toHaveBeenCalledWith("100", { status: "error", error: "boom" });
  });

  it("asks for more time on a timeout and retries with that budget", async () => {
    vi.mocked(waitForSettled).mockRejectedValueOnce(new SettleTimeoutError(90_000));
    const onTimeout = vi.fn(async () => 30);
    const opts = buildOptions(["100"], { onTimeout });

    await runCapture(opts);

    expect(onTimeout).toHaveBeenCalledWith("100", "f1");
    expect(opts.onFloor).toHaveBeenCalledWith("100", "f1", expect.objectContaining({ status: "paused" }));
    expect(vi.mocked(waitForSettled).mock.calls[1][1]).toEqual({ timeoutMs: 30_000 });
    expect(opts.onAsset).toHaveBeenCalledWith("100", { status: "done" });
  });

  it("skips the floor when the user declines more time", async () => {
    vi.mocked(waitForSettled).mockRejectedValueOnce(new SettleTimeoutError(90_000));
    const outputDir = createMockDir();
    const opts = buildOptions(["100"], { outputDir, onTimeout: vi.fn(async () => null) });

    await runCapture(opts);

    expect(opts.onFloor).toHaveBeenCalledWith("100", "f1", expect.objectContaining({ status: "error" }));
    expect((outputDir as unknown as { written: string[] }).written).toEqual(["100/100_floor-2.png"]);
    expect(opts.onAsset).toHaveBeenCalledWith("100", { status: "error", error: "1 floor(s) failed" });
  });

  it("stops when aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const opts = buildOptions(["100"], { signal: controller.signal });

    await runCapture(opts);

    expect(fetchMapsMock).not.toHaveBeenCalled();
  });
});
