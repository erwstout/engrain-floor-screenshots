import { fetchMaps, pickMap } from "../unitmap/api";
import { disposeMap, loadMap, showFloor } from "../unitmap/loadMap";
import type { UnitMap } from "../unitmap/types";
import { floorFileLabel } from "../output/fileNames";
import { writePng } from "../output/writeFiles";
import { captureFloor } from "./captureFloor";
import { SETTLE_TIMEOUT_MS, SettleTimeoutError, waitForSettled } from "./waitForSettled";
import type { AssetJob, FloorJob } from "./types";

export interface RunOptions {
  assetIds: string[];
  apiKey: string;
  container: HTMLElement;
  outputDir: FileSystemDirectoryHandle;
  scale: number;
  signal: AbortSignal;
  onAsset: (assetId: string, patch: Partial<AssetJob>) => void;
  onFloor: (assetId: string, floorId: string, patch: Partial<FloorJob>) => void;
  onCapture: (blob: Blob) => void;
  /** Asks the user what to do after a load timeout: extra seconds to wait, or null to skip. */
  onTimeout: (assetId: string, floorId: string) => Promise<number | null>;
}

// Waits for the floor to settle, asking the user for more time on each timeout.
const settleFloor = async (assetId: string, floorId: string, label: string, opts: RunOptions) => {
  let timeoutMs = SETTLE_TIMEOUT_MS;
  for (;;) {
    try {
      return await waitForSettled(opts.container, { timeoutMs });
    } catch (err) {
      if (!(err instanceof SettleTimeoutError) || opts.signal.aborted) throw err;
      opts.onFloor(assetId, floorId, { status: "paused", error: err.message });
      opts.onAsset(assetId, { phase: `Floor ${label}: timed out` });
      const extraSeconds = await opts.onTimeout(assetId, floorId);
      if (extraSeconds === null) throw err;
      timeoutMs = extraSeconds * 1000;
      opts.onFloor(assetId, floorId, { status: "running", error: undefined });
      opts.onAsset(assetId, { phase: `Floor ${label}: waiting ${extraSeconds}s more…` });
    }
  }
};

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

const captureAsset = async (assetId: string, opts: RunOptions) => {
  const { apiKey, container, outputDir, scale, signal, onAsset, onFloor, onCapture } = opts;
  let map: UnitMap | undefined;

  try {
    onAsset(assetId, { phase: "Finding map…" });
    const apiMap = pickMap(await fetchMaps(assetId, apiKey));
    if (!apiMap) throw new Error("No Unit Map found for this asset");

    onAsset(assetId, { phase: "Loading map…", mapName: apiMap.name });
    map = await loadMap(container, apiMap.id, apiKey);
    const floors = map.floors().data().map((floor, i) => ({ ...floor, fileLabel: floorFileLabel(floor, i) }));
    onAsset(assetId, {
      phase: undefined,
      floors: floors.map((f) => ({ id: f.id, label: f.fileLabel, status: "pending" })),
    });

    let failures = 0;
    for (const floor of floors) {
      if (signal.aborted) return;
      onFloor(assetId, floor.id, { status: "running" });
      onAsset(assetId, { phase: `Floor ${floor.fileLabel}: waiting for images…` });
      try {
        showFloor(map, floor.id);
        await settleFloor(assetId, floor.id, floor.fileLabel, opts);
        onAsset(assetId, { phase: `Floor ${floor.fileLabel}: capturing…` });
        const blob = await captureFloor(container, scale);
        await writePng(outputDir, assetId, floor.fileLabel, blob);
        onCapture(blob);
        onFloor(assetId, floor.id, { status: "done" });
      } catch (err) {
        failures++;
        onFloor(assetId, floor.id, { status: "error", error: errorMessage(err) });
      }
    }

    onAsset(assetId, failures ? { status: "error", error: `${failures} floor(s) failed` } : { status: "done" });
  } catch (err) {
    onAsset(assetId, { status: "error", error: errorMessage(err) });
  } finally {
    disposeMap(map, container);
  }
};

// Sequential on purpose: one live map at a time keeps memory and API load low.
export const runCapture = async (opts: RunOptions) => {
  for (const assetId of opts.assetIds) {
    if (opts.signal.aborted) return;
    opts.onAsset(assetId, { status: "running" });
    await captureAsset(assetId, opts);
  }
};
