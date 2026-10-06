import { useCallback, useEffect, useRef, useState } from "react";
import { runCapture } from "./runCapture";
import type { AssetJob, FloorJob } from "./types";

export interface TimeoutPrompt {
  assetId: string;
  floorId: string;
  resolve: (extraSeconds: number | null) => void;
}

interface StartOptions {
  assetIds: string[];
  apiKey: string;
  container: HTMLElement;
  outputDir: FileSystemDirectoryHandle;
  scale: number;
}

export const useCaptureJob = () => {
  const [jobs, setJobs] = useState<AssetJob[]>([]);
  const [running, setRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [timeout, setTimeoutPrompt] = useState<TimeoutPrompt>();
  const abortRef = useRef<AbortController>(undefined);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const onAsset = useCallback((assetId: string, patch: Partial<AssetJob>) => {
    setJobs((prev) => prev.map((job) => (job.assetId === assetId ? { ...job, ...patch } : job)));
  }, []);

  const onFloor = useCallback((assetId: string, floorId: string, patch: Partial<FloorJob>) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.assetId === assetId
          ? { ...job, floors: job.floors.map((f) => (f.id === floorId ? { ...f, ...patch } : f)) }
          : job,
      ),
    );
  }, []);

  const start = useCallback(
    async ({ assetIds, ...rest }: StartOptions) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setJobs(assetIds.map((assetId) => ({ assetId, status: "pending", floors: [] })));
      setRunning(true);
      try {
        await runCapture({
          ...rest,
          assetIds,
          signal: controller.signal,
          onAsset,
          onFloor,
          onCapture: (blob) => setPreviewUrl(URL.createObjectURL(blob)),
          onTimeout: (assetId, floorId) =>
            new Promise((resolve) => setTimeoutPrompt({ assetId, floorId, resolve })),
        });
      } finally {
        setRunning(false);
      }
    },
    [onAsset, onFloor],
  );

  const resolveTimeout = useCallback(
    (extraSeconds: number | null) => {
      timeout?.resolve(extraSeconds);
      setTimeoutPrompt(undefined);
    },
    [timeout],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    resolveTimeout(null);
  }, [resolveTimeout]);

  return { jobs, running, previewUrl, timeout, resolveTimeout, start, cancel };
};
